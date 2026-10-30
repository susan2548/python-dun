# v1.7 verification

Tested locally in the browser before release, 2026-10-31 (Asia/Bangkok).

## Automated checks

- `node --check` on changed JavaScript and the Python worker: passed.
- `node code-editor.test.mjs`: Thai syntax tokens, HTML escaping, multiline strings and all 12 skill aliases passed.
- `node tactical-engine.test.mjs`: status expiry, cooldowns, saved RNG, immunities, potion amounts, stock/pricing passed.
- `node combat-rules.test.mjs`: all six monster rule identities and damage modifiers passed.
- `git diff --check`: passed.
- `designmd lint DESIGN.md`: 0 errors, 0 warnings.

## Browser checks

The local animation lab was kept outside the deployed project. Every animation below completed with exactly **one** impact callback and **zero** leftover transient effects:

- Adventurer, knight, wizard: normal attack, both skills, health potion, mana potion — 15 runs.
- Zombie, skeleton, spider, wraith, golem, necromancer: normal attack and special move — 12 runs.
- Reduced-motion JavaScript path, simulated preference in the local harness: attack, skill, potion, enemy attack and enemy skill — 5 runs. This was a code-path test, not a claim of testing OS settings on a physical device.
- Retested golem's distinct slam pose and pixel fireball socket after timing/VFX adjustments.

Real Pyodide worker: every Thai skill name and its legacy English ID was accepted and normalized to the correct internal ID (12 cases). Unknown skill, wrong selected skill, invalid power and missing lesson output were rejected (4 cases). Total **16 passed / 0 failed**.

Actual game flow: started a wizard fixture with reduced resources; inserted the Thai fireball command using the toolbar, filled the required power manually, ran using Ctrl+Enter, watched/skipped the class cut-in, and advanced through all three first-floor lessons to victory. Mana potion restored 3 MP, health potion restored 20 HP, each followed by one enemy counterturn. Poison ticked correctly. Entering floor 2 retained **9/82 HP and 4/12 MP**; no automatic refill.

Editor: initially blank, selected Thai command inserted with caret in the empty power argument, native Undo removed the insertion, Enter after `:` inserted four-space indentation, syntax error kept code and unlocked controls, new lesson cleared old code, busy state blocked duplicate turns/editing. Goal and hint command names follow the selected skill.

Responsive: inspected the editor in a real **390×844 CSS-pixel iframe viewport**. Toolbar wrapped, code remained scrollable, and document width was 375px within the 390px viewport; no horizontal page overflow. Desktop screenshots inspected at 1280×720. This does not cover a physical phone's virtual keyboard.

## Static audit limitation

The premium UI static audit reports five `affordance.actionless-button` findings on existing templates/header buttons because its scanner only recognizes inline `onclick`/framework attributes. These controls are bound programmatically in `game.js` / `world-ui.js` (home, sound, map navigation, command palette, welcome controls). The exercised browser flows confirm their handlers. They were reviewed as scanner false positives; the static audit is not represented as a clean pass.

This release does not claim a new six-floor balance playthrough or testing on every browser/device. Prior game-rule tests are retained, and this request's motion, editor, aliases, first-floor completion and resource carryover were exercised.
