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

Existing welcome/map/battle layouts remain. Code input is a separate DOM surface beneath the playfield. Native textarea owns scrolling; line numbers and syntax paint follow it. Editor grows from 252px to 420px then scrolls internally. Toolbar wraps on phones. No horizontal page overflow.

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

Inputs remain blank at new lessons. Toolbar inserts syntax and exact skill names, leaving the power expression empty. Guard is a mode choice with a separate one-turn confirmation, never fake Python. Busy state locks editing and helper buttons; validation errors keep code for correction. Thai is the UI language, Python API words remain English.

Atlases contain authored joint/weapon poses at one shared scale with reviewed stance roots. Idle breath keeps the lower body planted. Attack sequence: windup → dash → contact hold → recoil → return. Spell sequence: charge pose → release pose → projectile → impact. Potion sequence: lift → sip/apply → lower. Reduced motion removes travel and idle animation while preserving timing semantics and one impact.

## Do's and Don'ts

- Keep names on skill buttons identical to accepted Thai command strings.
- Show the combat scene before an action starts; retain all lesson validation.
- Do not restore HP/MP on scene changes or allow animation timing to duplicate damage.
- Do not fill completed exercise answers through helper buttons.
