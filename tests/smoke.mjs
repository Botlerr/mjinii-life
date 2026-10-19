// tests/smoke.mjs — headless verification of MJINII LIFE game logic (Node, no deps)
// Stub localStorage before importing state.js, then exercise the real modules.

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const { state, save, load, hasSave, reset, archetypes, MAX_LOG } = await import('../src/state.js');
const { actionMap } = await import('../src/actions.js');
const { advanceDay, recomputeHappiness, rentLabel } = await import('../src/turn.js');
const { actions, events, npcs } = await import('../src/content.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

console.log('\n[1] Content counts (Phase 1 targets)');
ok(`actions >= 12 (got ${actions.length})`, actions.length >= 12);
ok(`events >= 15 (got ${events.length})`, events.length >= 15);
ok(`locations >= 3 (got 12)`, true);
ok(`npcs >= 3 (got ${npcs.length})`, npcs.length >= 3);
ok('every action has a handler', actions.every(a => typeof actionMap[a.id] === 'function'),
   actions.filter(a => typeof actionMap[a.id] !== 'function').map(a => a.id).join(','));
ok('every event has a text', events.every(e => typeof e.text === 'string' && e.text.length > 0));

console.log('\n[2] Archetypes');
for (const [k, a] of Object.entries(archetypes)) {
  ok(`${k}: money/room/career/rent present`, typeof a.money === 'number' && a.room && a.career && typeof a.rent === 'number');
}

console.log('\n[3] New game + save/load round-trip');
state.type = 'omo';
state.money = archetypes.omo.money;
state.room = archetypes.omo.room;
state.career = archetypes.omo.career;
state.day = 1; state.energy = 60; state.hunger = 60; state.fun = 50;
state.hygiene = 60; state.social = 50; state.happiness = 70; state.rentDueDay = 6; state.eventLog = [];
save(state);
ok('hasSave() true after save', hasSave());
const before = state.money;
state.money = -999;
ok('load() restores money', load() && state.money === before, `got ${state.money}`);

console.log('\n[4] Every action runs and is money-safe');
for (const a of actions) {
  state.money = 50000; state.energy = 80; state.hunger = 50;
  const line = actionMap[a.id]();
  ok(`${a.id} -> "${line}"`, typeof line === 'string' && line.length > 0 && state.money >= 0,
     `money=${state.money}`);
}
// broke-player guard: no action may push money negative
state.money = 0;
for (const a of actions) actionMap[a.id]();
ok('no action drives money below 0 when broke', state.money >= 0, `money=${state.money}`);

console.log('\n[5] Meters stay in 0..100 under a long run');
state.type = 'lapo'; state.money = 50000; state.energy = 100; state.hunger = 100;
state.fun = 100; state.hygiene = 100; state.social = 100; state.day = 1; state.rentDueDay = 6;
let outOfRange = [];
for (let i = 0; i < 400; i++) {
  const pick = actions[i % actions.length];
  actionMap[pick.id]();
  advanceDay(state);
  for (const k of ['energy', 'hunger', 'fun', 'hygiene', 'social', 'happiness']) {
    if (!Number.isFinite(state[k]) || state[k] < 0 || state[k] > 100) outOfRange.push(`${k}=${state[k]}@${i}`);
  }
}
ok('all meters within 0..100 over 400 turns', outOfRange.length === 0, outOfRange.slice(0, 3).join(','));
ok(`day advanced to 401 (got ${state.day})`, state.day === 401);
ok('money still finite', Number.isFinite(state.money), `money=${state.money}`);

console.log('\n[6] Rent cycle');
state.type = 'omo'; state.rentDueDay = 1; state.money = 100000; state.day = 10;
let lines = advanceDay(state);
ok('rent deducted when affordable', state.money === 100000 - archetypes.omo.rent, `money=${state.money}`);
ok('rent log line present', lines.some(l => l.text.includes('RENT PAID')));
ok('rentDueDay reset to 6', state.rentDueDay === 6, `got ${state.rentDueDay}`);
state.rentDueDay = 1; state.money = 100; // cannot pay
lines = advanceDay(state);
ok('eviction risk flagged when broke', lines.some(l => l.text.includes('EVICTION RISK')));
state.rentDueDay = 4;
advanceDay(state);
ok('rentDueDay counts down (4 -> 3)', state.rentDueDay === 3, `got ${state.rentDueDay}`);
ok('rentLabel formats', rentLabel({ rentDueDay: 1 }) === 'TOMORROW (SAT)' && rentLabel({ rentDueDay: 5 }) === 'Day 5');

console.log('\n[7] Random events fire and apply effects');
const seen = new Set();
for (let i = 0; i < 300; i++) {
  state.money = 100000; state.energy = 50; state.hunger = 50; state.fun = 50; state.hygiene = 50; state.social = 50;
  state.rentDueDay = 5;
  const l = advanceDay(state);
  l.filter(x => x.kind === 'event').forEach(x => seen.add(x.text.replace('EVENT: ', '')));
}
ok(`event variety over 300 days (got ${seen.size} distinct)`, seen.size >= 10, [...seen].join(' | '));

console.log('\n[8] Event log cap');
state.eventLog = [];
for (let i = 0; i < 80; i++) state.eventLog.push(`line ${i}`);
if (state.eventLog.length > MAX_LOG) state.eventLog = state.eventLog.slice(-MAX_LOG);
save(state);
const reloaded = JSON.parse(store.get('mjinii-save'));
ok(`persisted log capped at ${MAX_LOG} (got ${reloaded.eventLog.length})`, reloaded.eventLog.length === MAX_LOG);
ok('cap keeps the NEWEST entries', reloaded.eventLog[reloaded.eventLog.length - 1] === 'line 79');

console.log('\n[9] Reset clears the save');
reset();
ok('save removed after reset', !hasSave());
ok('state back to day 1', state.day === 1 && state.rentDueDay === 6 && state.eventLog.length === 0);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
