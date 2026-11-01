---
version: alpha
name: Python Dungeon
description: Thai Python learning through a dark pixel dungeon RPG, with readable code and telegraphed combat.
colors:
  background: "#0c151b"
  surface: "#15242a"
  text: "#edf2df"
  muted: "#9db5b4"
  primary: "#9be8c2"
  warning: "#f6c876"
  danger: "#eb817c"
  editor: "#102d33"
typography:
  body:
    fontFamily: '"Chakra Petch", sans-serif'
  display:
    fontFamily: '"Press Start 2P", monospace'
  code:
    fontFamily: 'Consolas, "Chakra Petch", monospace'
rounded:
  DEFAULT: "0px"
  editorButton: "3px"
omitted:
  - section: spacing
    reason: Existing screen-specific dungeon layouts remain canonical; no global spacing migration in this change.
  - section: components
    reason: Runtime selectors and ownership mapping below define the existing components.
---

# Python Dungeon design context

## Overview

An enchanted writing desk beside a readable side-view dungeon fight. Thai beginners must write real Python and understand each lesson. The requested editor reference sets the teal code surface, line numbers and compact command buttons. The game world retains its existing dark pixel identity, NPC scenes, map and recorded music.

Product register: a learning game. Signature: writing code makes the chosen hero visibly act. Familiar editing behaviour and clear Thai instructions take precedence over decoration. Avoid dashboard cards over the combat field and prefilled exercise solutions.

## Colors

Runtime CSS is canonical (ownership model B). `styles.css :root` owns background, surface, text, muted, primary/mint, warning/gold and danger/red. `editor.css :root` owns editor background and syntax semantic roles. This file mirrors accepted values; no generated theme adapter. Syntax differentiates keywords, functions, strings, numbers and comments, while the native textarea remains accessible.

## Typography

Chakra Petch supports Thai labels and reading. Press Start 2P is restricted to short display text. Editor uses Consolas with Chakra Petch for Thai; both paint and input share exactly 16px/28px metrics. Do not independently change one layer's geometry.

## Layout

Welcome and battle layouts remain. The v1.8 map uses a six-chamber pixel dungeon atlas, a selected-room dossier, and one adventurer camp strip. At short desktop heights the page narrows to keep all six room controls visible. On phones the full atlas remains visible with numbered markers and stars; full Thai room names appear in the selection status and dossier. No horizontal page overflow.

Code input is a separate DOM surface beneath the playfield. Native textarea owns scrolling; line numbers and syntax paint follow it. Editor grows from 252px to 420px then scrolls internally. Toolbar wraps on phones.

## Elevation & Depth

Borders and tonal layers define surfaces; battle effects stay transient. Skill cut-ins use the existing fixed overlay and skip controls. Gameplay state resolves once at the visible contact or sip marker, regardless of visual effects.

## Shapes

Square dungeon panels and pixel clusters. Editor helper buttons use a small 3px corner for clear touch targets. VFX curves are permitted for slash arcs and magic rings.

## Components

