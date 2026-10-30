# Expedition Atlas v1.8 — verification

Checked 2026-10-31, Asia/Bangkok. Browser fixtures are kept outside the deployed project and affect localhost only.

## Source checks

- `node --check game.js` and `node --check expedition-map.js`: passed.
- `node map-state.test.mjs`: fresh progress, locked entry, intermediate stars, replay with an unfinished battle, all-clear and read-only save views passed.
- Existing editor, tactical/economy and combat-rule test suites passed during this change.
- `designmd lint DESIGN.md`: 0 errors, 0 warnings.
- Lossless WebP conversion: identical decoded RGB pixels, 25% smaller file.

## Browser flows

- Fresh save: all six rooms visible, floor 1 available, higher rooms inspectable but entry disabled. Inspecting boss does not move the player marker or unlock the floor.
- Midway fixture: cleared 3 floors, grades 3/2/1, total 6/18 stars, HP41/82 and MP0/12. Passed routes, next route, hero marker and displayed counters matched the save.
- Global continue while previewing locked boss still entered floor 4, with the same HP/MP; no lesson skipped.
- Unfinished replay fixture: cleared 3 floors but battle pending on floor 2, phase 1, turn 5, HP38 MP2, enemy HP72. Map selected the unfinished room, blocked starting another unlocked room, and restored that exact battle/lesson/resources using the resume link.
- All-clear fixture: six completed rooms, none locked, boss retry available, earlier-room replay enabled. This is a state-fixture test, not a six-floor playthrough claim.
- Shop: mana purchase changed gold65→47 and inventory2→3. New camp and header counters updated immediately; HP/MP remained unchanged.
- Inn: paid30, changed HP41→82 and MP0→6, gold47→17; map and selected-room resource display agreed after closing the NPC screen.
- HP0 fixture: both entry and global continue disabled with a rest explanation; inn remained usable. Rest restored 55HP/6MP and re-enabled entry.
- Reset confirmation: cancel preserved resources. Initial focus is set to Cancel to prevent accidental keyboard confirmation.
- Class hall: changing wizard→knight at 55/82 HP and 6/12 MP produced 98/145 HP and 5/10 MP, with the new portrait/class/mission resource line updated; no free refill.
- Keyboard: End selected boss preview without entering; native button and visible focus interactions retained.
- Desktop 1280×720: room-button bottoms were all within the viewport (maximum 702px), and mission entry was visible at about 674px after arranging the dossier content.
- Mobile: a real 390×844 CSS-pixel iframe viewport; child document width375px, all six room controls inside the board, 60px-tall touch areas, full bottom-row stars, and compact hero marker without covering another room's stars. Locked-room preview and resources remained correct. No physical handset/virtual-keyboard claim.

## Static audit limitation

The premium UI scanner still reports five `affordance.actionless-button` findings because it only detects inline handlers. The new map resume button and existing header/command/hero buttons use explicit JavaScript handlers. Resume, map selection, shop, inn and game navigation were exercised in the browser. These were reviewed as false positives; the static audit is not described as a clean pass.

Game balance, Python validation, battle animations and music were not redesigned by this map release. The learning sequence and saved resources remain protected by the existing game functions plus the new read-only map-state adapter.
