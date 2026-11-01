# v1.15.2 — overlapping monster fallback

The six new enemies use an inline `background-image` portrait in `renderBattle` during atlas loading. The stylesheet `.fighter.raster-ready { background-image: none }` cannot override an inline image. Consequently the static body/weapon remains behind the animated canvas; floating sentinel poses make the double axe especially visible.

After a successful atlas load, `mountSpriteMotion` explicitly sets the fighter's inline background image to `none`. Failure leaves the original portrait intact. Frame composition, statistics, lesson checks, saves and combat/audio timing retain their behavior. Entry module and sprite renderer URLs advance to avoid stale module caching.

## Verification

- `tools/sprite-layering.html` reproduces the real inline fallback for all six new enemies, runs their normal and special moves through the actual combat module and samples the computed background during each move.
- Previous Git renderer: 0/6 pass, inline portrait visible behind every mounted canvas, overlap detected in all 12 moves.
- Fixed renderer: 6/6 pass; loading portrait visible before mounting; one canvas and no background after mounting, during idle, during all 12 moves and on return. Each move fires its contact callback once.
- Actual local game: entered room 11 with an adventurer through normal start/continue UI using a disposable localhost save. Sentinel has one canvas and computed background `none`; screenshot shows a single axe/body. Browser warning/error log empty.
- `node --test animation-profiles.test.mjs`: pass (15 actors, all pose slots, distinct travel paths and one-contact timing).
- `node --check sprite-motion.js` and `git diff --check`: pass.

Evidence outside the published app: `../asset-sources/layer-before-v1152.json`, `layer-after-v1152.json`, `animation-layer-fixed-v1152.jpg`.