| Capability | Canonical owner | Behaviour / verification |
| --- | --- | --- |
| Code input | code-editor.js + editor.css | Native textarea, Thai IME, selection, undo, Tab, auto-indent, keyboard run; inert highlighted paint |
| Skill vocabulary | tactical-engine.js SKILLS + skillAliasMap() | Thai name and English ID resolve to one selected skill; worker validates lesson and power |
| Combat motion | combat-cinema.js + sprite-motion.js | Shared clock for root motion, pose, VFX and exactly one impact; cleaned after completion |
| Scrollbar | editor.css global baseline | Visible native scrollbar on input; paint/gutter are inert synced mirrors |
| Toast / modal | game.js existing toast/showModal | Shared status messages, modal focus and Escape behaviour retained |
| Expedition map | expedition-map.js + expedition-map.css | Read-only room inspection, explicit entry confirmation button, locked/replay/resume states; existing game.js owns starting a battle |
| Lesson and objective | game.js + learning-ui.css | Separate 22px Thai lesson heading; gold objective card precedes action choices, 21px prompt, explicit scroll/focus button to the blank editor; 19px text on phones |
| Status details | status-inspector.js + learning-ui.css | Both actors use real icon buttons. Hover/keyboard focus explains effects; click/tap pins a nonmodal panel with close/Escape/outside dismissal. Body-level positioning avoids scene clipping. Viewing never spends a turn. |
| Class statistics | hero-classes.js | One registry for roster/dossier, starting resource caps and combat damage. Adventurer 105 HP/10 MP/15 ATK, knight 145/8/9, wizard 82/24/6. Upgrade migration preserves remaining MP fraction once and never resets progress or injuries. |
| Required lesson completion | lesson-progress.js | Accepted answers are counted separately from the current phase. All direct/status damage keeps enemies at 1 HP until three answers pass. Three answers alone do not force a kill. Utility turns do not advance lessons. |
| Battle workspace | game.js + battle-workspace.css | Desktop: left briefing (gold objective + enemy plan), wider right command desk (Action, native editor, run feedback and supplies). History is a full-width native disclosure below both. At <=980px, briefing precedes commands/editor and then history. No fixed-height page or nested command scroller. |
| New adventure | game.js showResetPrompt + expedition-map.js | Visible header button with reset description. Cancel/Escape preserve the save. Confirm exits map state before persisting the fresh profile, clears active battle, then returns to hero selection. Never reset during QA on the public player's save. |
| Emergency items | tactical-engine.js prepareItemTurn | 20 HP / 3 MP, one turn, inventory cost, Focus consumed and statuses/cooldowns advance. One standard guard (60% counter reduction) protects the sip; enemy counter still happens. Poison can still offset recovery. |
| Learning stars | lesson-progress.js lessonStars | Three stars for no code corrections, two for 1–2, one for more. Survival still gates victory; remaining HP and random combat misses do not lower the learning grade. Existing best stars are retained. |

Inputs remain blank at new lessons. Toolbar inserts syntax and exact skill names, leaving the power expression empty. Guard is a mode choice with a separate one-turn confirmation, never fake Python. Busy state locks editing and helper buttons; validation errors keep code for correction. Thai is the UI language, Python API words remain English.

The scene's code button scrolls to the command desk; the objective's write button focuses the same existing textarea without inserting an answer. After a successful answer, scroll to the next objective. Only desktop refocuses the textarea automatically; phones keep the new objective visible without reopening the keyboard. History starts collapsed, preserves its open state through turn re-renders during this visit, and can be read without consuming a turn.

Map material tokens live in `expedition-map.css :root`: brass `--atlas-brass #d8b779`, parchment `--atlas-paper #efe5ca`, and dark slate `--atlas-dark #0c171f`. Existing mint remains the completed-route colour; gold marks the actual current/resumable room. A selected locked room uses a pale steel border, so selection never masquerades as an unlock. Stars use explicit filled/outlined SVGs with textual scores, not dark font glyphs.

Clicking a room only previews its scene, monster, HP/attack and Python topics. It does not start a battle or write a save. The mission entry button names the selected floor; the global continue button always resumes the unfinished battle or frontier. Other rooms cannot start while a battle is unfinished. Shop/inn/class actions reuse existing NPC and confirmation owners. HP/MP remains visible near entry and in camp; viewing the map never heals. The learning sequence stays linear despite the illustrated dungeon corridors.

Atlases contain authored joint/weapon poses at one shared scale with reviewed stance roots. Grounded poses share a sole baseline and move using the complete authored frame. Never freeze a lower-body band or join different pose frames at a horizontal cut. Attack sequence: windup → dash → contact hold → recoil → return. Spell sequence: charge pose → release pose → projectile → impact. Potion sequence: lift → sip/apply → lower. Reduced motion removes travel and idle animation while preserving timing semantics and one impact.

### Combat presentation v1.13

