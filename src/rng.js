// src/rng.js — the single injectable random source for all game randomness.
// Production uses Math.random; the test suite pins it, which is the only way to
// make random events verifiable under Node.
let rng = Math.random;

export function setRng(fn) {
  rng = typeof fn === 'function' ? fn : Math.random;
}

export function roll() {
  return rng();
}

export function pick(list) {
  return list[Math.floor(rng() * list.length)];
}

export function chance(p) {
  return rng() < p;
}

// A roll that lands on a named event, so tests can pick a harmless one by id.
export function rollForId(list, id) {
  const i = list.findIndex(x => x.id === id);
  return (i + 0.5) / list.length;
}
