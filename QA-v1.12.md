# v1.12 — Reset regression and balance playtest

Tested 2026-10-31 using localhost-only saves. The public player's save was not reset or used for combat testing.

## Findings fixed

1. **Reset stopped halfway.** Reproduced by confirming New Game on the map with a saved class/battle. `fresh()` removes the class, then `persist()` refreshed map vitals and read `undefined.atk`, leaving the confirmation and old map onscreen. Reset now leaves map state and clears the in-memory battle/editor before persisting. Map refresh also checks that a selected class exists. The button moved from a small footer link to the map heading with a 46px target, brass contrast, focus styling and explicit reset description.
2. **Emergency recovery could be a trap.** Real browser case: wizard 30 HP, heal 20, boss counter 36 left only 14 HP. With one guarded counter, the same seeded case leaves 35 HP. Recovery remains 20 HP / 3 MP, one turn and one item; guard reduces the counter by 60%, expires after that counter, and does not clear poison or skip time. Potion descriptions, feedback and rules explain it. A poisoned boss case can still have zero net healing; the status remains consequential.
3. **Stars mixed learning with class HP and random hits.** In the full wizard run, the first floor gave 2 stars despite zero corrections because HP was below 65%. Stars now use code corrections only: 0 → 3, 1–2 → 2, more → 1. Survival, mandatory lessons and enemy defeat remain required. Best existing stars are never reduced. Map wording now distinguishes 18 core questions from additional rune practice.

## Actual browser play

- **Wizard, fresh adventure through all six floors:** no injected resources or progress after starting. Answered all 18 core Python tasks plus repeat-rune exercises. Used both fire and frost, normal finishing attacks, poison/web/blind status inspection, cooldowns, MP drain, five ordinary between-floor stays plus additional mana recovery before the boss, and the merchant.
- The run earned its money normally, bought one +15 max-HP armor upgrade for 55 before resting, and one extra healing potion for 25. Inn costs/recovery were unchanged. Boss entry: 97 HP, 23 MP, 35 gold. Final: 14 HP, 6 MP, four accepted boss answers and one emergency potion turn. The campaign remained completable through preparation; class stats were therefore not increased based on a simplistic simulation.
- **Adventurer boss stress case:** separate prepared local save, 105 HP/10 MP, no upgrades, three potions available. Double strike, smoke blade, normal attacks and rune practice cleared in four accepted answers, 69 HP/1 MP remaining. Some enemy attacks missed; this single run is not a population win-rate estimate.
- **Knight boss stress case:** separate prepared local save, 145 HP/8 MP, no upgrades. Shield bash followed by normal attacks as mana ran low cleared in five accepted answers, 46 HP/1 MP remaining. Poison and longer combat remained relevant.
- Local turn evidence is kept outside deployed source in `qa-v112/browser-turns.json`; wizard completion screenshot is `qa-v112/wizard-clear.jpg`.

## Reset and responsive verification

- From the completed local wizard save (6 floors, 17 recorded stars, 130 gold), cancelling retained all values. Confirming reset returned to selection and then a map with 0 floors/0 stars/30 gold.
- Starting a different class after reset opens a fresh first floor, not the old pending battle. The same reset worked from an active battle's map.
- Phone iframe: 390px outer / 375px usable width, one reset button inside the map heading, 46px height and no horizontal overflow. Escape cancels, confirmation returns to hero selection.
- The original console TypeError was captured on v1.11. No additional error was reported during the corrected campaign, boss or reset flows.

## Balance model and limits

A separate simplified audit used shipped damage, RNG, status and economy functions for 250 seeded runs per class, assuming correct code and a limited purchasing policy. It exposed frequent item turns where the counter exceeded healing, and a disadvantage for an underprepared wizard. One-guard item variants removed that counter-only recovery loss. The model omits the actual Python worker/animation and does not optimize armor purchases, camp preparation or tactical choices; its completion percentages are not human success rates and were not used to force identical class performance. Actual browser play established that resource preparation, armor and frost were effective without increasing base stats or reducing monster damage.

Automated regression checks cover item Focus consumption, status expiry, the guarded boss counter, fixed potion quantities and correction-based stars, alongside all existing class, lesson-gate, combat, editor and map tests. Design audit evidence is retained separately. This is one full wizard playthrough and two prepared boss cases, not three full campaigns or exhaustive balance certification.

All five test suites, syntax and whitespace checks passed. DESIGN.md lint reported zero errors/warnings. The static UI scanner retains the same five known false positives for post-insertion event bindings documented in v1.11; it was not bypassed or modified. The new reset handler and confirmation/cancel paths were exercised in-browser, rather than inferred from that scanner.
