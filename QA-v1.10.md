# v1.10 — Class roles and real lesson completion

Checked 2026-10-31. This release changes player balance and fixes a lesson-gate bypass. It does not reset saves, rebalance monsters or change potion/rest recovery.

## Balance decisions

| Class | HP | MP | Base ATK | Damage growth per floor |
| --- | ---: | ---: | ---: | ---: |
| Adventurer | 105 | 10 | 15 | 7 |
| Knight | 145 | 8 | 9 | 5 |
| Wizard | 82 | 24 | 6 | 5 |

Knight retains 15% incoming damage reduction. Wizard fireball/frost bonus is now 24/20 (previously 16/11); costs remain 3/4 MP with the existing cooldowns and status chances. At equal floor, power and equipment, the adventurer has the strongest normal attack; wizard fireball exceeds it at a mana cost. Roster and live formula share `hero-classes.js`; the legacy skill-preview path now reads the same skill bonuses as live actions.

Old saves preserve the remaining MP fraction as capacity changes, rounded down. HP, progress, gold, upgrades, statuses, enemy HP and cooldowns survive. Active battle vitals remain authoritative. Repeated loading does not replenish resources again.

## Lesson gate

The old `phase >= 2` check treated the currently open third question as though it had passed. DOT on a guard/Focus/potion/error counter could therefore kill before the third accepted answer. `answeredQuestions` now advances only after validation and surviving the hero's start-of-turn effects, immediately before the committed action. All damage floors and victory paths share `lesson-progress.js`. Before three accepted answers, enemy HP stays at least 1. Completing three questions never forces a kill. Result screens use the actual accepted-answer count, including utility-turn victories.

## Browser checks

Local fixtures outside the project were used without modifying the online player's progress.

- Roster shows all three updated HP/MP/ATK values. New wizard fight starts at 24/24 MP.
- Real `skill("ลูกไฟเวท", 1)` submission: 36 direct damage, burn applied, 5 DOT damage, wizard MP 24 → 21 and next question opened.
- Legacy partial wizard save: HP 41/82 and MP 5/12 becomes HP 41/82, MP 10/24. Reload/start twice retains 10/24.
- Legacy third-question fixture with only two passed answers, enemy 1 HP and burn: choosing guard leaves the enemy at 1 HP, no victory dialog, question still 3/3. Hero takes the normal reduced counter; burn duration decreases.
- Answering that third question correctly then kills the enemy and yields a result of exactly three passed questions.
- Separate third-question fixture with enemy HP 90: correct answer deals 25, enemy remains 65, extra rune question opens and editor clears.
- Omitting the new rune is rejected without damage. Correct rune submission deals 21, enemy remains 44, a different rune and the next exercise appear, editor clears.
- 390px mobile iframe has 375px usable width and no horizontal overflow. Three stat captions fit within their 174px portrait cards.
- Browser console reports no errors in these flows.

## Automated checks

`class-balance.test.mjs` checks role damage at all six floors and powers 1–3, spell/normal distinction, mana capacity, knight defense, partial/empty/active save migration and repeat-load invariants, direct/DOT lesson locks, accepted third answer, unfinished enemies after three answers, and legacy phase migration. It passed alongside `combat-rules.test.mjs`, `tactical-engine.test.mjs`, `code-editor.test.mjs`, `map-state.test.mjs`, JS syntax checks and `git diff --check`.

Design lint: zero errors/warnings. The UI static scanner retains the same five false positives for dynamically bound template buttons documented in v1.9; no scanner changes or fake handlers were added. JSON evidence remains in `asset-sources/premium-audit-v110.json` outside deployed source.

This verifies formulas, saved resources and representative turns/edge cases; it is not a full six-floor difficulty study.
