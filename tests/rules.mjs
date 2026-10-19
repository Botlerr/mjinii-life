// tests/rules.mjs — the economy and fail-state rules: day budget, rest limit,
// hunger gate, pay balance, eviction, relationship decay
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const base = '../src/';
const { state, reset, canAct, useSlot, defaultNpcState, evict } = await import(base + 'state.js');
const { actionMap } = await import(base + 'actions.js');
const { advanceDay } = await import(base + 'turn.js');
const npcMod = await import(base + 'npcs.js');
const { visitNpc, applyDecay, missHint, daysSinceContact, DECAY_AFTER_DAYS, DECAY_PER_WEEK, MISS_HINT_DAYS } = npcMod;
const { archetypes, DAY_SLOTS, WORK_HUNGER_MIN, EVICTED_ROOM, EVICTED_RENT } = await import(base + 'content.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};
const text = r => (typeof r === 'string' ? r : r.text);
const refused = r => typeof r === 'object' && r.refused === true;

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

console.log('\n[4] Pay balance (the inversion fix)');
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

console.log('\n[5] Eviction');
fresh();
state.rentDueDay = 1; state.money = 0;
let lines = advanceDay(state);
ok('first miss warns', lines.some(l => l.text.includes('EVICTION RISK')), JSON.stringify(lines.map(l => l.text)));
ok('first miss does not evict', state.room === archetypes.omo.room && state.missedRent === 1);
state.rentDueDay = 1; state.money = 0;
lines = advanceDay(state);
ok('second miss evicts', lines.some(l => l.text.includes('EVICTED')), JSON.stringify(lines.map(l => l.text)));
ok('room downgraded', state.room === EVICTED_ROOM, state.room);
ok('rent downgraded', state.rent === EVICTED_RENT, `${state.rent}`);
ok('miss counter reset after eviction', state.missedRent === 0);

fresh();
state.rentDueDay = 1; state.money = 0;
advanceDay(state);
state.rentDueDay = 1; state.money = 50000;
lines = advanceDay(state);
ok('paying clears the miss counter', state.missedRent === 0, `${state.missedRent}`);
// Assert on the log line, not the balance: a random event can also move money that turn.
ok('paying charges the current rent',
   lines.some(l => l.text.includes(`RENT PAID: KES ${archetypes.omo.rent.toLocaleString()}`)),
   JSON.stringify(lines.map(l => l.text)));
ok('no eviction when paid', !lines.some(l => l.text.includes('EVICTED')));

fresh();
state.rent = EVICTED_RENT; state.rentDueDay = 1; state.money = 50000;
const linesEv = advanceDay(state);
ok('after eviction the lower rent is what gets charged',
   linesEv.some(l => l.text.includes(`RENT PAID: KES ${EVICTED_RENT.toLocaleString()}`)),
   JSON.stringify(linesEv.map(l => l.text)));

console.log('\n[6] Relationship decay');
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
