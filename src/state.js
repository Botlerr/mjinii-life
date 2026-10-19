// src/state.js — game state, save/load, reset
import { archetypes } from './content.js';

export { archetypes };

export const MAX_LOG = 50;

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
  rentDueDay: 6,
  eventLog: []
};

export function save(s) {
  localStorage.setItem('mjinii-save', JSON.stringify({
    type: s.type, day: s.day, money: s.money, energy: s.energy,
    happiness: s.happiness, hunger: s.hunger, fun: s.fun,
    hygiene: s.hygiene, social: s.social, rentDueDay: s.rentDueDay,
    eventLog: s.eventLog.slice(-MAX_LOG)
  }));
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem('mjinii-save'));
    if (d) { Object.assign(state, d); return true; }
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
  state.day = 1;
  state.energy = 60;
  state.hunger = 60;
  state.fun = 50;
  state.hygiene = 60;
  state.social = 50;
  state.happiness = 70;
  state.eventLog = [];
  state.rentDueDay = 6;
}
