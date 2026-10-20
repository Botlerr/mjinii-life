// src/run.js — run bookkeeping, reputation, and the fail state.
// The run can only end two ways: eviction, or your name going bad. Nothing else
// kills you — exhaustion, hunger and being broke are all recoverable.
import { state } from './state.js';
import { archetypes, REP_FATAL, npcs } from './content.js';

export const FAIL_REASONS = {
  evicted: {
    title: 'Evicted',
    body: 'You missed rent twice. The landlord changed the locks while you were out.',
    line: 'No rent paid twice in a row. The street does not wait.'
  },
  reputation: {
    title: 'Your name is mud',
    body: 'Reputation hit zero. The city stopped answering when you call.',
    line: 'Talk travels faster than money.'
  }
};

export const clampRep = v => Math.max(0, Math.min(100, Math.round(v)));

export function reputation(s = state) {
  return typeof s.reputation === 'number' ? s.reputation : 50;
}

export function bumpReputation(delta, s = state) {
  if (!delta) return reputation(s);
  s.reputation = clampRep(reputation(s) + delta);
  // Reputation is a fail state, so hitting the floor ends the run here and now —
  // it must not wait for the next day advance.
  if (s.reputation <= REP_FATAL) endRun('reputation', s);
  return s.reputation;
}

export function repDelta(s = state) {
  return (archetypes[s.type] || {}).repDrain || 0;
}

// Does the current reputation end the run?
export function reputationFatal(s = state) {
  return reputation(s) <= REP_FATAL;
}

// ---- run bookkeeping -------------------------------------------------------
export function defaultRunStats() {
  return { rentPaid: 0, rentMissed: 0, evictions: 0, daysWorked: 0, actionsTaken: 0, giftsGiven: 0, earned: 0 };
}

export function record(s = state, key, amount = 1) {
  if (!s.run || typeof s.run !== 'object') s.run = defaultRunStats();
  if (typeof s.run[key] !== 'number') s.run[key] = 0;
  s.run[key] += amount;
  return s.run[key];
}

// ---- fail state ------------------------------------------------------------
// Returns the reason the run ended, or null. Idempotent: once over, it stays over.
export function failReason(s = state) {
  if (s.gameOver) return s.gameOver;
  if (reputationFatal(s)) return 'reputation';
  return null;
}

export function endRun(reason, s = state) {
  if (!FAIL_REASONS[reason]) return s.gameOver;
  s.gameOver = reason;
  return s.gameOver;
}

export function isGameOver(s = state) {
  return !!failReason(s);
}

// ---- the "start again" summary --------------------------------------------
export function runSummary(s = state) {
  const reason = failReason(s) || 'abandoned';
  const spec = FAIL_REASONS[reason] || { title: 'Run ended', body: '', line: '' };
  const stats = s.run || defaultRunStats();
  const npcState = s.npcs || {};
  const bestEntry = Object.entries(npcState).sort((a, b) => b[1].rel - a[1].rel)[0];
  const bestFriend = bestEntry ? {
    id: bestEntry[0],
    name: (npcs.find(n => n.id === bestEntry[0]) || {}).name || bestEntry[0],
    rel: bestEntry[1].rel
  } : null;
  return {
    reason,
    title: spec.title,
    body: spec.body,
    line: spec.line,
    day: s.day,
    money: s.money,
    rentPaid: stats.rentPaid,
    rentMissed: stats.rentMissed,
    daysWorked: stats.daysWorked,
    actionsTaken: stats.actionsTaken,
    giftsGiven: stats.giftsGiven,
    reputation: reputation(s),
    bestFriend,
    archetype: (archetypes[s.type] || {}).name || s.type
  };
}
