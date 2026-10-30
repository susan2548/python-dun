# v1.11 — Battle reading and command workspace

Checked locally in-browser on 2026-10-31 at desktop width 1280px and a 390px phone iframe (375px usable width). Fixtures are outside the published project and do not seed the online player's save.

## Layout and ownership

- Left: existing large gold objective, question progress, lesson hint, and enemy intent/pressure.
- Right: Action choices, skill palette, one existing native Python textarea and toolbar, run/feedback, supplies and tools.
- Below both: native `details` history, initially collapsed, keyboard/click accessible. Its open preference survives turn re-renders within the visit.
- Natural document scrolling is retained. Below 981px the briefing precedes the command desk, then history. No duplicate editor, duplicate action menu or fixed-height page was introduced.
- The redundant generic skill-description box was removed; the existing skill palette owns the detailed MP/cooldown/effect information.

## Browser checks

- Desktop: objective panel x=38..565, Action/editor at x=604..1205; history spans both columns. Page width equals viewport width (1265px usable), no horizontal overflow.
- The scene's code link reaches the right desk. Objective write button focuses `#code` without inserting text.
- Enter on history summary opens it and exposes existing log entries. Click closes it. History remains open after a successful skill turn and a potion turn, with the latest turn/log data.
- Invalid `skill("คำสัตย์เหล็กกล้า", 2)` for question 2 preserves input, shows the missing-comment/print error, marks the input invalid and leaves HP/MP unchanged during the free retry.
- Correct comment + `print("พร้อม")` + selected skill produces 24 damage, MP 5 → 1, next question 3/3 and blank editor. Cooldown locks the unavailable skill, while switching to normal attack remains enabled. Hero and enemy status display survives re-render.
- Moved heal button consumes one potion, runs its existing animation/counter and updates HP to 81/145; question stays 3/3. The layout did not alter item effects or turn costs.
- On mobile, one editor/action menu is present; all panels remain within 375px usable width. Toolbar, skill palette and controls wrap without horizontal overflow.
- Mobile correct submission advances to question 3/3 and clears code. Focus remains off the textarea after the new objective appears, avoiding an automatic keyboard reopening. The write button still explicitly focuses the editor.
- Long floor-6 class/object/rune objective and long Thai skill names wrap at phone width without page overflow.
- Browser console reported no errors in these flows.

Validation: JS syntax, `class-balance.test.mjs`, `tactical-engine.test.mjs`, `combat-rules.test.mjs`, `code-editor.test.mjs`, `map-state.test.mjs`, and `git diff --check` passed. DESIGN.md lint has zero errors/warnings. The strict static UI scanner retains the same five false positives for programmatically bound template buttons documented in v1.10; JSON remains in `asset-sources/premium-audit-v111.json` outside deployed source. No scanner bypass or fake handlers were added.

This release rearranges the UI and adjusts scrolling/focus after answers; balance, save format and lesson validation are unchanged. Verification is scoped to the changed interaction flow, not a replay of the campaign.
