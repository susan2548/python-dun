# v1.13 animation and combat sound QA

Scope: presentation for the three heroes and six monsters. Combat numbers, lesson progression, prices, save migration and existing background tracks are unchanged. Public player saves were not used for combat or reset tests; fixtures ran on a separate localhost origin.

## Verified

- Browser motion lab: 35 actions across all nine actors, including every hero skill, normal attacks, guard, Focus, both potions, and every monster special animation. Each action produced exactly one gameplay impact, visited authored pose frames and removed its temporary root transform/projectile. A second 35-action pass tested reduced-motion static poses without travel. The final zombie poison adjustment was separately retested as a melee rush rather than a projectile.
- Four new idle poses per actor, weighted timing and foot-contact lock. Transparent nine-actor preview sheet inspected; guard and Focus screenshots inspected in the actual dungeon scene. Constant display scale applies to all poses, including retained potion art. Spectres float instead of using planted boots.
- Real Python answers in-game: rogue double strike, wizard fireball and knight shield bash advanced from lesson 1 to lesson 2, cleared the editor, deducted MP once and retained cooldown/status behavior. Knight cut-in skipped through the visible Skip button: overlay and voice caption immediately removed, action continued, MP 6 → 3 and one lesson recorded.
- Guard/Focus actual turns: rogue guard preserved MP 7 and lesson 0/3, reduced the first poison bite to 8 HP; Focus changed MP 7 → 8 once and showed the next-turn buff. Knight Focus changed MP 5 → 6 once. Poison continued ticking and counterattacks still happened. Healing potion used the lift/sip frames and consumed one item/one turn.
- Audio: all 21 MP3s decoded successfully in browser Web Audio; durations 1.30–2.79 seconds and decoded sample peaks 0.634–0.920 (non-silent, below clipping). Foley is credited CC0; speech is original synthetic English. Playback was exercised through the master sound control. Muting during a wizard Focus removed the active caption immediately. Voice preference toggle preserved HP/MP/turn and was switched back on after testing. Skip/scene/mute invalidate pending audio and prevent stale queued lines.
- Responsive check: actual game in a 390px-wide iframe. No horizontal overflow or blocked command controls; guard pose and status HUD visible. Narrow-screen captions are positioned above the editor CTA and ignore pointer input.
- No browser error/warning logs in the observed real gameplay sessions. Master sound defaults off on a fresh page; game remains playable muted or if an optional audio file fails. Original pose assets remain the image-load fallback.

## Automated checks

`node --test animation-profiles.test.mjs class-balance.test.mjs tactical-engine.test.mjs combat-rules.test.mjs code-editor.test.mjs map-state.test.mjs` — all six suites pass. New checks cover monotonic timing, contact across 10/30/60/144 fps, exact hit-stop phase, return to origin, valid frame bounds/dimensions for nine atlases and all 21 distinct voice assets.

`node --check` for changed JS modules — passed. `designmd lint DESIGN.md` — zero errors/warnings. Premium strict UI audit retains the five previously documented actionless-button false positives: runtime handlers on map template, command template, header Home/audio and world template. Those controls have real handlers; normal gameplay and the new voice toggle were exercised. No placeholder handler was added to silence the scanner.

## Limits

This pass tests the animation/audio layer and representative real Python turns, not a new full six-floor balance campaign or every browser/device. Audio decoding, sample levels and runtime controls were checked; the emotional quality of synthetic acting remains a subjective listening judgement. New voice lines are generated speech rather than studio actors. Chrome's reduced-motion path was exercised through the local test fixture; it was not a device-wide accessibility setting change. Source WAVs, the voice model and its inference dependencies are development-only and are not shipped or loaded by players.
