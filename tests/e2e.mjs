// tests/e2e.mjs — run index.html's OWN inline module under Node and play the game.
// This exercises the real wiring: the visit_/gift_ router, autosave, log rendering,
// daily limits — everything the browser would run, without a browser.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const inline = html.split('<script type="module">')[1].split('</script>')[0];

// The inline script imports './src/...', so it has to sit in the project root to resolve.
const tmp = join(root, '.inline-test.mjs');
writeFileSync(tmp, inline);

// ---- shims -----------------------------------------------------------------
class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._text = ''; this._html = ''; this.className = '';
    this.style = {}; this.disabled = false; this.title = '';
    this.onclick = null;
    this._classes = new Set();
    this.classList = {
      add: c => this._classes.add(c),
      remove: c => this._classes.delete(c),
      contains: c => this._classes.has(c)
    };
  }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text; }
  set innerHTML(v) { this._html = String(v); if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  appendChild(c) { this.children.push(c); return c; }
  prepend(c) { this.children.unshift(c); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  querySelectorAll() { return []; }
}

const ids = {};
['money', 'energy', 'happiness', 'dayDisplay', 'rentDue', 'room', 'career',
 'mHunger', 'mEnergy', 'mFun', 'mHygiene', 'mSocial', 'log', 'actions', 'npcs',
 'archetypeGrid', 'select', 'game', 'playerTitle', 'continueRow', 'resetBtn', 'newBtn']
  .forEach(id => { ids[id] = new El('div'); });

globalThis.document = {
  getElementById: id => ids[id] || null,
  createElement: tag => new El(tag),
  querySelectorAll: sel => (sel.includes('#actions') ? ids.actions.children : [])
};
globalThis.window = globalThis;
// Node 26 exposes a read-only `navigator`; override it with an empty object so
// the inline script's `'serviceWorker' in navigator` check is false.
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
globalThis.confirm = () => true;        // auto-accept reset/new-game prompts

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

try {
  await import(pathToFileURL(tmp).href);
  const { state } = await import('../src/state.js');
  const { relationship, npcState } = await import('../src/npcs.js');

  console.log('\n[E2E] page boot');
  ok('startGame is exposed to the markup', typeof window.startGame === 'function');
  ok('handleAction is exposed to the markup', typeof window.handleAction === 'function');
  ok('nextDay is exposed to the markup', typeof window.nextDay === 'function');
  ok('archetype cards rendered on boot', ids.archetypeGrid.children.length === 5);
  ok('NPC cards rendered on boot', ids.npcs.children.length === 3);
  ok('no continue button on a fresh profile', ids.continueRow.children.length === 0);

  console.log('\n[E2E] start a game');
  window.startGame('omo');
  ok('select screen hidden', !ids.select.classList.contains('active'));
  ok('game screen shown', ids.game.classList.contains('active'));
  ok('player title set', ids.playerTitle.textContent === 'OMO AREA', ids.playerTitle.textContent);
  ok('money shown from the archetype', ids.money.textContent === 'KES 15,000', ids.money.textContent);
  ok('action buttons rendered', ids.actions.children.length === 14);
  ok('autosaved on start', store.has('mjinii-save'));

  console.log('\n[E2E] plain action through the router');
  const m0 = state.money;
  window.handleAction('work');
  ok('work pays out', state.money === m0 + 1200, `${state.money}`);
  ok('log line appended', ids.log.children.length === 3, `${ids.log.children.length}`);
  ok('log shows the day', ids.log.children[0].innerHTML.includes('Day 1'));
  ok('save persisted the new balance', JSON.parse(store.get('mjinii-save')).money === state.money);

  console.log('\n[E2E] NPC visit through the router');
  const rel0 = relationship('shiro');
  const e0 = state.energy;
  window.handleAction('visit_shiro');
  ok('visit raised the relationship', relationship('shiro') === rel0 + 10, `${relationship('shiro')}`);
  ok('visit spent energy', state.energy === e0 - 8, `${state.energy}`);
  ok('visit logged as an npc line', ids.log.children[0].innerHTML.includes('npc'), ids.log.children[0].innerHTML);
  ok('visit marked on the npc state', npcState('shiro').lastVisit === state.day);
  ok('visit button disabled after use', ids.npcs.children[0].children[3].children[0].disabled === true);
  ok('other NPC still available', ids.npcs.children[1].children[3].children[0].disabled === false);

  console.log('\n[E2E] NPC gift through the router');
  const mg = state.money;
  const relg = relationship('shiro');
  window.handleAction('gift_shiro_chapati');   // shiro likes chapati
  ok('gift charged KES 50', state.money === mg - 50, `${state.money}`);
  ok('liked gift gave +18', relationship('shiro') === relg + 18, `${relationship('shiro')}`);
  ok('gift buttons disabled after use', ids.npcs.children[0].children[3].children[1].disabled === true);
  ok('relationship persisted to disk', JSON.parse(store.get('mjinii-save')).npcs.shiro.rel === relationship('shiro'));

  console.log('\n[E2E] a full day');
  const day0 = state.day;
  const relBefore = relationship('shiro');
  window.nextDay();
  ok('day advanced', state.day === day0 + 1);
  ok('daily visit limit reset', npcState('shiro').lastVisit !== state.day);
  ok('visit button re-enabled', ids.npcs.children[0].children[3].children[0].disabled === false);
  ok('relationship carried over the day', relationship('shiro') === relBefore);
  ok('a day line was logged', ids.log.children.some(c => c.innerHTML.includes('EVENT:')));
  ok('meters re-rendered', ids.mEnergy.style.width !== undefined && ids.mEnergy.style.width.endsWith('%'));

  console.log('\n[E2E] log cap under sustained play');
  for (let i = 0; i < 40; i++) { window.handleAction('rest'); window.nextDay(); }
  ok(`rendered log capped at 20 (got ${ids.log.children.length})`, ids.log.children.length === 20);
  const saved = JSON.parse(store.get('mjinii-save'));
  ok(`persisted log capped at 50 (got ${saved.eventLog.length})`, saved.eventLog.length === 50);
  ok('persisted log keeps the newest', saved.eventLog[saved.eventLog.length - 1].includes('EVENT:'));
  ok('relationships still in range after 40 days', Object.values(saved.npcs).every(n => n.rel >= 0 && n.rel <= 100));

  console.log('\n[E2E] reset via the button');
  ids.resetBtn.onclick();
  const afterReset = JSON.parse(store.get('mjinii-save'));
  ok('reset re-saves a fresh run (autosave still on)', !!afterReset && afterReset.day === 1, JSON.stringify(afterReset?.day));
  ok('reset restored the relationship', relationship('shiro') === 10, `${relationship('shiro')}`);
  ok('reset restored day 1', state.day === 1);
  ok('reset cleared the relationship from the save', afterReset.npcs.shiro.rel === 10);

  console.log('\n[E2E] unknown action is a no-op');
  const before = JSON.stringify(state);
  window.handleAction('not_a_real_action');
  ok('bogus id changes nothing', JSON.stringify(state) === before);
} finally {
  try { unlinkSync(tmp); } catch (e) {}
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
