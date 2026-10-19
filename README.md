# MJINII LIFE

A Kenyan urban life simulation — work, eat, hustle, survive, and keep your people close.
Black + acid green (#ccff00) editorial minimal.

**Original content only.** Lagos Life (lagoslife.app) was a mechanics reference (life-sim loop, meters, daily actions, random events). No copied text, art, or branding.

## Run it

```bash
npm run serve      # http://127.0.0.1:8088
```

Any static server works. `--bind 127.0.0.1` matters on Windows — plain `localhost` can fail to connect.
ES modules require a server; opening `index.html` via `file://` will not work.

## Test it

```bash
npm test           # 182 checks across 5 dependency-free suites
```

| Suite | Covers |
|---|---|
| `tests/smoke.mjs` | content counts, every action, meter bounds over 400 turns, rent cycle, event variety, log cap, reset |
| `tests/npc.mjs` | relationship tiers, visit/gift gains and daily limits, perks at each tier, persistence, legacy-save migration |
| `tests/dom.mjs` | `ui.js` against a DOM shim — buttons, meters, NPC cards, routing, log cap, next-day render path |
| `tests/e2e.mjs` | **runs `index.html`'s own inline script** under Node and plays the game: boot, start, act, visit, gift, advance days, reset |
| `tests/wiring.mjs` | every queried element id exists in `index.html`, imports resolve, no redeclaration, PWA files linked |

`e2e.mjs` is the closest thing to a browser here — it loads the real page script, so the visit/gift router, autosave, and daily limits are exercised exactly as the browser would run them.

## Structure

```
index.html          entry point: markup, styles, wiring (no game rules)
manifest.json       PWA manifest
sw.js               offline service worker
icon-192.png        generated app icons
icon-512.png
src/
  content.js        ALL game data — archetypes, locations, foods, actions, gifts, events, NPCs
  state.js          state object, localStorage save/load, reset, MAX_LOG, NPC-save migration
  actions.js        the 13 player actions (mutate state, return a log line)
  npcs.js           interactive NPCs: relationships, visits, gifts, perks, day events
  turn.js           day advance: decay, rent cycle, random event, NPC event, happiness
  events.js         random event picker + effect application
  ui.js             render functions (stats, meters, actions, NPC cards, log, archetype grid)
tests/              headless verification
tools/
  make_icons.py     regenerates the PWA icons (pure stdlib, no Pillow)
```

Content lives in `content.js` as data — adding a city, action, event, gift, or NPC is a data edit, not a rewrite.

## Your Circle — the relationship system

Three NPCs, each with a relationship that moves between **Stranger → Acquaintance → Friend → Close** (0–100).

- **Visit** — costs 8 energy, once per NPC per day. Early visits move the needle faster (+10 below 25, then +6).
- **Gift** — costs money, once per NPC per day. A gift the NPC actually likes gives **+18** instead of +6. Each card tells you which ones they love.
- **Tier voice** — each NPC speaks differently to a stranger than to family, and crossing a tier is announced in the log.
- **Perks** — real relationships pay back, at random so a visit stays a small gamble:
  - **Shiro** (Kibera) feeds you once you are Friends.
  - **Uncle J** (Eastlands) talks sense at Friend, and at Close may press KES 1,000 into your hand.
  - **Nairobi Doc** (Westlands) refers you for a KES 1,500 gig at Friend or above.
- **They reach out** — once someone is a Friend, they may check in on a new day (+8 social).

Relationships persist in the save. Older saves without NPC data are migrated on load, not broken.

## Decisions

- **Theme:** Kenyan original, "MJINII LIFE". Black + acid green editorial style.
- **Platform:** web-first installable PWA, then Capacitor wrap for Android/iOS. Vite is set up but not required to play; dependencies stay light.
- **Language:** natural English mixed with Sheng and Swahili — fun and respectful, not stereotypical.

## Phase status

- **Phase 0 — complete.** Fresh repo, `.gitignore`, README, HANDOFF. Sim files moved in; Gani.iyo fashion files untouched.
- **Phase 1 — complete.** Modules split, save/load, mobile-first responsive, capped event log, PWA + offline, 12 locations / 13 actions / 18 events.
- **Phase 2 — interactive NPCs complete.** Relationship meters, visits, gifts with likes, tier voices, perks, relationship-gated day events.
- **Next:** wire `locations` and `foods` into place-based choices; balance pass; Capacitor wrap.

## Legacy files

`mjinii-life.html`, `kenya-life-sim.html`, `lagos-life-characters-cities.html` are the pre-refactor sources, kept for reference (per the "don't delete, move or copy" rule). `index.html` is the live game.
