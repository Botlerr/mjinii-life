# MJINII LIFE

A Kenyan urban life simulation — work, eat, hustle, survive. Black + acid green (#ccff00) editorial minimal.

**Original content only.** Lagos Life (lagoslife.app) was a mechanics reference (life-sim loop, meters, daily actions, random events). No copied text, art, or branding.

## Run it

```bash
npm run serve      # http://127.0.0.1:8088
```

Any static server works. `--bind 127.0.0.1` matters on Windows — plain `localhost` can fail to connect.
ES modules require a server; opening `index.html` via `file://` will not work.

## Test it

```bash
npm test           # 78 checks: game logic, UI render layer, wiring/PWA
```

Three headless suites, no dependencies:

| Suite | Covers |
|---|---|
| `tests/smoke.mjs` | content counts, every action, meter bounds over 400 turns, rent cycle, event variety, log cap, reset |
| `tests/dom.mjs` | `ui.js` against a DOM shim — buttons, meters, NPC cards, log cap, next-day render path |
| `tests/wiring.mjs` | every queried element id exists in `index.html`, imports resolve, no redeclaration, PWA files linked |

## Structure

```
index.html          entry point: markup, styles, wiring (no game rules)
manifest.json       PWA manifest
sw.js               offline service worker
icon-192.png        generated app icons
icon-512.png
src/
  content.js        ALL game data — archetypes, locations, foods, actions, events, NPCs
  state.js          state object, localStorage save/load, reset, MAX_LOG
  actions.js        the 13 player actions (mutate state, return a log line)
  turn.js           day advance: decay, rent cycle, random event, happiness
  events.js         random event picker + effect application
  ui.js             render functions (stats, meters, actions, NPCs, log, archetype grid)
tests/              headless verification
tools/
  make_icons.py     regenerates the PWA icons (pure stdlib, no Pillow)
```

Content lives in `content.js` as data — adding a city, action, or event is a data edit, not a rewrite. That is what keeps a second city or theme cheap later.

## Decisions

- **Theme:** Kenyan original, "MJINII LIFE". Black + acid green editorial style.
- **Platform:** web-first installable PWA, then Capacitor wrap for Android/iOS. Vite is set up but not required to play; dependencies stay light.
- **Language:** natural English mixed with Sheng and Swahili — fun and respectful, not stereotypical.

## Phase status

- **Phase 0 — complete.** Fresh repo, `.gitignore`, README, HANDOFF. Sim files moved in; Gani.iyo fashion files untouched.
- **Phase 1 — complete.** Modules split, save/load, mobile-first responsive, capped event log, PWA + offline, 12 locations / 13 actions / 15 events / 3 NPCs.
- **Phase 2 — not started.** Content expansion, more NPC interaction, Capacitor wrap.

## Legacy files

`mjinii-life.html`, `kenya-life-sim.html`, `lagos-life-characters-cities.html` are the pre-refactor sources, kept for reference (per the "don't delete, move or copy" rule). `index.html` is the live game.
