# Python Dungeon v1.18 — identity and menu music

Scope: original shared logo, sourced hero-selection and map compositions, and a visible welcome sound control. Login, learner saves, ranking, lessons, combat rules and battle tracks are retained.

## Sources and shipping

- Entrance / hero selection: Mystical RPG Maker Town Theme by symphony, CC0. Original page https://opengameart.org/content/mystical-rpg-maker-town-theme
- Expedition map: RPG Ambience - Exploration by HitCtrl, CC-BY-3.0. Original page https://opengameart.org/content/rpg-ambience-exploration
- Composer, source, license link and modification notices are in the public MENU-MUSIC-CREDITS.txt. menu-music-v18.json records source/output hashes, static gain and exact durations.
- Full-length looping compositions were retained: 73.143s and 126s. Static gain, 44.1kHz Vorbis q4 encoding; no cut, added fade or invented music. The runtime applies a short fade only at song entry. Shipped sizes: 928426 and 2076989 bytes.
- Original runegate-serpent and pixel-wordmark SVGs use only local geometry; no external assets/fonts/scripts. Header, favicon and guild use the same mark. Hero selection uses the same wordmark. Explicit image dimensions reserve layout space.

## Verification executed

- npm test: 15 reported checks pass, including 2407 Python validation checks. The added music suite covers two licensed Ogg files, distinct source hashes, full lengths, one active recording, same-scene preservation, rapid transitions, stale callbacks, original battle selection and mute cleanup.
- npm run build and node --check on the changed runtime JS: pass. git diff --check: pass.
- Real browser menu-music lab: both new sources reached readyState 4 and advanced playback time with loop=true and volume=.44. The intro advanced 27.064s to 27.328s on selecting the same scene with sameElement=true. Twelve rapid scene changes left one map recording. The original battle file also reached readyState 4 and advanced playback time; master mute left zero media elements.
- A disposable real-service QA learner was registered for the actual game flow. The new welcome button enabled the intro recording; changing hero preserved the playing source and time (0.822s to 1.128s, one player). Starting the adventure switched to the exploration source. No real learner's account or save was reset.
- A narrow 390px iframe had actual document width 375px and scrollWidth 375px. All logo images loaded. Header brand measured 178px and music button 334.667px, both within the viewport. Native labels, button focus and the pre-existing mandatory login remained available.
- Design context lint: 0 errors / 0 warnings. Premium strict audit was executed and retained the same 8 dynamic-handler false positives as v1.17, with 0 unresolved ownership rows; this is not claimed as a clean static audit.
- Desktop and narrow screenshots were inspected. Menu/atlas playback and the original battle track were checked through their actual HTML audio elements. Audio classification is based on original composer descriptions; these checks do not substitute for a human's subjective music preference.

The production release is verified after its Git deployment with the public version, logo and music URLs, plus the existing auth/cloud smoke flow. Development music QA is not published by the static build.
