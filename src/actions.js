// src/actions.js — all player actions (mutate state, return a log line)
import { state } from './state.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function doWork() {
  const earn = state.type === 'nepo' ? 5000 : state.type === 'balogun' ? 3500 : state.type === 'tech' ? 2800 : state.type === 'omo' ? 1200 : 800;
  state.money += earn;
  state.hunger = clamp(state.hunger - 8);
  state.energy = clamp(state.energy - 10);
  state.hygiene = clamp(state.hygiene - 5);
  return `Work: earned KES ${earn.toLocaleString()}`;
}

export function doSideHustle() {
  const earn = Math.floor(Math.random() * 500) + 200;
  state.money += earn;
  state.energy = clamp(state.energy - 8);
  return `Side hustle: earned KES ${earn.toLocaleString()}`;
}

export function doEatUgali() {
  if (state.money < 120) return 'No money for ugali. Hustle first.';
  state.money -= 120;
  state.hunger = clamp(state.hunger + 35);
  state.energy = clamp(state.energy + 5);
  return 'Ate Ugali + Sukuma Wiki';
}

export function doNyama() {
  if (state.money < 850) return 'Nyama choma is KES 850 — not today.';
  state.money -= 850;
  state.fun = clamp(state.fun + 18);
  state.social = clamp(state.social + 15);
  state.hunger = clamp(state.hunger + 10);
  return 'Nyama Choma: grilled goat, good company';
}

export function doMatatu() {
  if (state.money < 80) return 'Matatu is KES 80. You are walking today.';
  state.money -= 80;
  state.social = clamp(state.social + 12);
  state.energy = clamp(state.energy - 8);
  return 'Matatu ride: chatted with strangers';
}

export function doRest() {
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
  state.energy = clamp(state.energy - 10);
  state.happiness = clamp(state.happiness + 5);
  return 'Studied: energy -10, long-term growth';
}

export function doVisitWestlands() {
  if (state.money < 1000) return 'Westlands needs KES 1,000 in your pocket.';
  state.money -= 1000;
  state.fun = clamp(state.fun + 15);
  state.social = clamp(state.social + 10);
  state.energy = clamp(state.energy - 5);
  return 'Westlands: fun +15, social +10';
}

export function doVisitKibera() {
  if (state.money < 500) return 'KES 500 needed for the trip to Kibera.';
  state.money -= 500;
  state.social = clamp(state.social + 15);
  state.energy = clamp(state.energy - 5);
  return 'Kibera Estate: social +15';
}

export function doVisitKisumu() {
  if (state.money < 1500) return 'Kisumu trip is KES 1,500. Not yet.';
  state.money -= 1500;
  state.fun = clamp(state.fun + 15);
  state.energy = clamp(state.energy - 10);
  return 'Kisumu Market: fun +15';
}

export function doVisitMombasa() {
  if (state.money < 2000) return 'Mombasa is a KES 2,000 trip. Save up.';
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
