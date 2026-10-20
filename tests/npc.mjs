// tests/npc.mjs — interactive NPC system: relationships, visits, gifts, perks, persistence
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const { state, save, load, hasSave, reset, ensureNpcState, defaultNpcState, START_REL } = await import('../src/state.js');
const npcMod = await import('../src/npcs.js');
const { visitNpc, giftNpc, tierOf, clampRel, npcState, relationship, maybeNpcEvent, VISIT_ENERGY } = npcMod;
const { npcs, gifts } = await import('../src/content.js');
const { advanceDay } = await import('../src/turn.js');
const { setRng } = await import('../src/rng.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

// Deterministic randomness for perk tests.
// Cover BOTH random sources: visitNpc still rolls Math.random for perks, while
// maybeNpcEvent uses the shared injected rng.
const withRandom = (v, fn) => {
  const prev = Math.random;
  Math.random = () => v;
  setRng(() => v);
  try { return fn(); } finally { Math.random = prev; setRng(null); }
};

function freshNpcs() {
  state.npcs = defaultNpcState();
  state.day = 1; state.money = 50000; state.energy = 80; state.social = 50;
  state.hunger = 50; state.happiness = 50;
}
const nextDay = () => { state.day++; };

console.log('\n[1] Tiers and clamping');
ok('tierOf(0) is Stranger', tierOf(0).key === 'cold' && tierOf(0).label === 'Stranger');
ok('tierOf(24) is Stranger', tierOf(24).key === 'cold');
ok('tierOf(25) is Acquaintance', tierOf(25).key === 'neutral');
ok('tierOf(50) is Friend', tierOf(50).key === 'warm');
ok('tierOf(75) is Close', tierOf(75).key === 'close');
ok('tierOf(100) is Close', tierOf(100).key === 'close');
ok('clampRel bounds', clampRel(-50) === 0 && clampRel(999) === 100 && clampRel(49.6) === 50);

console.log('\n[2] Starting state');
freshNpcs();
ok(`all NPCs start at ${START_REL}`, npcs.every(n => relationship(n.id) === START_REL));
ok('starting tier is Stranger', npcs.every(n => tierOf(relationship(n.id)).key === 'cold'));

console.log('\n[3] Visits');
freshNpcs();
const e0 = state.energy, s0 = state.social;
let r = visitNpc('shiro');
ok(`visit costs ${VISIT_ENERGY} energy`, state.energy === e0 - VISIT_ENERGY, `${state.energy}`);
ok('visit raises social by 6', state.social === s0 + 6, `${state.social}`);
ok('visit below 25 gives +10', relationship('shiro') === START_REL + 10, `${relationship('shiro')}`);
ok('visit returns an npc-kind line', r.kind === 'npc' && typeof r.text === 'string' && r.text.length > 0);
ok('visit line uses the current tier voice', r.text.includes(npcs.find(n => n.id === 'shiro').lines.cold));

const r2 = visitNpc('shiro');
ok('second visit same day refused', r2.text.includes('already saw') && relationship('shiro') === START_REL + 10);

nextDay();
state.npcs.shiro.rel = 25;
const before = relationship('shiro');
visitNpc('shiro');
ok('visit at 25+ gives +6', relationship('shiro') === before + 6, `${relationship('shiro')}`);

freshNpcs();
state.energy = VISIT_ENERGY - 1;
ok('visit refused when too tired', visitNpc('shiro').text.includes('Too tired') && relationship('shiro') === START_REL);

console.log('\n[4] Gifts');
freshNpcs();
const m0 = state.money;
r = giftNpc('shiro', 'chapati');           // liked
ok('liked gift costs the listed price', state.money === m0 - 50, `${state.money}`);
ok('liked gift gives +18', relationship('shiro') === START_REL + 18, `${relationship('shiro')}`);
ok('liked gift line says they love it', r.text.includes('exactly their thing'));

nextDay();
const before2 = relationship('shiro');
giftNpc('shiro', 'book');                  // not in shiro.likes
ok('unliked gift gives +6', relationship('shiro') === before2 + 6, `${relationship('shiro')}`);

const r3 = giftNpc('shiro', 'chapati');
ok('second gift same day refused', r3.text.includes('already got a gift'), `${r3.text}`);

freshNpcs();
state.money = 10;
ok('gift refused when broke', giftNpc('doc', 'sneakers').text.includes('Not today') && state.money === 10);
ok('broke gift does not change relationship', relationship('doc') === START_REL);

console.log('\n[5] Relationship clamps at 100');
freshNpcs();
for (let i = 0; i < 30; i++) { nextDay(); giftNpc('shiro', 'chapati'); }
ok('relationship capped at 100', relationship('shiro') === 100, `${relationship('shiro')}`);
ok('tier is Close at 100', tierOf(relationship('shiro')).key === 'close');

console.log('\n[6] Perks fire at tier');
freshNpcs();
state.npcs.shiro.rel = 50; state.hunger = 40;
withRandom(0.1, () => visitNpc('shiro'));   // 0.1 < 0.5 -> feeds
ok('Shiro feeds you at Friend tier', state.hunger === 65, `${state.hunger}`);

freshNpcs();
state.npcs.shiro.rel = 20; state.hunger = 40;
withRandom(0.1, () => visitNpc('shiro'));
ok('Shiro does not feed you below Friend', state.hunger === 40, `${state.hunger}`);

freshNpcs();
state.npcs.unclej.rel = 75; const mu = state.money;
withRandom(0.1, () => visitNpc('unclej'));
ok('Uncle J sends KES 1,000 at Close', state.money === mu + 1000, `${state.money}`);

freshNpcs();
state.npcs.doc.rel = 50; const md = state.money;
withRandom(0.1, () => visitNpc('doc'));
ok('Doc refers a KES 1,500 gig at Friend', state.money === md + 1500, `${state.money}`);

freshNpcs();
state.npcs.doc.rel = 20; const md2 = state.money;
withRandom(0.1, () => visitNpc('doc'));
ok('Doc gives no referral below Friend', state.money === md2, `${state.money}`);

console.log('\n[7] Tier-up is announced');
freshNpcs();
state.npcs.shiro.rel = 45;
r = visitNpc('shiro');
ok('crossing into Friend is announced', r.text.includes('counts you a friend'), r.text);

console.log('\n[8] Relationship-gated day events');
freshNpcs();
ok('no NPC event when nobody is a Friend', npcs.every(n => maybeNpcEvent() === null));
freshNpcs();
state.npcs.doc.rel = 60;
state.social = 40;
const ev = withRandom(0.1, () => maybeNpcEvent());
ok('NPC event fires once someone is a Friend', ev !== null && ev.kind === 'event');
ok('NPC event gives social +8', state.social === 48, `${state.social}`);

console.log('\n[9] Persistence and migration');
freshNpcs();
state.npcs.shiro.rel = 66; state.npcs.shiro.lastVisit = 4; state.npcs.shiro.lastGift = 3;
save(state);
state.npcs.shiro.rel = 0;
ok('load() restores relationships', load() && relationship('shiro') === 66, `${relationship('shiro')}`);
ok('load() restores lastVisit/lastGift', npcState('shiro').lastVisit === 4 && npcState('shiro').lastGift === 3);

// simulate a pre-NPC save on disk
store.set('mjinii-save', JSON.stringify({ type: 'omo', day: 9, money: 5000, energy: 50, hunger: 50, fun: 50, hygiene: 50, social: 50, happiness: 60, rentDueDay: 3, eventLog: [] }));
ok('legacy save without npcs loads', load() === true);
ok('legacy save gets NPC entries backfilled', npcs.every(n => typeof npcState(n.id).rel === 'number' && npcState(n.id).rel === START_REL));
ok('legacy save keeps its own fields', state.day === 9 && state.money === 5000);

ensureNpcState(state);
state.npcs.shiro.rel = 999;
ensureNpcState(state);
ok('out-of-range stored relationship is repaired', npcState('shiro').rel === 100);

console.log('\n[10] Reset clears relationships');
freshNpcs();
state.npcs.shiro.rel = 90;
reset();
ok('reset() returns NPCs to start', npcs.every(n => relationship(n.id) === START_REL));
ok('reset() clears the save', !hasSave());

console.log('\n[11] NPC events flow through advanceDay');
freshNpcs();
state.npcs.shiro.rel = 60;
// Pin the dice: 0.1 always passes the 0.35 check-in chance and always lands on the
// same event, so this asserts the mechanic rather than the lottery. Money is topped
// up each day because an unpaid rent cycle would end the run early.
setRng(() => 0.1);
let npcLines = 0;
for (let i = 0; i < 100; i++) {
  state.money = 100000;
  state.rentDueDay = 5;
  state.npcs.shiro.lastContact = state.day;   // stay in touch so decay cannot end the friendship
  const lines = advanceDay(state);
  npcLines += lines.filter(l => l.text.includes('checks in')).length;
}
ok(`NPC events fire every day when a Friend is around (got ${npcLines})`, npcLines === 100, `${npcLines}`);
setRng(null);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
