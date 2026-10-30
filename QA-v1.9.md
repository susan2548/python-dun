# v1.9 — Lesson and status readability

Verified locally in the browser on 2026-10-31, desktop and a 390px iframe (375px usable width with a scrollbar). Local fixtures live outside the published project; the online player's save was not seeded or reset.

- Floor 2 now separates the variables/numbers/strings topic from the floor number. Lesson type is 22px on desktop and 19px on phones.
- The objective is a gold card before the action menu, with a 21px desktop / 19px phone prompt and a button that scrolls/focuses the native editor without inserting text.
- Floor 6 class/object/try-except topic and a long repeat-rune objective wrap without horizontal overflow. Editor remains blank.
- Real Python submission (`hero = "Python"`, `print(hero)`, `attack(2)`) passed floor 2 task 2, moved to task 3, cleared the editor, reduced poison/burn durations from 2 to 1 and consumed Focus. No stale status panel remained.
- Both hero poison and monster burn display their saved 4/5 HP damage, owner, debuff classification and remaining owner turns. Monster guard displays its separate 45% next-hit rule.
- Keyboard focus opens a tooltip; Enter pins a nonmodal details panel. Close button and Escape dismiss it. Clicking elsewhere dismisses it. The same panel opens by tap on mobile.
- Reading/closing statuses leaves hero HP 65/82, MP 5/12, monster HP 72/90 and turn 5 unchanged.
- Nine simultaneous hero effects fit a scrollable badge list. Music label no longer intercepts status clicks or paints over the badges.
- On phones the monster details panel bounds were x=43..363 inside a 375px usable viewport. Body-level placement is not clipped by the battle scene.
- Browser console reported no errors during the tested flow.

Validation: `node --check game.js`, `node --check status-inspector.js`, `node code-editor.test.mjs`, `node tactical-engine.test.mjs`, `node combat-rules.test.mjs`, `node map-state.test.mjs` passed. Balance, animation timing, save format and lesson validation are unchanged. This is a focused UI and one-turn regression check, not a replay of the full campaign.

Design context lint: 0 errors / 0 warnings. The strict static UI scanner retains the same five actionless-button false positives from v1.8 (map template, command-menu template, home/audio controls and world template); these controls bind handlers after template insertion. Command switching, navigation and the new editor/status actions were exercised in-browser. The scanner JSON is retained outside the deployed source in `asset-sources/premium-audit-v19.json`; the scanner was not changed or bypassed.
