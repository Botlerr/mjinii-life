// src/turn.js — day advance: slot refill, decay, rent cycle, eviction, events
// Pure logic: mutates state, returns log lines for the UI to render.
import { state, evict } from './state.js';
import { archetypes, DAY_SLOTS } from './content.js';
import { triggerRandomEvent } from './events.js';
import { maybeNpcEvent, applyDecay } from './npcs.js';

export function recomputeHappiness(s = state) {
  s.happiness = Math.round(s.energy * 0.3 + s.social * 0.25 + s.fun * 0.25 + s.hygiene * 0.2);
  return s.happiness;
}

export function advanceDay(s = state) {
  const lines = [];
  s.day++;

  // new day: fresh action budget, rest available again
  s.slots = DAY_SLOTS;
  s.restedToday = false;

  s.hunger = Math.max(0, s.hunger - 15);
  s.energy = Math.max(0, s.energy - 10);
  s.fun = Math.max(0, s.fun - 5);
  s.social = Math.max(0, s.social - 4);
  s.hygiene = Math.max(0, s.hygiene - 6);

  // rent cycle
  if (s.rentDueDay <= 1) {
    const rent = s.rent ?? archetypes[s.type]?.rent ?? 0;
    if (rent > 0) {
      if (s.money >= rent) {
        s.money -= rent;
        s.missedRent = 0;
        lines.push({ text: `RENT PAID: KES ${rent.toLocaleString()} (Saturday met).`, kind: 'info' });
      } else {
        s.missedRent = (s.missedRent || 0) + 1;
        if (s.missedRent >= 2) {
          const was = s.room;
          evict(s);
          lines.push({ text: `EVICTED — out of the ${was}. You are back in ${s.room}, rent now KES ${s.rent.toLocaleString()}. Happiness -25.`, kind: 'event' });
        } else {
          lines.push({ text: `EVICTION RISK! Rent KES ${rent.toLocaleString()} not covered. Miss the next one and you are out.`, kind: 'event' });
        }
      }
    }
    s.rentDueDay = 6;
  } else {
    s.rentDueDay--;
  }

  // random event
  const ev = triggerRandomEvent();
  lines.push({ text: `EVENT: ${ev.text}`, kind: 'event' });

  // neglect: relationships drift down when you go quiet
  applyDecay(s).forEach(l => lines.push(l));

  // relationship-gated NPC event
  const npcEv = maybeNpcEvent();
  if (npcEv) lines.push(npcEv);

  recomputeHappiness(s);
  return lines;
}

export function rentLabel(s = state) {
  return s.rentDueDay <= 1 ? 'TOMORROW (SAT)' : `Day ${s.rentDueDay}`;
}
