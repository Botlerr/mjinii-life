# MJINII LIFE

Kenyan urban life simulation. Black + acid green (#ccff00) editorial minimal.

## Project State (Phase 0 complete)
- Fresh repo at C:\Users\user\mjinii-life\
- Copied sim files: mjinii-life.html, lagos-life-characters-cities.html, kenya-life-sim.html
- .gitignore set (node_modules/, *.log, AppData/)
- No build system yet; pure HTML/JS

## Decisions Final
- Theme: Kenyan original. Lagos Life (lagoslife.app) = mechanics reference only.
- Platform: PWA (browser) → Capacitor wrap for Android/iOS.
- Content driven by data (JSON/JS modules), not hardcoded.

## Next: Phase 1 (Vertical Slice)
- Refactor into modules (state, actions, events, UI, content)
- Mobile-first responsive layout
- localStorage save/load + autosave
- PWA manifest + service worker
- 3+ locations, 12+ actions, 15+ events, NPC friends
