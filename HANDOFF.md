# HANDOFF — MJINII LIFE

Updated: 2026-10-19 · Session: Phase 2 — interactive NPCs

## Current state

Playable at `http://127.0.0.1:8088` (`npm run serve`). Phase 0, Phase 1, and the Phase 2
NPC system are complete and verified. Working tree committed; nothing half-done.

Pick an archetype → act → visit/gift your circle → advance the day → rent cycle → random
and relationship-gated events → autosave. Continue / New Game / Reset all work; reload restores
the run including every relationship.

## What changed this session

Phase 1 was completed first (see the previous handoff entry in git history): all 13 actions
wired, day/rent/event loop extracted to `src/turn.js`, NPC panel rendered, log capped, PWA
finished, responsive breakpoints, test suite added.

This session added the interactive NPC layer:

1. **`src/npcs.js` (new).** Relationship model — tiers, clamping, visits, gifts, perks, and
   the relationship-gated day event. Game rules live here, not in the UI.
2. **`content.js` grew a real NPC schema.** Each NPC now has `location`, `likes`, four
   tier-specific voice lines, and a stated perk. Added a `gifts` catalogue (chapati, airtime,
   book, sneakers) and 3 more events (18 total).
3. **Interactive NPC cards.** Relationship meter with tier label, the NPC's current voice line,
   a Visit button and one gift button per gift. Visit and gift buttons disable themselves once
   used for the day, so the once-per-day limits are visible rather than just enforced.
4. **Router extended.** `index.html` now routes `visit_<npcId>` and `gift_<npcId>_<giftId>` in
   addition to plain action ids.
5. **Relationships persist.** Saved with the run, and older saves without NPC data are migrated
   on load instead of breaking.
6. **Fixed a real bug found by the new tests.** `load()` used `Object.assign`, so any field the
   save did not carry silently kept whatever was in memory — a legacy save inherited stale
   relationships. `load()` now resets what the save does not carry.
7. **Two new test suites** — `tests/npc.mjs` (44 checks) and `tests/e2e.mjs` (41 checks).

## Verification

`npm test` → **182 passed, 0 failed** across five suites.

The important one is `tests/e2e.mjs`: it extracts the inline module from `index.html`, runs it
under Node with a DOM shim, and plays a real game — boot, start, work, visit, gift, advance days,
hit the log caps, reset. So the actual page wiring is exercised, not a copy of it.

Also asserted: relationships clamp at 100 and never go out of range over 40 days; every perk
fires at its tier and not below it; visits/gifts are refused when tired, broke, or already done
that day; a legacy save is migrated; a bogus action id changes nothing.

**Still not verified in a real browser.** The headless browser times out on this host, so
rendering is covered by the DOM shim and the e2e run rather than actual pixels. One manual pass
on a phone and at 360px / 768px in devtools remains worthwhile — especially the new NPC cards,
which are the densest UI on the page.

## Next

- Manual visual pass at 360px and 768px, focusing on the NPC card grid.
- Wire the `locations` and `foods` data into actual place-based choices (both are still
  decorative — nothing reads them yet).
- Balance pass once played: `lapo` starts at KES 200 against KES 4,500 rent.
- Capacitor wrap for Android/iOS.

## Open questions

1. **Relationship pace.** Currently a Friend is roughly 4 visits or 2 liked gifts away from a
   start of 10. Faster, slower, or about right?
2. **`lapo` starting balance** (KES 200 vs KES 4,500 rent) — intended brutality, or too punishing?
3. **Should relationships decay?** Right now they only go up. A slow drift down when you ignore
   someone would add pressure, but it can also feel like nagging.
