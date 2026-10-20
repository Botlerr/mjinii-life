// src/actions.js — all player actions (mutate state, return a log line or a refusal)
// Every energy-spending action is gated on having the energy, so nothing can drive
// the player to a dead stop. Rest is deliberately never gated: it is the way back.
import { state } from './state.js';
import { archetypes, WORK_HUNGER_MIN, HUSTLE_HUNGER_MIN, HUSTLE_HUNGRY_RATE } from './content.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const refuse = text => ({ text, kind: 'info', refused: true });
const needEnergy = n => (state.energy < n ? refuse(`Too tired — ${n} energy needed. Rest first.`) : null);

export function doWork() {
  if (state.hunger < WORK_HUNGER_MIN) return refuse('Too hungry to work. Eat something first.');
  const tired = needEnergy(10);
  if (tired) return tired;
  const pay = archetypes[state.type]?.pay ?? 800;
  state.money += pay;
  state.hunger = clamp(state.hunger - 8);
  state.energy = clamp(state.energy - 10);
  state.hygiene = clamp(state.hygiene - 5);
  return `Work: earned KES ${pay.toLocaleString()}`;
}

export function doSideHustle() {
  // Deliberately open to a broke, hungry player — the way back from the edge — but
  // an empty stomach slows you down, so you earn less until you eat.
  const tired = needEnergy(8);
  if (tired) return tired;
  let earn = Math.floor(Math.random() * 500) + 200;
  const sluggish = state.hunger < HUSTLE_HUNGER_MIN;
  if (sluggish) earn = Math.max(50, Math.round(earn * HUSTLE_HUNGRY_RATE));
  state.money += earn;
  state.energy = clamp(state.energy - 8);
  return `Side hustle: earned KES ${earn.toLocaleString()}${sluggish ? ' (you are too hungry to push hard)' : ''}`;
}

export function doEatUgali() {
  if (state.money < 120) return refuse('No money for ugali. Hustle first.');
  state.money -= 120;
  state.hunger = clamp(state.hunger + 35);
  state.energy = clamp(state.energy + 5);
  return 'Ate Ugali + Sukuma Wiki';
}

export function doNyama() {
  if (state.money < 850) return refuse('Nyama choma is KES 850 — not today.');
  state.money -= 850;
  state.fun = clamp(state.fun + 18);
  state.social = clamp(state.social + 15);
  state.hunger = clamp(state.hunger + 10);
  return 'Nyama Choma: grilled goat, good company';
}

export function doMatatu() {
  if (state.money < 80) return refuse('Matatu is KES 80. You are walking today.');
  const tired = needEnergy(8);
  if (tired) return tired;
  state.money -= 80;
  state.social = clamp(state.social + 12);
  state.energy = clamp(state.energy - 8);
  return 'Matatu ride: chatted with strangers';
}

export function doRest() {
  // Never gated on energy or money: this is the recovery action.
  if (state.restedToday) return refuse('You already rested today. One rest a day.');
  state.restedToday = true;
  state.energy = clamp(state.energy + 25);
  state.fun = clamp(state.fun + 8);
  return 'Rested: energy restored';
}

export function doShop() {
  const win = Math.random() > 0.65;
  const delta = win ? 3000 : -500;
  state.money = Math.max(0, state.money + delta);
  return win
    ? `Computer Village: sold a gadget! +KES ${delta.toLocaleString()}`
    : `Computer Village: bad deal. -KES ${Math.abs(delta).toLocaleString()}`;
}

export function doCallFriend() {
  state.social = clamp(state.social + 10);
  state.fun = clamp(state.fun + 5);
  return 'Called a friend: social +10';
}

export function doStudy() {
  const tired = needEnergy(10);
  if (tired) return tired;
  state.energy = clamp(state.energy - 10);
  state.happiness = clamp(state.happiness + 5);
  return 'Studied: energy -10, long-term growth';
}

export function doVisitWestlands() {
  if (state.money < 1000) return refuse('Westlands needs KES 1,000 in your pocket.');
  const tired = needEnergy(5);
  if (tired) return tired;
  state.money -= 1000;
  state.fun = clamp(state.fun + 15);
  state.social = clamp(state.social + 10);
  state.energy = clamp(state.energy - 5);
  return 'Westlands: fun +15, social +10';
}

export function doVisitKibera() {
  if (state.money < 500) return refuse('KES 500 needed for the trip to Kibera.');
  const tired = needEnergy(5);
  if (tired) return tired;
  state.money -= 500;
  state.social = clamp(state.social + 15);
  state.energy = clamp(state.energy - 5);
  return 'Kibera Estate: social +15';
}

export function doVisitKisumu() {
  if (state.money < 1500) return refuse('Kisumu trip is KES 1,500. Not yet.');
  const tired = needEnergy(10);
  if (tired) return tired;
  state.money -= 1500;
  state.fun = clamp(state.fun + 15);
  state.energy = clamp(state.energy - 10);
  return 'Kisumu Market: fun +15';
}

export function doVisitMombasa() {
  if (state.money < 2000) return refuse('Mombasa is a KES 2,000 trip. Save up.');
  const tired = needEnergy(15);
  if (tired) return tired;
  state.money -= 2000;
  state.fun = clamp(state.fun + 20);
  state.energy = clamp(state.energy - 15);
  return 'Mombasa Old Town: fun +20';
}

export const actionMap = {
  work: doWork,
  side_hustle: doSideHustle,
  eat_ugali: doEatUgali,
  nyama: doNyama,
  matatu: doMatatu,
  rest: doRest,
  shop: doShop,
  call_friend: doCallFriend,
  study: doStudy,
  visit_westlands: doVisitWestlands,
  visit_kibera: doVisitKibera,
  visit_kisumu: doVisitKisumu,
  visit_mombasa: doVisitMombasa
};
