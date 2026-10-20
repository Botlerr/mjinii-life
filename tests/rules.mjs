// tests/rules.mjs — the economy and fail-state rules: day budget, rest limit,
// hunger gate, pay balance, eviction, relationship decay
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const base = '../src/';
const { state, reset, canAct, useSlot, defaultNpcState } = await import(base + 'state.js');
const { actionMap } = await import(base + 'actions.js');
const { advanceDay, hungerPenalty, recomputeHappiness } = await import(base + 'turn.js');
const { setRng } = await import(base + 'rng.js');
const { rollFor } = await import(base + 'events.js');
const { visitNpc, applyDecay, missHint, daysSinceContact, DECAY_AFTER_DAYS, DECAY_PER_WEEK, MISS_HINT_DAYS } = await import(base + 'npcs.js');
const { archetypes, DAY_SLOTS, WORK_HUNGER_MIN, HUNGER_PENALTY, HUSTLE_HUNGER_MIN, HUSTLE_HUNGRY_RATE } = await import(base + 'content.js');
const { reputation, bumpReputation, repDelta, isGameOver, runSummary, FAIL_REASONS } = await import(base + 'run.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};
const text = r => (typeof r === 'string' ? r : r.text);
const refused = r => typeof r === 'object' && r.refused === true;
// pulls the KES amount out of a hustle line so the pay rate can be compared
const earnOf = r => {
  const t = text(r) || '';
  const m = t.match(/earned KES ([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
};

function fresh(type = 'omo') {
  state.type = type;
  state.money = archetypes[type].money;
  state.rent = archetypes[type].rent;
  state.room = archetypes[type].room;
  state.career = archetypes[type].career;
  state.day = 1; state.energy = 60; state.hunger = 60; state.fun = 50;
  state.hygiene = 60; state.social = 50; state.happiness = 70;
  state.rentDueDay = 6; state.missedRent = 0;
  state.slots = DAY_SLOTS; state.restedToday = false;
  state.reputation = 50; state.gameOver = null;
  state.eventLog = []; state.npcs = defaultNpcState();
}

console.log('\n[1] Day budget');
ok(`DAY_SLOTS is ${DAY_SLOTS}`, DAY_SLOTS === 4);
fresh();
ok('a fresh day has a full budget', state.slots === DAY_SLOTS);
ok('canAct with slots and energy', canAct() === true);
useSlot();
ok('useSlot decrements', state.slots === DAY_SLOTS - 1, `${state.slots}`);
state.slots = 1; useSlot(); useSlot();
ok('slots floor at 0', state.slots === 0);
ok('canAct false at 0 slots', canAct() === false);
state.slots = 2; state.energy = 0;
ok('canAct stays true at 0 energy (Rest must stay reachable)', canAct() === true);
ok('but hard work is refused when exhausted', refused(actionMap.work()));

fresh();
advanceDay(state);
ok('advanceDay refills the budget', state.slots === DAY_SLOTS, `${state.slots}`);

console.log('\n[2] One rest per day');
fresh();
const e0 = state.energy;
const r1 = actionMap.rest();
ok('first rest works', !refused(r1) && state.energy === e0 + 25, `${state.energy}`);
const r2 = actionMap.rest();
ok('second rest refused', refused(r2), JSON.stringify(r2));
ok('second rest changes nothing', state.energy === e0 + 25);
advanceDay(state);
ok('rest available again next day', !refused(actionMap.rest()));

console.log('\n[3] Hunger gate (with an escape hatch)');
fresh();
state.hunger = WORK_HUNGER_MIN - 1;
const before = state.money;
const rw = actionMap.work();
ok('work refused when starving', refused(rw), JSON.stringify(rw));
ok('refused work pays nothing', state.money === before);
state.hunger = WORK_HUNGER_MIN;
ok('work allowed at the threshold', !refused(actionMap.work()));
state.hunger = 0; state.money = 0;
ok('side hustle still open when broke and starving', !refused(actionMap.side_hustle()));
ok('so a starving player can always earn', state.money > 0, `${state.money}`);

console.log('\n[4] Hunger is a real cost, not just a gate');
ok('the penalty ladder is defined', Array.isArray(HUNGER_PENALTY) && HUNGER_PENALTY.length === 3);
ok('starving costs the most', HUNGER_PENALTY[0].energy > HUNGER_PENALTY[1].energy &&
                                 HUNGER_PENALTY[1].energy > HUNGER_PENALTY[2].energy);
ok('well-fed days cost nothing', hungerPenalty({ hunger: 60 }) === null);
ok('hungry days cost energy', hungerPenalty({ hunger: 20 }).energy > 0);
ok('starving costs the most of all', hungerPenalty({ hunger: 0 }).energy > hungerPenalty({ hunger: 20 }).energy);

fresh();
state.hunger = 0; state.energy = 50;
setRng(() => rollFor('landlord'));            // an event with no energy effect
const starveE0 = state.energy;
const hungerLines = advanceDay(state);
ok('starving applies the overnight energy cost', state.energy === starveE0 - HUNGER_PENALTY[0].energy - 10,
   `energy ${starveE0}->${state.energy}`);
ok('the cost is announced', hungerLines.some(l => l.text.includes('starving')), JSON.stringify(hungerLines.map(l => l.text)));

fresh();
state.hunger = 60; state.energy = 50;
setRng(() => rollFor('landlord'));
advanceDay(state);
ok('a fed player pays no hunger cost', state.energy === 40, `${state.energy}`);

// hunger is in the mood formula: starving cannot be cheerful
fresh();
state.hunger = 0; state.energy = 60; state.social = 60; state.fun = 60; state.hygiene = 60;
recomputeHappiness(state);
const starvingMood = state.happiness;
fresh();
state.hunger = 100; state.energy = 60; state.social = 60; state.fun = 60; state.hygiene = 60;
recomputeHappiness(state);
const fedMood = state.happiness;
ok('hunger is part of mood', fedMood > starvingMood, `${starvingMood} vs ${fedMood}`);
ok('happiness still lands in range', starvingMood >= 0 && starvingMood <= 100 && fedMood <= 100);
ok('a starving player loses mood', fedMood - starvingMood >= 4, `delta ${fedMood - starvingMood}`);

// and it recovers when you eat
fresh();
state.hunger = 0;
recomputeHappiness(state);
const beforeEat = state.happiness;
actionMap.eat_ugali();
recomputeHappiness(state);
ok('eating lifts mood back up', state.happiness > beforeEat, `${beforeEat} -> ${state.happiness}`);

// hustling on an empty stomach pays less
fresh();
state.hunger = 50;
let fed = 0, fedN = 20;
for (let i = 0; i < fedN; i++) fed += earnOf(actionMap.side_hustle());
fresh();
state.hunger = 0;
let starved = 0;
for (let i = 0; i < fedN; i++) starved += earnOf(actionMap.side_hustle());
ok(`hustling hungry pays less (${starved} vs ${fed})`, starved < fed, `${starved} vs ${fed}`);
ok('the rate is the documented one', Math.round(HUSTLE_HUNGRY_RATE * 100) === 60);

console.log('\n[5] Pay balance (the inversion fix)');
const ratios = [];
for (const [k, a] of Object.entries(archetypes)) {
  if (a.rent === 0) continue;
  const ratio = a.rent / a.pay;
  ratios.push({ k, ratio });
  ok(`${k}: rent costs 4-8 work-actions (${ratio.toFixed(1)})`, ratio >= 4 && ratio <= 8, `${ratio}`);
}
const rs = ratios.map(r => r.ratio);
const spread = Math.max(...rs) / Math.min(...rs);
ok(`no archetype is wildly harder (spread ${spread.toFixed(2)}x)`, spread <= 1.6, `${spread}`);
ok('lapo start raised to 2,500', archetypes.lapo.money === 2500, `${archetypes.lapo.money}`);
ok('lapo pay still the lowest', Object.values(archetypes).every(a => a.pay >= archetypes.lapo.pay));

console.log('\n[5] The rent ladder: warn, then a grace cycle, then eviction');
fresh();
state.rentDueDay = 1; state.money = 0;
let lines = advanceDay(state);
ok('first miss warns', lines.some(l => l.text.includes('EVICTION WARNING')), JSON.stringify(lines.map(l => l.text)));
ok('first miss does NOT end the run', !isGameOver(state), `${state.gameOver}`);
ok('first miss leaves the room alone', state.room === archetypes.omo.room);
ok('grace cycle: the next rent date is set', state.rentDueDay === 6, `${state.rentDueDay}`);

// miss again with no money -> the run is over
state.rentDueDay = 1; state.money = 0;
lines = advanceDay(state);
ok('second miss logs EVICTED', lines.some(l => l.text.includes('EVICTED')), JSON.stringify(lines.map(l => l.text)));
ok('second miss ends the run', isGameOver(state), `${state.gameOver}`);
ok('gameOver reason is evicted', state.gameOver === 'evicted', `${state.gameOver}`);
ok('eviction stops further days', advanceDay(state).length === 0);
ok('no actions available once over', canAct(state) === false);

// the summary the "start again" screen shows
const sum = runSummary(state);
ok('summary names the cause', sum.title === FAIL_REASONS.evicted.title, sum.title);
ok('summary carries the run stats',
   sum.day > 1 && typeof sum.rentPaid === 'number' && typeof sum.rentMissed === 'number',
   JSON.stringify({ day: sum.day, paid: sum.rentPaid, missed: sum.rentMissed }));
ok('summary names the archetype', sum.archetype.length > 0, sum.archetype);
ok('summary lists the closest bond', sum.bestFriend !== null && sum.bestFriend.name.length > 0,
   JSON.stringify(sum.bestFriend));

// the grace period does its job when it is used
fresh();
state.rentDueDay = 1; state.money = 0;
advanceDay(state);
ok('strike recorded', state.missedRent === 1, `${state.missedRent}`);
state.rentDueDay = 1; state.money = 50000;
lines = advanceDay(state);
ok('paying during grace clears the strike', state.missedRent === 0, `${state.missedRent}`);
ok('paying charges the current rent',
   lines.some(l => l.text.includes(`RENT PAID: KES ${state.rent.toLocaleString()}`)),
   JSON.stringify(lines.map(l => l.text)));
ok('no eviction when paid', !isGameOver(state));

console.log('\n[6] Reputation is the second way a run ends');
fresh();
ok('reputation starts at 50', reputation(state) === 50, `${reputation(state)}`);
ok('reputation is not fatal at 1', !isGameOver(state));
bumpReputation(-49, state);
ok('reputation tracks the change', reputation(state) === 1, `${reputation(state)}`);
bumpReputation(-1, state);
ok('reputation at zero ends the run', isGameOver(state), `${state.gameOver}`);
ok('gameOver reason is reputation', state.gameOver === 'reputation', `${state.gameOver}`);
ok('reputation is clamped to 0', reputation(state) === 0);

fresh();
ok('non-Nepo archetypes have no daily drain', repDelta(state) === 0, `${repDelta(state)}`);
state.type = 'nepo';
ok('Nepo has a daily reputation drain', repDelta(state) === 2, `${repDelta(state)}`);
const rep0 = reputation(state);
const drainLines = advanceDay(state);
// A random event can also move reputation that day, so assert the direction and
// the announcement rather than an exact figure.
ok('Nepo loses reputation overnight', reputation(state) < rep0, `${rep0} -> ${reputation(state)}`);
ok('the drain is announced', drainLines.some(l => l.text.includes('family is talking')),
   JSON.stringify(drainLines.map(l => l.text)));
ok('but it takes many days to fall', !isGameOver(state));

fresh();
state.type = 'nepo';
state.reputation = 1;
setRng(rollFor('landlord'));
const fatalLines = advanceDay(state);
ok('hitting zero during a day ends the run', state.gameOver === 'reputation', `${state.gameOver}`);
ok('the end is announced', fatalLines.some(l => l.text.includes('name is mud')), JSON.stringify(fatalLines.map(l => l.text)));

console.log('\n[7] Relationship decay');
fresh();
const shiro = state.npcs.shiro;
shiro.rel = 60; shiro.lastContact = 1;
state.day = 1 + (MISS_HINT_DAYS - 1);
ok('no hint before the miss window', missHint('shiro') === null, `${missHint('shiro')}`);
state.day = 1 + MISS_HINT_DAYS;
ok('hint appears before any drop', missHint('shiro') !== null && shiro.rel === 60, `${missHint('shiro')}`);
ok('hint names the NPC', missHint('shiro').includes('Shiro'));

state.day = 1 + DECAY_AFTER_DAYS - 1;
ok('no decay one day short', applyDecay(state).length === 0 && shiro.rel === 60, `${shiro.rel}`);
state.day = 1 + DECAY_AFTER_DAYS;
let decayLines = applyDecay(state);
ok(`decay fires at ${DECAY_AFTER_DAYS} days`, shiro.rel === 60 - DECAY_PER_WEEK, `${shiro.rel}`);
ok('decay is announced', decayLines.length === 1 && decayLines[0].text.includes('Shiro'));
ok('decay restarts the clock', shiro.lastContact === state.day);
ok('decay does not stack daily', applyDecay(state).length === 0 && shiro.rel === 60 - DECAY_PER_WEEK);

fresh();
state.npcs.shiro.rel = 60; state.npcs.shiro.lastContact = 1;
state.day = 1 + DECAY_AFTER_DAYS * 2;
applyDecay(state);
ok('two missed weeks cost twice', state.npcs.shiro.rel === 60 - DECAY_PER_WEEK * 2, `${state.npcs.shiro.rel}`);

fresh();
state.npcs.shiro.rel = 2; state.npcs.shiro.lastContact = 1;
state.day = 1 + DECAY_AFTER_DAYS;
applyDecay(state);
ok('decay floors at 0', state.npcs.shiro.rel === 0, `${state.npcs.shiro.rel}`);

fresh();
state.npcs.shiro.rel = 60; state.npcs.shiro.lastContact = 1;
state.day = 1 + DECAY_AFTER_DAYS;
state.energy = 80;
visitNpc('shiro');
ok('visiting resets the neglect clock', daysSinceContact('shiro') === 0, `${daysSinceContact('shiro')}`);
ok('no decay after a visit', applyDecay(state).length === 0);

fresh();
state.day = 1 + DECAY_AFTER_DAYS * 3;
ok('never-met NPCs never decay', applyDecay(state).length === 0);

console.log('\n[7] Refusals are marked so the router can skip the slot');
fresh();
state.hunger = 0;
ok('work refusal carries refused:true', refused(actionMap.work()));
state.money = 0;
ok('eat refusal carries refused:true', refused(actionMap.eat_ugali()));
ok('successful actions are not marked refused', !refused(actionMap.side_hustle()));

console.log('\n[8] No dead end: recovery from rock bottom');
fresh();
state.energy = 0; state.money = 0; state.hunger = 0; state.slots = DAY_SLOTS;
ok('work refused at rock bottom', refused(actionMap.work()));
ok('eating refused with no money', refused(actionMap.eat_ugali()));
ok('side hustle refused with no energy', refused(actionMap.side_hustle()));
const rr = actionMap.rest();
ok('rest is always available', !refused(rr), JSON.stringify(rr));
ok('rest restores energy from zero', state.energy === 25, `${state.energy}`);
ok('then a side hustle is possible', !refused(actionMap.side_hustle()));
ok('and with money, food is possible', state.money > 0 && !refused(actionMap.eat_ugali()));
ok('hunger recovered', state.hunger > 0, `${state.hunger}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
