// src/events.js — random event system
import { events } from './content.js';
import { state } from './state.js';

export function triggerRandomEvent() {
  const event = events[Math.floor(Math.random() * events.length)];
  if (event.effect) {
    for (const [key, value] of Object.entries(event.effect)) {
      if (key === 'money') state.money = Math.max(0, state.money + value);
      else state[key] = Math.max(0, Math.min(100, state[key] + value));
    }
  }
  return event;
}
