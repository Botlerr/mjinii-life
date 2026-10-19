// src/ui.js — rendering functions
import { state } from './state.js';
import { archetypes, actions, npcs } from './content.js';

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

export function renderNPCs() {
  const container = document.getElementById('npcs');
  if (!container) return;
  container.innerHTML = '';
  npcs.forEach(n => {
    const div = document.createElement('div');
    div.className = 'npc-card';
    div.innerHTML = `<b>${n.name}</b> (${n.relation}) — ${n.mood}`;
    container.appendChild(div);
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