`assets/animation-v13` owns the original nine transparent atlases: four discrete idle poses, four attack poses, four technique poses; heroes also have two guard, two Focus and two retained potion poses. No opacity interpolation between body frames. Every visible body pixel comes from the same pose frame. Grounded actors have no added whole-body bob; packing aligns their feet while authored legs, cloth and torso move together. Floating actors receive a whole-frame vertical offset. Display scale is constant across every pose and the canvas is anchored at its bottom. `assets/poses` remains the loading-error fallback. The v1.15.1 regression tool at `tools/sprite-integrity.html` compares the renderer's actual canvas against all four original idle tiles, including the lower 44px where the old seam occurred.

`animation-profiles.js` owns pose phase boundaries and hit-stop. `combat-cinema.js` owns the single animation clock and one guarded gameplay callback. Melee commits at contact, spells at projectile arrival; the two rogue slashes still make one aggregate combat action. Zombies rush to bite; spiders cast webs, spectres and the boss cast curses. Guard has a dedicated raised pose held through the enemy counter; Focus has a class-specific gathering pose/rings. Misses use evasion and a whoosh instead of impact audio/body VFX. Reduced motion shows a static action pose with the same single gameplay callback.

### Recorded combat audio v1.14

`combat-soundbank.js` defines recorded weapon, material, spell and vocal takes; `combat-audio.js` owns loading, playback and cancellation. The current 86 MP3s in `assets/audio-v14` replace the v1.13 synthetic speech and procedural combat tones. Heroes use human performances from John Carroll's Warrior/Mage packs, with short effort barks for some normal attacks and distinct takes for all six skills. Creatures use the credited monster/creature recordings; the necromancer has a lightly treated mage performance. Sound captions name the Thai action and do not claim to transcribe nonverbal sounds. Six additional monster identities use 24 distinct, previously unused source takes, rather than pitch variants of an old monster.

Windup, weapon/projectile release and impact each own a separate cue. The two rogue swings have separately timed whooshes but one gameplay impact. Impact layers depend on target material or guard; misses use only a passing sound. Alternate source recordings cannot immediately repeat. Small pitch variation applies to effects, with the human actor's delivery retained. Limit overlapping effects to eight and voices to one; no waiting voice queue. Late decodes are discarded instead of producing an out-of-sync hit.

Master audio remains off on fresh load. The separately persisted “เสียงตัวละคร” switch controls speech, grunts and creature vocals, while keeping weapon/spell effects. Music ducks during a voice, and scene/mute events invalidate pending sounds. Voices begin with the actual action after the cut-in; the cut-in has a short recorded transition cue. Preloading is non-blocking and optional audio failure never delays a combat turn. Existing music, balance, lesson validation, cooldowns and save fields retain their ownership. Footer “เครดิตเสียง” links to public author/license/modification notices, including CC-BY-3.0 for ViRiX's magic effects.

## Topic campaign and handoffs v1.15

`campaign.js` owns twelve rooms, their topic groups, enemy identity, statistics and scene. Variables begin the route; print/comments, strings/operators, list, tuple/set, if, for, while, functions/parameters, math modules, classes/objects/methods and exception handling follow. Related subtopics share a room, while for/while/if remain separate. `question-bank.js` owns 100 serializable templates and save-backed shuffle bags (8–12 per room). The active question, randomized parameters and remaining bag survive reload and action selection; no authored solution enters runtime task data. A used template cannot repeat until its room's bag is empty, and the next cycle cannot immediately repeat the final template. Mixed-topic rooms rotate their constituent subtopics.

Enemy turn uses a muted red full-width band inside the playfield for 860 ms before enemy status ticks or attacks. Your turn uses mint for 760 ms after the whole counter resolves; all commands/editor/items remain locked until it leaves. Initial entry and resume also display Your turn. Completion commits resources, RNG and next question before that banner, so a reload cannot replay a completed counter. Victory/defeat do not announce a playable turn. Reduced motion removes the arrival animation but keeps the reading interval. Thai helper text accompanies the requested English labels.

Gold uses the dedicated pixel coin in `assets/icons/coin.svg` plus the visible word เหรียญ. Never reuse a decorative star/sparkle as currency. Wallet tooltip explains purchases and lodging; shop and inn prices use the same symbol. Diamonds remain decorative or denote skill effects, never money.

