// src/npcs.js — interactive NPC system: relationships, visits, gifts, perks, events
import { state } from './state.js';
import { npcs, gifts } from './content.js';

export const TIERS = [
  { min: 75, key: 'close',   label: 'Close' },
  { min: 50, key: 'warm',    label: 'Friend' },
  { min: 25, key: 'neutral', label: 'Acquaintance' },
  { min: 0,  key: 'cold',    label: 'Stranger' }
];

export const VISIT_ENERGY = 8;

export const clampRel = v => Math.max(0, Math.min(100, Math.round(v)));

export function tierOf(rel) {
  return TIERS.find(t => rel >= t.min) || TIERS[TIERS.length - 1];
}

export function getNpc(id) { return npcs.find(n => n.id === id); }
export function getGift(id) { return gifts.find(g => g.id === id); }

export function npcState(id) {
  if (!state.npcs) state.npcs = {};
  if (!state.npcs[id]) state.npcs[id] = { rel: 10, lastVisit: 0, lastGift: 0 };
  return state.npcs[id];
}

export function relationship(id) { return npcState(id).rel; }
export function tierKeyOf(id) { return tierOf(npcState(id).rel).key; }

export function visitedToday(id) { return npcState(id).lastVisit === state.day; }
export function giftedToday(id) { return npcState(id).lastGift === state.day; }

// ---- perks -----------------------------------------------------------------
// Each NPC gives something back once the relationship is real. Random so a visit
// stays a small gamble, not a guaranteed money tap.
function applyPerk(npc, s) {
  if (npc.id === 'shiro' && s.rel >= 50) {
    if (Math.random() < 0.5) {
      state.hunger = Math.min(100, state.hunger + 25);
      return 'She plates you chapati and beans. Hunger +25.';
    }
  }
  if (npc.id === 'unclej') {
    if (s.rel >= 75 && Math.random() < 0.25) {
      state.money += 1000;
      return 'He presses KES 1,000 into your hand. "Usiseme."';
    }
    if (s.rel >= 50 && Math.random() < 0.4) {
      state.happiness = Math.min(100, state.happiness + 5);
      return 'He talks sense for an hour. Happiness +5.';
    }
  }
  if (npc.id === 'doc' && s.rel >= 50) {
    if (Math.random() < 0.35) {
      state.money += 1500;
      return 'He puts in a word — a paid gig lands. KES 1,500.';
    }
  }
  return null;
}

// ---- actions ---------------------------------------------------------------
export function visitNpc(id) {
  const npc = getNpc(id);
  if (!npc) return { text: 'Nobody there.', kind: 'info' };
  const s = npcState(id);

  if (s.lastVisit === state.day) return { text: `You already saw ${npc.name} today.`, kind: 'info' };
  if (state.energy < VISIT_ENERGY) return { text: 'Too tired to go visiting. Rest first.', kind: 'info' };

  s.lastVisit = state.day;
  state.energy = Math.max(0, state.energy - VISIT_ENERGY);
  state.social = Math.min(100, state.social + 6);

  const before = s.rel;
  const gain = before < 25 ? 10 : 6;   // easier early, slower once it matters
  s.rel = clampRel(before + gain);

  const parts = [npc.lines[tierOf(s.rel).key]];
  const perk = applyPerk(npc, s);
  if (perk) parts.push(perk);
  if (tierOf(before).key !== tierOf(s.rel).key) {
    parts.push(`${npc.name} now counts you a ${tierOf(s.rel).label.toLowerCase()}.`);
  }
  return { text: parts.join(' '), kind: 'npc' };
}

export function giftNpc(id, giftId) {
  const npc = getNpc(id);
  const gift = getGift(giftId);
  if (!npc || !gift) return { text: 'Nothing to give.', kind: 'info' };
  const s = npcState(id);

  if (s.lastGift === state.day) return { text: `${npc.name} already got a gift today.`, kind: 'info' };
  if (state.money < gift.cost) return { text: `${gift.label} is KES ${gift.cost}. Not today.`, kind: 'info' };

  state.money -= gift.cost;
  s.lastGift = state.day;

  const liked = npc.likes.includes(giftId);
  const before = s.rel;
  s.rel = clampRel(before + (liked ? 18 : 6));

  const parts = [liked
    ? `${npc.name} lights up — ${gift.label} is exactly their thing.`
    : `${npc.name} accepts the ${gift.label} politely.`];
  if (tierOf(before).key !== tierOf(s.rel).key) {
    parts.push(`${npc.name} now counts you a ${tierOf(s.rel).label.toLowerCase()}.`);
  }
  return { text: parts.join(' '), kind: 'npc' };
}

// ---- day-advance hook ------------------------------------------------------
// Friends and family reach out on their own once the relationship is real.
export function maybeNpcEvent() {
  const close = npcs.filter(n => npcState(n.id).rel >= 50);
  if (!close.length || Math.random() > 0.35) return null;
  const npc = close[Math.floor(Math.random() * close.length)];
  state.social = Math.min(100, state.social + 8);
  return { text: `${npc.name} checks in out of nowhere — social +8`, kind: 'event' };
}
