// src/state.js — game state, save/load, reset, migration
import { archetypes, npcs, DAY_SLOTS, EVICTED_ROOM, EVICTED_RENT } from './content.js';

export { archetypes };

export const MAX_LOG = 50;
export const START_REL = 10;

export function defaultNpcState() {
  const out = {};
  npcs.forEach(n => { out[n.id] = { rel: START_REL, lastVisit: 0, lastGift: 0, lastContact: 0 }; });
  return out;
}

export let state = {
  type: 'omo',
  money: 15000,
  day: 1,
  energy: 60,
  happiness: 70,
  hunger: 60,
  fun: 50,
  hygiene: 60,
  social: 50,
  room: 'One-Bed Flat',
  career: 'Matatu / Office',
  rent: 18000,          // authoritative current rent (drops if evicted)
  rentDueDay: 6,
  missedRent: 0,        // consecutive missed rents; 2 -> evicted
  slots: DAY_SLOTS,     // actions left today
  restedToday: false,
  eventLog: [],
  npcs: defaultNpcState()
};

// Fills in any NPC (or field) missing from an older save.
export function ensureNpcState(s = state) {
  if (!s.npcs || typeof s.npcs !== 'object') s.npcs = defaultNpcState();
  npcs.forEach(n => {
    if (!s.npcs[n.id]) s.npcs[n.id] = { rel: START_REL, lastVisit: 0, lastGift: 0, lastContact: 0 };
    const e = s.npcs[n.id];
    if (typeof e.rel !== 'number') e.rel = START_REL;
    if (typeof e.lastVisit !== 'number') e.lastVisit = 0;
    if (typeof e.lastGift !== 'number') e.lastGift = 0;
    if (typeof e.lastContact !== 'number') e.lastContact = e.lastVisit || 0;
    e.rel = Math.max(0, Math.min(100, e.rel));
  });
  return s.npcs;
}

// Pre-budget saves have no rent/slots fields; derive them from the archetype.
export function ensureEconomyState(s = state) {
  const a = archetypes[s.type] || archetypes.omo;
  if (typeof s.rent !== 'number') s.rent = a.rent;
  if (typeof s.missedRent !== 'number') s.missedRent = 0;
  if (typeof s.slots !== 'number' || s.slots > DAY_SLOTS) s.slots = DAY_SLOTS;
  if (typeof s.restedToday !== 'boolean') s.restedToday = false;
  if (!s.room) s.room = a.room;
  if (!s.career) s.career = a.career;
  return s;
}

export function ensureAll(s = state) {
  ensureNpcState(s);
  ensureEconomyState(s);
  if (!Array.isArray(s.eventLog)) s.eventLog = [];
  return s;
}

export function save(s) {
  localStorage.setItem('mjinii-save', JSON.stringify({
    type: s.type, day: s.day, money: s.money, energy: s.energy,
    happiness: s.happiness, hunger: s.hunger, fun: s.fun,
    hygiene: s.hygiene, social: s.social,
    room: s.room, career: s.career,
    rent: s.rent, rentDueDay: s.rentDueDay, missedRent: s.missedRent,
    slots: s.slots, restedToday: s.restedToday,
    eventLog: s.eventLog.slice(-MAX_LOG),
    npcs: s.npcs
  }));
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem('mjinii-save'));
    if (d) {
      // The save is the source of truth: anything it does not carry is reset,
      // never inherited from whatever was in memory.
      const hadNpcs = d.npcs && typeof d.npcs === 'object';
      Object.assign(state, d);
      if (!hadNpcs) state.npcs = defaultNpcState();
      if (!Array.isArray(state.eventLog)) state.eventLog = [];
      ensureAll(state);
      return true;
    }
  } catch (e) {}
  return false;
}

export function hasSave() {
  return !!localStorage.getItem('mjinii-save');
}

export function clearSave() {
  localStorage.removeItem('mjinii-save');
}

export function reset() {
  clearSave();
  const c = archetypes[state.type] || archetypes.omo;
  state.money = c.money;
  state.room = c.room;
  state.career = c.career;
  state.rent = c.rent;
  state.day = 1;
  state.energy = 60;
  state.hunger = 60;
  state.fun = 50;
  state.hygiene = 60;
  state.social = 50;
  state.happiness = 70;
  state.eventLog = [];
  state.rentDueDay = 6;
  state.missedRent = 0;
  state.slots = DAY_SLOTS;
  state.restedToday = false;
  state.npcs = defaultNpcState();
}

// ---- action budget ---------------------------------------------------------
// Deliberately NOT gated on energy: at 0 energy the player must still be able to
// reach Rest, otherwise the game dead-ends. Energy limits live on the actions.
export function canAct(s = state) {
  return s.slots > 0;
}

export function useSlot(s = state) {
  if (s.slots > 0) s.slots--;
  return s.slots;
}

// ---- eviction --------------------------------------------------------------
export function evict(s = state) {
  s.room = EVICTED_ROOM;
  s.rent = EVICTED_RENT;
  s.missedRent = 0;
  s.happiness = Math.max(0, s.happiness - 25);
  return s;
}