The new atlas is a three-column/four-row snake with twelve room markers and a single persistent room detail panel. Mobile increases map height and keeps 42px room targets and large stars; full names remain in the room's accessible label and detail panel. Selecting a locked room only inspects it. Legacy saves map old topic completions into the new stars without filling HP/MP or changing owned items; an unfinished original prompt is preserved. Discontinuous migrated completions remain replayable, and the next missing topic is the frontier.

New slime, mimic, scarab, bat, ice wolf and clockwork sentinel use six distinct authored 12-frame sheets in `assets/animation-v15`, with a shared scale per actor. They have different body shapes, idle periods, root paths (surge, hop, ram, dive, pounce, gear), ranged effects and status threats. No recolored old monster stands in for a new identity. Battle power growth advances every two rooms; resources persist across all twelve. Rewards fund the existing inn without granting automatic recovery.

## Learner accounts and hall of fame v1.16

The top bar adds a learner-account button, concise save status/recovery and an explicit ranking destination. `learners.js` owns Thai account forms and dashboard views; it reuses the game modal/toast. The modal makes background content inert and traps inputs as well as buttons. Passwords are masked with a show control. Use email/password managed by Neon Auth via the supported same-origin server toolkit. Google is not presented as enabled without its own provider configuration.

`cloud-save.js` owns account-bound retries and revisions. Guest saves retain the original storage key; each signed-in user has a separate local cache and remote database row. New accounts choose whether to copy guest progress. No silent cross-account merge. Cloud conflict resolution backs up local state before an explicit choice. Session/auth identity comes from verified server cookies. An expected account ID only prevents writes after another tab changes identity. Never expose credentials, email or internal IDs in ranking responses.

The hall retains dark slate, mint and brass, with a personal journey panel and readable native ranking table. Display four numbered champion places, then 20 rows/page. Only floor-clear events received while logged in count toward the twelve-room eligibility gate; imported stars do not automatically enter rankings. Higher total learning stars rank first, then first full-completion date. Replaying improves personal best; new-game reset retains historical rank. Ranking refresh waits for pending saves, uses actual results and has explicit loading/empty/error states. The table owns horizontal scrolling on phones; the page never overflows. `#ranking?page=N` restores the view on reload.

Run feedback is superseded by the speech-free v1.17 result cues below. Legacy Run voice files remain credited in the asset manifest, but no runtime Run action references them.

## Do's and Don'ts

- A fighter's loading portrait must retire when its animation canvas mounts, including inline background-image declarations. Keep the portrait if atlas loading fails; never render it behind a successfully mounted canvas. Test the composed DOM/CSS surface, not only canvas pixels.
- Keep names on skill buttons identical to accepted Thai command strings.
- Show the combat scene before an action starts; retain all lesson validation.
- Do not restore HP/MP on scene changes or allow animation timing to duplicate damage.
- Do not fill completed exercise answers through helper buttons.
- Status details show the actor, buff/debuff type, actual DOT damage, remaining owner turns and expiry rule. Re-rendering badges closes old details so expired effects cannot remain visible.

## Mandatory guild entrance and honours hall v1.17

Source: explicit user request on 2026-11-01. Starting or resuming gameplay requires a successfully loaded learner account. Anonymous users see the guild gate before any hero selection or playable UI. Public ranking remains readable; its return/start actions lead anonymous visitors to login. Logout hides resources and returns to the gate; legacy guest progress stays untouched solely for an explicit import into a new account. Existing saves and cloud revision rules remain unchanged. A known session can continue through temporary connectivity loss using its account-bound cache; a fresh page must verify the session, and expired/blocked sessions cannot act.

Visual plan: a moonlit dungeon threshold and brass-bound guild ledger, followed by a throne-room hall with four stone pedestals. Existing entrance/throne artwork and class portraits are reused; no external game's assets are copied. Quiet stone frames surround the one signature feature: portrait-bearing heraldic pedestals with the first place visibly taller. Thai Chakra Petch remains the reading face; Press Start 2P only labels short English inscriptions. Gold marks entry and honours, mint marks safe account and save state, red marks rejected submissions.

