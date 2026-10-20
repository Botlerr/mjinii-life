// src/turn.js — day advance: slot refill, hunger cost, decay, rent ladder, events
// Pure logic: mutates state, returns log lines for the UI to render.
import { state } from './state.js';
import { DAY_SLOTS, HUNGER_PENALTY, REP_FATAL } from './content.js';
import { triggerRandomEvent } from './events.js';
import { maybeNpcEvent, applyDecay } from './npcs.js';
import { bumpReputation, repDelta, record, endRun, isGameOver, reputationFatal } from './run.js';

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Happiness is derived, never stored: you cannot be cheerful on an empty stomach,
// so hunger carries real weight (8%). Weights sum to 1.0.
export function recomputeHappiness(s = state) {
  s.happiness = clamp(Math.round(
    s.energy * 0.28 + s.social * 0.24 + s.fun * 0.24 + s.hygiene * 0.16 + s.hunger * 0.08
  ));
  return s.happiness;
}

// The cost of running on an empty stomach, applied once per day.
export function hungerPenalty(s = state) {
  return HUNGER_PENALTY.find(p => s.hunger <= p.max) || null;
}

export function advanceDay(s = state) {
  const lines = [];
  if (isGameOver(s)) return lines;
  s.day++;

  // new day: fresh action budget, rest available again
  s.slots = DAY_SLOTS;
  s.restedToday = false;

  // 1. hunger is a real cost, paid at the start of the day
  const pen = hungerPenalty(s);
  if (pen) {
    s.energy = Math.max(0, s.energy - pen.energy);
    lines.push({ text: `You wake up ${pen.label}: energy -${pen.energy}. Eat.`, kind: 'event' });
  }

  // 2. reputation: only Nepo bleeds it every day
  const drain = repDelta(s);
  if (drain > 0) {
    bumpReputation(-drain, s);
    lines.push({ text: `The family is talking: reputation -${drain}. Spend on people to hold the name up.`, kind: 'event' });
    if (reputationFatal(s)) {
      lines.push({ text: 'Your name is mud — reputation hit zero. The city stops answering.', kind: 'event' });
    }
  }

  // 3. ordinary daily decay
  s.hunger = Math.max(0, s.hunger - 15);
  s.energy = Math.max(0, s.energy - 10);
  s.fun = Math.max(0, s.fun - 5);
  s.social = Math.max(0, s.social - 4);
  s.hygiene = Math.max(0, s.hygiene - 6);

  // 4. rent ladder: warn -> grace cycle -> evicted
  if (s.rentDueDay <= 1) {
    const rent = s.rent;
    if (rent > 0) {
      if (s.money >= rent) {
        s.money -= rent;
        s.missedRent = 0;
        record(s, 'rentPaid');
        lines.push({ text: `RENT PAID: KES ${rent.toLocaleString()} (Saturday met).`, kind: 'info' });
      } else {
        s.missedRent++;
        record(s, 'rentMissed');
        if (s.missedRent >= 2) {
          endRun('evicted', s);
          record(s, 'evictions');
          lines.push({ text: `EVICTED — you missed rent twice. ${s.room} is gone.`, kind: 'event' });
        } else {
          lines.push({ text: `EVICTION WARNING — rent KES ${rent.toLocaleString()} not covered. Pay the next one or you are out.`, kind: 'event' });
        }
      }
    }
    s.rentDueDay = 6;
  } else {
    s.rentDueDay--;
  }

  // 5. random event
  const ev = triggerRandomEvent();
  lines.push({ text: `EVENT: ${ev.text}`, kind: 'event' });

  // 6. neglect: relationships drift down when you go quiet
  applyDecay(s).forEach(l => lines.push(l));

  // 7. relationship-gated NPC event
  const npcEv = maybeNpcEvent();
  if (npcEv) lines.push(npcEv);

  // 8. reputation is checked after everything, so a loss during the day counts
  if (!isGameOver(s) && reputationFatal(s)) {
    endRun('reputation', s);
    lines.push({ text: 'Your name is mud — reputation hit zero. The city stops answering.', kind: 'event' });
  }

  recomputeHappiness(s);
  return lines;
}

export function rentLabel(s = state) {
  return s.rentDueDay <= 1 ? 'TOMORROW (SAT)' : `Day ${s.rentDueDay}`;
}
