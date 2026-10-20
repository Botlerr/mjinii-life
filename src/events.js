// src/events.js — random event picker + effect application
import { events, eventRep } from './content.js';
import { state } from './state.js';
import { bumpReputation } from './run.js';
import { pick } from './rng.js';

// Kept here so callers can pin a specific event without knowing about the rng module.
export function rollFor(id) {
  const i = events.findIndex(e => e.id === id);
  return (i + 0.5) / events.length;
}

export function triggerRandomEvent() {
  const event = pick(events);
  if (event.effect) {
    for (const [key, value] of Object.entries(event.effect)) {
      if (key === 'money') state.money = Math.max(0, state.money + value);
      else state[key] = Math.max(0, Math.min(100, state[key] + value));
    }
  }
  const rep = eventRep[event.id];
  if (rep) bumpReputation(rep);
  return event;
}