Runtime ownership model B is retained. `learners.css :root` owns `--guild-brass` → existing `--atlas-brass` (#d8b779), `--guild-paper` → `--atlas-paper` (#efe5ca), `--guild-ink` → `--atlas-dark` (#0c171f), plus guild stone #182b32 and edge #61716b. Login/register/recovery and honours consume those shared tokens. Desktop entrance uses art + natural-height form; below 760px the art compresses above the form. No fixed-height form or nested form scroll. Inputs stay >=16px and 48px high; password managers and paste work. Login, signup, and recovery use the same form owner in learners.js, with field errors, no duplicate submission, visible busy state and no anonymous-play dismissal.

`learners.js` continues to own ranking fetching, stale-response guards, page restoration, and native table semantics. The visual hall uses the existing throne scene, restrained gold/steel/bronze heraldry, four rank crests and real class portraits. Empty places are clearly unclaimed. Empty state points to login or the current adventure. Native details explains the criteria without crowding the hall. Table overflow belongs to the table only; the document stays within mobile width. Nonempty layout/pagination QA uses explicitly labelled local-only fixtures from tools/dev-server.mjs; those never enter production responses or the real ranking database.

`combat-soundbank.js RUN_FEEDBACK` owns separate recorded source sets: accepted uses charge then arcane release; rejected uses a reversed ward fizzle with a dry fracture. Source hashes never overlap between results and no layer is a voice. `combat-audio.js playRunFeedback` routes through the existing SFX bus, obeys master mute and remains audible with character voices disabled. Success starts only after Python, command-mode, cooldown and MP checks pass, during the stage scroll, before the action's own audio. Empty/invalid/rejected code gets only rejection feedback; locked controls make no sound. Utility confirmation uses accepted feedback. Scene/mute changes cancel scheduled audio. Existing attack/skill performances remain tied to their actions.

## Runegate identity and menu music v1.18

Explicit user request: replace the generic header logo and use sourced compositions for hero selection and the expedition map. The original identity is an emerald python coiled around a brass stepped doorway with code-rune brackets. `assets/brand/runegate-serpent.svg` is the single emblem for header, favicon, guild seal and journey panel; `assets/brand/python-dungeon-wordmark.svg` contains original pixel lettering for header and hero title. No external logo, font outlines or raster reference is embedded. `brand.css` owns logo geometry and derives its material colours from the existing slate/mint/brass palette. Native image dimensions reserve space and button/header names stay accessible.

The existing audio-engine.js owns all music, including the two new licensed recordings: symphony's Mystical RPG Maker Town Theme (CC0) for the entrance/hero selection, and HitCtrl's RPG Ambience - Exploration (CC-BY-3.0) for the atlas. Keep the original full-length loops (73.143s / 126s), use measured static gain and economical Ogg Vorbis encoding, and preserve the credits/source links in assets/audio/MENU-MUSIC-CREDITS.txt and the source/output hashes in menu-music-v18.json. Existing battle recordings remain the same.

Only one current HTML audio element owns music; changing scene pauses, clears and removes its predecessor before creating the next. Selecting another hero in the same intro scene preserves playback position. New menu music fades in over 450ms; master mute removes the element and sound FX/character voice ownership remains unchanged. All imports share audio-engine.js?v=5. The welcome's labelled music button and top-bar sound button call the same toggle owner; both show current state, and music still begins only after the player enables sound. The welcome control includes the actual title/composer. No audio is attached to a save or login identity.


## Live star hall v1.19

The user's current rule supersedes the v1.16/17 finish-only eligibility and completion-date tie-break. The hall now ranks ongoing learners by authenticated best-run stars, with visible x/12 progress and completion durations. Retain the four heraldic stone pedestals and the existing slate/mint/brass tokens; a steady mint LIVE seal and timestamp communicate five-second refresh without motion. Rows show readable Thai playing/finished labels and HH:MM:SS only for completed runs. Unknown historical times read ไม่มีข้อมูลเดิม. Tie ordering and timing are canonical in UX-CONTRACT.md. Preserve native table semantics, narrow horizontal scrolling, current focus/scroll across changed data, and last-successful rows during network failure. Never announce the entire table on every poll.
