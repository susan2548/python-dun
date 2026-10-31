# Asset credits — Python Dungeon v1.5

## Animation and combat sound v1.13

Nine original transparent atlases in `assets/animation-v13` were generated with the built-in Imagegen editor, one full sheet per approved character reference. Character identity, costume, palette and facing were specified from the shipped art. Hero layout: 4 columns × 4 rows (idle 0–3, anticipation/attack/recovery 4–7, technique 8–11, guard 12–13, Focus 14–15). Monster layout: 4 columns × 3 rows (idle, attack, special). No scenery or labels. Crisp pixel clusters, unchanged scale and planted stance root were required. `manifest.json` records source generation filenames, alpha-isolation boxes, shared packing scale and frame counts. `tools/pack-animation-v13.py` packs the sheets and appends two existing hero potion poses; the spider's baked projectile pose is replaced with its open-fang contact pose, because the runtime owns projectile timing. Previous pose atlases remain as fallback assets.

Study sources: [Aseprite frame duration](https://www.aseprite.org/docs/frame-duration/) and [animation workflow](https://www.aseprite.org/docs/animation/) for discrete poses and deliberate timing; [GDC: Zip! Thwack! Ping!](https://media.gdcvault.com/gdc2018/presentations/Lyndon_Michael_ZipThwackPing.pdf) for anticipation, action, reaction and impact. New authored art and code are used; reference games' assets are not redistributed.

Nine selected Foley files in `assets/combat-audio` are from [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) and [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds), both **CC0**. Original license texts are included beside the files. The rename/source map is in `tools/prepare-combat-audio.py`. Synthesized spell sweeps, noise bursts and chords are original project sound design layered with these recordings.

Twenty-one English character voice recordings are original **AI-generated speech**, using the local [Kokoro.js](https://github.com/hexgrad/kokoro/blob/main/kokoro.js/README.md) pipeline and [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) model (Apache 2.0 model license). No real person's voice was cloned. `voices.json` includes every transcript, voice preset, file and synthetic flag. Filtering, normalization, subtle echoes and monster pitch treatments are recorded in `tools/prepare-combat-audio.py`. Only rendered MP3s ship; the model, inference dependencies and source WAVs are excluded. Voice playback runs locally in the browser and does not send players' code or data to a speech service. Master sound starts off; character speech can be disabled independently.

## Recorded battle music (CC0)

All six recordings are bundled locally, looped in the browser, and unchanged except the final boss WAV was encoded to MP3 at 128 kbps. Map music remains the original Web Audio composition.

| Floor | File | Music / creator | Source |
| --- | --- | --- | --- |
| 1 | `assets/audio/ruins-battle.mp3` | Battle Theme / Wolfgang_ (Ted Kerr) | https://opengameart.org/content/battle-theme-0 |
| 2 | `assets/audio/bone-march.mp3` | Boss Battle Theme / Cleyton Kauffman | https://opengameart.org/content/boss-battle-theme |
| 3 | `assets/audio/venom-rush.mp3` | Hard Battle 1 / MintoDog | https://opengameart.org/content/hard-battle-1 |
| 4 | `assets/audio/shadow-hunt.ogg` | Battle RPG Theme Variation / Cleyton Kauffman | https://opengameart.org/content/boss-battle-theme |
| 5 | `assets/audio/arcane-siege.mp3` | JRPG Epic Rock Battle Theme #1 / HydroGene | https://opengameart.org/content/jrpg-epic-rock-battle-theme-1 |
| 6 | `assets/audio/final-boss.mp3` | Epic Boss Battle / Juhani Junkala | https://opengameart.org/content/boss-battle-music |

Each source page lists CC0: https://creativecommons.org/publicdomain/zero/1.0/ . No commercial game's soundtrack is redistributed.

## Skill icons

Selected icons from **496 pixel art icons for medieval/fantasy RPG**, Henrique Lazarini (7Soul1), submitted by gnola14, CC0. The source compilation explicitly removes derivatives incompatible with public domain distribution.

Source: https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg

`assets/icons/shield.svg` is original project artwork. Other selected icon filenames retain the source names; they are displayed at integer-friendly pixel sizes without recolouring.

## Original cut-in portraits

`assets/cutin-portraits.png` was generated with the built-in Imagegen tool, as a three-column portrait atlas. New art, not taken from the user's reference screenshot. Prompt: three equal-width bust portraits in crisp dark JRPG pixel art — masked emerald rogue crossing daggers; silver knight with blue plume and gold-blue shield; blue-hatted elderly wizard conjuring fire. Dark backgrounds, equal scale, no text, no borders. CSS supplies distinct green slash, gold aegis and orange-violet rune compositions.

## Design references

- Pixel animation fundamentals: https://www.sandromaglione.com/articles/pixel-art-character-animations-guide
- Sprite timing and frames: https://aseprite.com/docs/animation/
- Dark dungeon soundtrack reference (study only, not bundled): Stuart Chatwood's official Darkest Dungeon II soundtrack, https://stuartchatwood.com/store

## NPC locations and interface v1.6

`assets/npc-locations.png` is new project art generated using the built-in Imagegen tool. Prompt: a two-column original pixel-art scene atlas — a welcoming copper-bearded merchant with spectacles behind a potion/weapon counter, and an auburn-haired innkeeper behind a timber reception desk with a hearth and bed alcove. Equal-width panels, expressive waist-up NPCs, warm lantern light, deep blue shadows, crisp JRPG pixel clusters, no words or UI. CSS supplies Thai dialogue and interaction. Source generation: `exec-27238a02-68b2-4b1d-9bca-d56c4f220f53.png`; final saved project asset: `assets/npc-locations.png`.

Additional potion, armour, focus, ice, shadow and book icons keep their original filenames from the same CC0 496 RPG icons source listed above. `assets/icons/bleed.svg` and `assets/icons/inn.svg` are original project pixel-style SVG artwork.

Interaction references: https://www.roblox.com/games/80734098185936/An-Average-Campaign and https://dl.degica.com/rpgmakerweb/tutorials/RPGVX_Tutorial_Level_7.pdf . No models, UI assets, or game code from Roblox are redistributed.

## Authored pose atlases v1.7

Nine new transparent pose atlases were generated with the **built-in Imagegen tool**, edited from each approved in-game seed. Final project assets:

- `assets/poses/adventurer.png`, `assets/poses/knight.png`, `assets/poses/wizard.png`: 8 poses each, 4 columns × 2 rows, 256px cells. Ready, inhale, windup, strike, charge, release, lift bottle, sip.
- `assets/poses/zombie.png`, `assets/poses/skeleton.png`, `assets/poses/spider.png`, `assets/poses/wraith.png`, `assets/poses/golem.png`, `assets/poses/necromancer.png`: 6 poses each, 3 columns × 2 rows, 256px cells. Idle pair, windup/contact, skill charge/release.

The **exact final prompt set and source-generation filenames** are saved in `assets/poses/prompts.json`. All characters preserve the source costume, facing, palette and readable identity. Normalization uses one scale across each atlas, reviewed stance roots, bottom baseline, nearest-neighbour sampling, and connected alpha isolation to avoid cutting a staff or including a neighbouring pose. `tools/normalize-poses.py` records that deterministic packing process (development-only Pillow, NumPy, SciPy dependencies). No generation API key is needed to run the game.

`assets/fx/fireball.svg` is original code-native pixel-cluster VFX. Red/blue potion colour feedback is applied at runtime; no external game's art was copied.

Animation study sources: [GDC: Zip! Thwack! Ping!](https://media.gdcvault.com/gdc2018/presentations/Lyndon_Michael_ZipThwackPing.pdf) for anticipation/action/reaction and impact timing; [Aseprite frame duration](https://aseprite.com/docs/frame-duration/) for deliberate frame timing; [Sandro Maglione's pixel character animation guide](https://www.sandromaglione.com/articles/pixel-art-character-animations-guide) for pose readability. These inform the newly implemented motion, rather than supplying redistributed assets.

## Expedition map v1.8

`assets/dungeon-atlas.webp` is original environment artwork generated with the **built-in Imagegen tool**. The six chambers are the mossy entrance, ruined hall, green crypt, purple web cavern, cyan arcane library, and crimson-violet throne room. No characters, labels or UI are baked into the image. Source generation: `exec-e9a86184-b3d4-4b94-a469-a605865e26d3.png`. The complete final prompt is in `assets/dungeon-atlas-prompt.txt`.

The final WebP is a lossless conversion of the generated PNG: decoded RGB pixel equality was verified. It reduces the image from 3,234,694 to 2,425,476 bytes. The source PNG remains in the local asset-source archive; only the final WebP is requested by the game. Star/status/lock/path graphics are original SVG/HTML/CSS, with existing character portraits and NPC assets reused.

### Research and adaptation

- [Slay the Spire, official Mega Crit store description](https://store.steampowered.com/app/646570/Slay_the_Spire/) describes planning risky or safe routes through changing layouts. Adaptation here: show the next room's enemy, special move, learning topic and current resources before entry. This game deliberately retains its six-floor linear teaching order; no random branches or skippable lessons were introduced.
- [Darkest Dungeon, official Red Hook overview](https://www.darkestdungeon.com/darkest-dungeon/) presents distinct forests, warrens and crypts within a dark expedition fantasy. Adaptation here: make each room visually identifiable while keeping the existing dungeon palette and pixel art style.
- [Official Darkest Dungeon Wiki: Dungeon Map](https://darkestdungeon.wiki.gg/wiki/Map) and [Slay the Spire Wiki: Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation) were studied for room/path legibility, route state and encounter information. The new board and interface are original; no maps, textures or UI assets from these games are redistributed.

The main visual signature is a living-looking underground atlas with readable overlays. Actual player position, selected preview, completed rooms and locked rooms are separate states. Existing game save, star grading, monster balance, shop stock, rest costs and HP/MP carryover remain owned by their prior game systems.
