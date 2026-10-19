// src/turn.js — day advance logic (rent cycle, decay, random events)
// Pure logic: mutates state, returns the log lines for the UI to render.
import { state } from './state.js';
import { archetypes } from './content.js';
import { triggerRandomEvent } from './events.js';

export function recomputeHappiness(s = state) {
  s.happiness = Math.round(s.energy * 0.3 + s.social * 0.25 + s.fun * 0.25 + s.hygiene * 0.2);
  return s.happiness;
}

export function advanceDay(s = state) {
  const lines = [];
  s.day++;

  s.hunger = Math.max(0, s.hunger - 15);
  s.energy = Math.max(0, s.energy - 10);
  s.fun = Math.max(0, s.fun - 5);
  s.social = Math.max(0, s.social - 4);
  s.hygiene = Math.max(0, s.hygiene - 6);

  // rent cycle
  if (s.rentDueDay <= 1) {
    const rent = archetypes[s.type]?.rent ?? 0;
    if (rent > 0) {
      if (s.money >= rent) {
        s.money -= rent;
        lines.push({ text: `RENT PAID: KES ${rent.toLocaleString()} (Saturday met).`, kind: 'info' });
      } else {
        lines.push({ text: `EVICTION RISK! Rent KES ${rent.toLocaleString()} not covered.`, kind: 'event' });
      }
    }
    s.rentDueDay = 6;
  } else {
    s.rentDueDay--;
  }

  // random event
  const ev = triggerRandomEvent();
  lines.push({ text: `EVENT: ${ev.text}`, kind: 'event' });

  recomputeHappiness(s);
  return lines;
}

export function rentLabel(s = state) {
  return s.rentDueDay <= 1 ? 'TOMORROW (SAT)' : `Day ${s.rentDueDay}`;
}
