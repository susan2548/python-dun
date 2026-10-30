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

Inputs remain blank at new lessons. Toolbar inserts syntax and exact skill names, leaving the power expression empty. Guard is a mode choice with a separate one-turn confirmation, never fake Python. Busy state locks editing and helper buttons; validation errors keep code for correction. Thai is the UI language, Python API words remain English.

Map material tokens live in `expedition-map.css :root`: brass `--atlas-brass #d8b779`, parchment `--atlas-paper #efe5ca`, and dark slate `--atlas-dark #0c171f`. Existing mint remains the completed-route colour; gold marks the actual current/resumable room. A selected locked room uses a pale steel border, so selection never masquerades as an unlock. Stars use explicit filled/outlined SVGs with textual scores, not dark font glyphs.

Clicking a room only previews its scene, monster, HP/attack and Python topics. It does not start a battle or write a save. The mission entry button names the selected floor; the global continue button always resumes the unfinished battle or frontier. Other rooms cannot start while a battle is unfinished. Shop/inn/class actions reuse existing NPC and confirmation owners. HP/MP remains visible near entry and in camp; viewing the map never heals. The learning sequence stays linear despite the illustrated dungeon corridors.

Atlases contain authored joint/weapon poses at one shared scale with reviewed stance roots. Idle breath keeps the lower body planted. Attack sequence: windup → dash → contact hold → recoil → return. Spell sequence: charge pose → release pose → projectile → impact. Potion sequence: lift → sip/apply → lower. Reduced motion removes travel and idle animation while preserving timing semantics and one impact.

## Do's and Don'ts

- Keep names on skill buttons identical to accepted Thai command strings.
- Show the combat scene before an action starts; retain all lesson validation.
- Do not restore HP/MP on scene changes or allow animation timing to duplicate damage.
- Do not fill completed exercise answers through helper buttons.
- Status details show the actor, buff/debuff type, actual DOT damage, remaining owner turns and expiry rule. Re-rendering badges closes old details so expired effects cannot remain visible.
