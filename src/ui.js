// src/ui.js — rendering only. No game rules here.
import { state } from './state.js';
import { archetypes, actions, npcs, gifts } from './content.js';
import { npcState, tierOf, visitedToday, giftedToday } from './npcs.js';

export function renderStats() {
  document.getElementById('money').textContent = 'KES ' + state.money.toLocaleString('en-KE');
  document.getElementById('energy').textContent = state.energy + '%';
  document.getElementById('happiness').textContent = state.happiness + '%';
  document.getElementById('dayDisplay').textContent = 'Day ' + state.day;
  document.getElementById('rentDue').textContent = state.rentDueDay <= 1 ? 'TOMORROW (SAT)' : 'Day ' + state.rentDueDay;
  document.getElementById('room').textContent = state.room;
  document.getElementById('career').textContent = state.career;
  renderMeters();
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
  container.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = a.label;
    btn.title = a.desc;
    btn.onclick = () => window.handleAction(a.id);
    container.appendChild(btn);
  });
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn secondary';
  nextBtn.textContent = 'Next Day';
  nextBtn.onclick = () => window.nextDay();
  container.appendChild(nextBtn);
}

// Interactive NPC cards: relationship meter + visit/gift buttons.
export function renderNPCs() {
  const container = document.getElementById('npcs');
  if (!container) return;
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

    const row = document.createElement('div');
    row.className = 'npc-actions';

    const seen = visitedToday(n.id);
    const visit = document.createElement('button');
    visit.className = 'btn small';
    visit.textContent = seen ? 'Visited today' : `Visit · 8 energy`;
    visit.disabled = seen;
    visit.onclick = () => window.handleAction('visit_' + n.id);
    row.appendChild(visit);

    const gave = giftedToday(n.id);
    gifts.forEach(g => {
      const b = document.createElement('button');
      b.className = 'btn small secondary';
      b.textContent = `${g.label} · ${g.cost}`;
      b.disabled = gave;
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
    card.innerHTML = `<h3>${a.name}</h3><p>${a.desc}</p>`;
    card.onclick = () => window.startGame(key);
    grid.appendChild(card);
  }
}
