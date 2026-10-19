// tests/dom.mjs — exercise the real UI render layer against a minimal DOM shim
// Verifies ui.js + the index.html wiring without a browser.

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._text = '';
    this._html = '';
    this.className = '';
    this.style = {};
    this.disabled = false;
    this.title = '';
    this.onclick = null;
    this._classes = new Set();
    this.classList = {
      add: c => this._classes.add(c),
      remove: c => this._classes.delete(c),
      toggle: (c, on) => { if (on === undefined ? !this._classes.has(c) : on) this._classes.add(c); else this._classes.delete(c); },
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
  removeChild(c) {
    const i = this.children.indexOf(c);
    if (i >= 0) this.children.splice(i, 1);
    return c;
  }
  querySelectorAll() { return []; }
}

const ids = {};
const ID_LIST = ['money', 'energy', 'happiness', 'dayDisplay', 'rentDue', 'rentAmount', 'room', 'career',
  'mHunger', 'mEnergy', 'mFun', 'mHygiene', 'mSocial', 'slots', 'log', 'actions', 'npcs', 'archetypeGrid'];
ID_LIST.forEach(id => { ids[id] = new El('div'); });

globalThis.document = {
  getElementById: id => ids[id] || null,
  createElement: tag => new El(tag),
  querySelectorAll: () => []
};
globalThis.window = globalThis;
// stub the router the UI calls; the test asserts what each button sends it
const calls = [];
globalThis.window.handleAction = id => calls.push(id);

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const { state, defaultNpcState } = await import('../src/state.js');
const ui = await import('../src/ui.js');
const { archetypes, actions, npcs, gifts } = await import('../src/content.js');
const { advanceDay } = await import('../src/turn.js');
const { visitNpc } = await import('../src/npcs.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

const find = (el, cls) => el.children.find(c => (c.className || '').includes(cls));

console.log('\n[UI] renderArchetypes');
ui.renderArchetypes();
ok(`one card per archetype (${Object.keys(archetypes).length})`, ids.archetypeGrid.children.length === Object.keys(archetypes).length);
ok('cards are clickable (onclick set)', ids.archetypeGrid.children.every(c => typeof c.onclick === 'function'));

console.log('\n[UI] renderActions');
ui.renderActions();
ok(`13 actions + Next Day = 14 buttons (got ${ids.actions.children.length})`, ids.actions.children.length === actions.length + 1);
ok('Next Day is last', ids.actions.children[ids.actions.children.length - 1].textContent === 'Next Day');
ok('every button has a handler', ids.actions.children.every(b => typeof b.onclick === 'function'));

console.log('\n[UI] renderNPCs — interactive cards');
state.npcs = defaultNpcState();
state.day = 1;
ui.renderNPCs();
ok(`one card per NPC (${npcs.length})`, ids.npcs.children.length === npcs.length);
const card0 = ids.npcs.children[0];
ok('card shows the NPC name', find(card0, 'npc-head').innerHTML.includes(npcs[0].name));
ok('card shows relation + location', find(card0, 'npc-head').innerHTML.includes(npcs[0].relation) && find(card0, 'npc-head').innerHTML.includes(npcs[0].location));
ok('card has a relationship meter', !!find(card0, 'rel'));
ok('meter is labelled with tier and score', find(card0, 'rel').innerHTML.includes('Stranger') && find(card0, 'rel').innerHTML.includes('10/100'));
ok('card shows the tier voice line', find(card0, 'npc-line').textContent === npcs[0].lines.cold);
ok('card states the perk', find(card0, 'npc-perk').textContent === npcs[0].perk);
const actions0 = find(card0, 'npc-actions');
ok(`visit button + ${gifts.length} gift buttons`, actions0.children.length === gifts.length + 1, `${actions0.children.length}`);
actions0.children[0].onclick();
ok('visit button routes to visit_<id>', calls.at(-1) === `visit_${npcs[0].id}`, calls.at(-1));
actions0.children.slice(1).forEach((b, i) => {
  b.onclick();
  ok(`gift button ${i} routes to gift_<id>_<giftId>`, calls.at(-1) === `gift_${npcs[0].id}_${gifts[i].id}`, calls.at(-1));
});

console.log('\n[UI] NPC buttons reflect daily limits');
state.npcs = defaultNpcState();
state.day = 5; state.energy = 80;
visitNpc('shiro');
ui.renderNPCs();
const shiroCard = ids.npcs.children[0];
ok('visit button disabled after visiting', find(shiroCard, 'npc-actions').children[0].disabled === true);
ok('visit button relabelled', find(shiroCard, 'npc-actions').children[0].textContent === 'Visited today');
ok('other NPCs still visitable', find(ids.npcs.children[1], 'npc-actions').children[0].disabled === false);
ok('relationship meter moved to 20/100', find(shiroCard, 'rel').innerHTML.includes('20/100'));

state.npcs.shiro.lastGift = 5;
ui.renderNPCs();
const giftBtns = find(ids.npcs.children[0], 'npc-actions').children.slice(1);
ok('gift buttons disabled after gifting', giftBtns.every(b => b.disabled === true));
ok('liked gifts are flagged in the tooltip', giftBtns.some(b => b.title.includes('loves this one')));
ok('unliked gifts flagged as indifferent', giftBtns.some(b => b.title.includes('indifferent')));

console.log('\n[UI] renderStats + meters');
state.money = 12345; state.energy = 42; state.happiness = 66; state.day = 7; state.rentDueDay = 1;
state.room = 'One-Bed Flat'; state.career = 'Matatu / Office';
state.hunger = 33; state.fun = 55; state.hygiene = 44; state.social = 22;
ui.renderStats();
ok('money formatted', ids.money.textContent === 'KES 12,345', ids.money.textContent);
ok('energy shown', ids.energy.textContent === '42%');
ok('day shown', ids.dayDisplay.textContent === 'Day 7');
ok('rent due flag at day 1', ids.rentDue.textContent === 'TOMORROW (SAT)', ids.rentDue.textContent);
ok('hunger meter width', ids.mHunger.style.width === '33%', ids.mHunger.style.width);
ok('social meter width', ids.mSocial.style.width === '22%', ids.mSocial.style.width);
state.hunger = 0; ui.renderMeters();
ok('zero meter still visible (5% floor)', ids.mHunger.style.width === '5%', ids.mHunger.style.width);

console.log('\n[UI] event log');
ids.log.children = [];
for (let i = 0; i < 30; i++) ui.log(`entry ${i}`);
ok(`log capped at 20 entries (got ${ids.log.children.length})`, ids.log.children.length === 20);
ok('newest entry on top', ids.log.children[0].innerHTML === 'entry 29', ids.log.children[0].innerHTML);

console.log('\n[UI] next-day rendering path (same code index.html calls)');
ids.log.children = [];
state.type = 'omo'; state.money = 100000; state.rentDueDay = 1; state.day = 5;
const lines = advanceDay(state);
lines.forEach(l => ui.log(`<b>Day ${state.day}:</b> ${l.kind === 'event' ? `<span class="ev">${l.text}</span>` : l.text}`));
ok('day lines rendered', ids.log.children.length === lines.length);
ok('rent line present in DOM', ids.log.children.some(c => c.innerHTML.includes('RENT PAID')));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
