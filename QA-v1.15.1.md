# QA — v1.15.1 whole-frame character rendering

## Report and cause

The user reported a horizontal break in the adventurer/slime idle animation, with a lower body that stayed frozen. `sprite-motion.js` drew the upper 212px from the current idle frame, then overlaid the last 44px from frame zero. Different silhouettes and body positions could not join at that cut. An extra 1px grounded-body bob also shifted the upper section away from the fixed lower section.

## Change

Every pose is now drawn as a complete 256×256 frame. Grounded actors use the atlas's shared sole baseline without an added vertical bob. Authored legs, feet, cloth and body move together. Wraith, bat and sentinel offsets still translate the entire frame. There are no new sprite assets or combat-rule changes. The game entry and sprite-module versions are bumped to invalidate the old browser module cache.

## Regression evidence

The browser page `tools/sprite-integrity.html` mounts the actual renderer, samples all four idle frames, and compares opaque canvas pixels against the corresponding original atlas tile. Floating actors are checked against allowed whole-frame integer offsets. It compares the entire body and separately counts mismatches below y=212.

- Actual previous renderer from Git `0dc49d9`: adventurer and slime both fail. Adventurer frames 1–3 have 1,491–1,783 mismatching lower-body pixels; slime frames 1–3 have 2,881–3,318. This reproduces the reported frozen-band seam.
- Fixed renderer: **15/15 actors, 60/60 idle frames pass**, with zero opaque-pixel mismatches. Slime frames 1–3 change 11,975 / 13,738 / 12,946 lower-band channel values from the initial pose: its lower body is no longer frozen.
- The pixel check includes all three heroes, all six original monsters and all six new monsters.
- Existing `node --test *.test.mjs`: all nine suites pass, including 15-actor timing, one-contact combat, class roles, status/resource rules, question bags, editor checks and 2,407 Python validation cases.

## Playtest

Used a separate `127.0.0.1:8779` origin and a fixture adventurer/slime battle. Normal attack, double strike and potion actions were exercised, with both actors returning to full-frame idle poses. The action result, question advancement, resource use and turn banners still work. The production player's save was not used for these combat tests.

Rerun the pixel regression by serving the repository locally and opening `/tools/sprite-integrity.html`, then pressing the test button. The optional local `before=1` demonstration expects the previous renderer fixture outside the repository; the default test uses the shipped renderer only. If reduced motion is enabled, the renderer intentionally holds a single idle pose, so the four-frame test reports that condition instead of claiming complete coverage.
