// src/ui.js — rendering only. No game rules here.
import { state, canAct } from './state.js';
import { archetypes, actions, npcs, gifts, DAY_SLOTS, REP_FATAL } from './content.js';
import { npcState, tierOf, visitedToday, giftedToday, missHint } from './npcs.js';
import { runSummary } from './run.js';

export function renderStats() {
  document.getElementById('money').textContent = 'KES ' + state.money.toLocaleString('en-KE');
  document.getElementById('energy').textContent = state.energy + '%';
  document.getElementById('happiness').textContent = state.happiness + '%';
  document.getElementById('hungerNum').textContent = state.hunger + '%';
  document.getElementById('dayDisplay').textContent = 'Day ' + state.day;
  document.getElementById('rentDue').textContent = state.rentDueDay <= 1 ? 'TOMORROW (SAT)' : 'Day ' + state.rentDueDay;
  document.getElementById('room').textContent = state.room;
  document.getElementById('career').textContent = state.career;
  document.getElementById('rentAmount').textContent = 'KES ' + (state.rent ?? 0).toLocaleString('en-KE');
  renderMeters();
  renderSlots();
  renderReputation();
}

export function renderSlots() {
  const el = document.getElementById('slots');
  if (!el) return;
  const left = Math.max(0, state.slots);
  el.innerHTML = `<span class="dots">${'●'.repeat(left)}${'○'.repeat(Math.max(0, DAY_SLOTS - left))}</span> ` +
                 `<b>${left}/${DAY_SLOTS}</b> actions left today`;
  el.classList.toggle('spent', left === 0);
}

export function renderReputation() {
  const el = document.getElementById('rep');
  if (!el) return;
  const rep = state.reputation;
  el.textContent = rep;
  el.classList.toggle('low', rep <= 15);
  const bar = document.getElementById('mRep');
  if (bar) {
    bar.style.width = Math.max(5, rep) + '%';
    bar.classList.toggle('low', rep <= 15);
  }
}

export function renderMeters() {
  document.getElementById('mHunger').style.width = Math.max(5, state.hunger) + '%';
  document.getElementById('mEnergy').style.width = Math.max(5, state.energy) + '%';
  document.getElementById('mFun').style.width = Math.max(5, state.fun) + '%';
  document.getElementById('mHygiene').style.width = Math.max(5, state.hygiene) + '%';
  document.getElementById('mSocial').style.width = Math.max(5, state.social) + '%';
}

export function log(msg) {
  const el = document.getElementById('log');
  const entry = document.createElement('div');
  entry.innerHTML = msg;
  el.prepend(entry);
  while (el.children.length > 20) el.removeChild(el.lastChild);
}

export function renderActions() {
  const container = document.getElementById('actions');
  const blocked = !canAct();
  container.innerHTML = '';

  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = a.label;
    btn.title = a.desc;
    btn.disabled = blocked;
    btn.onclick = () => window.handleAction(a.id);
    container.appendChild(btn);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = blocked ? 'btn wide' : 'btn secondary wide';
  nextBtn.textContent = blocked ? 'Next Day (out of actions)' : 'Next Day';
  nextBtn.onclick = () => window.nextDay();
  container.appendChild(nextBtn);
}

// Interactive NPC cards: portrait slot, relationship meter, visit/gift buttons.
export function renderNPCs() {
  const container = document.getElementById('npcs');
  if (!container) return;
  const blocked = !canAct();
  container.innerHTML = '';

  npcs.forEach(n => {
    const s = npcState(n.id);
    const tier = tierOf(s.rel);

    const card = document.createElement('div');
    card.className = 'npc-card';

    const head = document.createElement('div');
    head.className = 'npc-head';
    head.innerHTML = `<b>${n.name}</b><span class="npc-meta">${n.relation} · ${n.location}</span>`;
    card.appendChild(head);

    const meter = document.createElement('div');
    meter.className = 'rel';
    meter.innerHTML = `<div class="rel-fill" style="width:${Math.max(4, s.rel)}%"></div>` +
                      `<span class="rel-label">${tier.label} · ${s.rel}/100</span>`;
    card.appendChild(meter);

    const line = document.createElement('p');
    line.className = 'npc-line';
    line.textContent = n.lines[tier.key];
    card.appendChild(line);

    const hint = missHint(n.id);
    if (hint) {
      const miss = document.createElement('p');
      miss.className = 'npc-miss';
      miss.textContent = hint;
      card.appendChild(miss);
    }

    const row = document.createElement('div');
    row.className = 'npc-actions';

    const seen = visitedToday(n.id);
    const visit = document.createElement('button');
    visit.className = 'btn small';
    visit.textContent = seen ? 'Visited today' : 'Visit · 8 energy';
    visit.disabled = seen || blocked;
    visit.onclick = () => window.handleAction('visit_' + n.id);
    row.appendChild(visit);

    const gave = giftedToday(n.id);
    gifts.forEach(g => {
      const b = document.createElement('button');
      b.className = 'btn small secondary';
      b.textContent = `${g.label} · ${g.cost}`;
      b.disabled = gave || blocked;
      b.title = n.likes.includes(g.id) ? `${n.name} loves this one` : `${n.name} is indifferent`;
      b.onclick = () => window.handleAction(`gift_${n.id}_${g.id}`);
      row.appendChild(b);
    });

    card.appendChild(row);

    const perk = document.createElement('small');
    perk.className = 'npc-perk';
    perk.textContent = n.perk;
    card.appendChild(perk);

    container.appendChild(card);
  });
}

export function renderArchetypes() {
  const grid = document.getElementById('archetypeGrid');
  grid.innerHTML = '';
  for (const [key, a] of Object.entries(archetypes)) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${a.name}</h3><p>${a.desc}</p>` +
                     `<small>KES ${a.money.toLocaleString('en-KE')} · rent KES ${a.rent.toLocaleString('en-KE')} · pay KES ${a.pay.toLocaleString('en-KE')}/day` +
                     (a.repDrain ? `<br><b>rep -${a.repDrain}/day — spend on people or the name goes</b>` : '') +
                     `</small>`;
    card.onclick = () => window.startGame(key);
    grid.appendChild(card);
  }
}

// The "start again" screen: what happened, and how the run measured up.
export function renderGameOver() {
  const s = runSummary(state);
  const scr = document.getElementById('gameover');
  if (!scr) return;
  document.getElementById('game').classList.remove('active');
  scr.classList.add('active');

  document.getElementById('overTitle').textContent = s.title;
  document.getElementById('overBody').textContent = s.body;
  document.getElementById('overLine').textContent = s.line;
  document.getElementById('overArchetype').textContent = s.archetype;

  const rows = [
    ['Days survived', s.day],
    ['Money left', 'KES ' + s.money.toLocaleString('en-KE')],
    ['Rent paid', s.rentPaid + ' × KES ' + (state.rent || 0).toLocaleString('en-KE')],
    ['Rents missed', s.rentMissed],
    ['Days worked', s.daysWorked],
    ['Actions taken', s.actionsTaken],
    ['Gifts given', s.giftsGiven],
    ['Reputation at the end', s.reputation + ' / 100']
  ];
  if (s.bestFriend) {
    rows.push(['Closest bond', `${s.bestFriend.name} (${s.bestFriend.rel}/100)`]);
  }
  const list = document.getElementById('overStats');
  list.innerHTML = '';
  rows.forEach(([k, v]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${k}</span><b>${v}</b>`;
    list.appendChild(li);
  });
}
