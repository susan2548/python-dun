# QA — v1.15 topic campaign, question bags and turn banners

## Scope

Twelve rooms replace six mixed-topic floors. There are 100 exercise templates, 8–12 per room, and six additional monster/scene identities. Existing class roles, three accepted answers plus enemy defeat, finite potion recovery and continuous HP/MP remain. Progress from the old campaign is mapped by topic; an unfinished original prompt remains playable. All fixture saves and destructive reset tests used the separate `127.0.0.1:8778` origin, never the online player's save.

## Automated checks

- `node --test *.test.mjs`: nine suites passed. Includes 12-room states, all class/power roles, status and cooldown behaviour, exact one-contact animation timing at 10/30/60/144 FPS, inventory pricing and save migration.
- Question-bank checks: 100 unique template IDs; each room contains only its specified topic groups; every template is drawn once per bag before reshuffle; final-to-first immediate repeats are prevented; mixed groups rotate; serialized active questions survive reload/action reads without consuming RNG or drawing again. Old floor/phase migration, malformed bag recovery and unchanged combat RNG are covered.
- Shared production worker prelude and Python validators: **2,407 cases passed** with CPython, including sampled parameters, attack, English/Thai skill names and post-three-answer seals. Bare hardcoded power, duplicate actions, dead loops, fake comment strings and representative structural bypasses are rejected. Infinite loops hit the execution-step bound.
- The actual Pyodide module worker in the browser: **201/201 passed** — all 100 templates with attack and Thai skill calls plus seals, and a bounded infinite-loop failure. No test solution is included in runtime task descriptors or prefilled in the editor.
- Recorded audio: 86 valid files with decoded headroom below 0.98. All 24 new monster source hashes differ from the old 62 and from one another. Normal and special moves have separate takes, effects and voice IDs. The new maximum measured decoded peak is 0.9058.
- Fifteen actor sheets have valid frame sizes. New monsters use 12 actual frames each; six different root travel paths and six different ranged variants are exercised.

## Browser playtest

- Played knight through the variable room: correct answers changed the prompt and cleared the editor; the enemy survived the third accepted answer at 5 HP; a fourth, different exercise with a new seal finished the room. Victory displayed 4 accepted answers and no Your turn/Enemy turn banner after the terminal hit.
- Entered the next print/comments room with **70 HP / 8 MP**, exactly the preceding room's remaining resources. No free heal or mana refill occurred.
- Enemy turn appeared before counter damage; Your turn appeared after it. Observed holds were approximately 882 ms and 765 ms. Inputs were locked while banners were visible. Normal attacks, guard, Focus, mana potion and the third-error counter were exercised.
- Guard, Focus and potion use left the active question ID unchanged. Focus restored exactly 1 MP. A mana potion restored up to 3 MP and consumed inventory/one turn. Correct answers advanced the question even though combat could still continue.
- Two wrong submissions kept HP and the question unchanged. The third showed Enemy turn while HP was still 70, then reduced HP to 58; the original wrong code and original question stayed available to correct.
- Reloaded during the post-counter Your turn: both before and after resume were **room 3, question f2-remainder, phase 1, turn 8, HP 67, MP 1, RNG 3069989445**. No duplicate counter, resource change or reroll occurred.
- Migrated an old knight battle from original floor 2/phase 1 into the strings/operators room: exact unfinished `hero = "Python"` prompt retained; HP 81, MP 4, gold 91, attack upgrade, potion inventory, poison duration, cooldown state and RNG preserved. The changed enemy HP was scaled proportionally to the new room's enemy.
- Cast the Thai-named shield skill against the new mimic in the actual game; MP 4 became 1, poison advanced once, the next question opened and the mimic's special sequence ran. Enemy HP remained at 1 until enough accepted answers, as intended.
- The real animation/audio modules were played for all **12 new normal/special moves**. Each observed frames 4/5/6/7 or 8/9/10/11, used atlas version 15 and applied its contact once. Twelve voice plays and 48 timed effect cues occurred, with zero audio failures or browser errors.
- Merchant: selected mana potion, NPC explained 3 MP recovery, price showed the gold coin and เหรียญ; purchase changed 91 to 73 coins and mana inventory 1 to 2. Current battle resources were unchanged. Existing world/NPC interactions remain.
- New-game confirmation returned to character choice, then a fresh map with 12 rooms, 0/36 stars and 30 coins. Locked room 12 could be inspected but its enter button was disabled.
- At 390px iframe width (375px document content), the map board was 341px wide inside its parent, all twelve room targets were 78×75px and room 3's right edge was inside the viewport. Document/body scroll width equalled 375px: no horizontal overflow. Desktop map and battle screenshots were inspected.

## Issues found and corrected

- A minimum-height plus 1:1 aspect ratio forced the mobile board to 420px wide. Explicit responsive width/height now keep the full right column visible.
- Newly named normal attack variants initially selected special pose slots. Classification now selects attack frames 4–7 for each normal variant and cast frames 8–11 for its special.
- Replay and migrated saves can have a different next destination: completed-room replays continue to the following unlocked room, while a migrated gap routes to the next missing topic. These destination cases and the final-room/no-next case have pure regression checks; the boss title only announces full campaign completion when all rooms are cleared.
- The sentinel's generated beam connected two sprite bodies. A focused ImageGen edit removed baked beam/trail effects; the runtime draws the beam at its timed release, and all twelve bodies now pack separately.
- Extra seal prints initially inflated structured print-count exercises. The validator now counts a separate seal print independently of the exercise's print statements.
- The third-error branch briefly left editor/Action controls enabled while the counter was busy. It now relocks the complete command surface before the enemy sequence.

## Design and delivery checks

`designmd lint DESIGN.md`: zero errors/warnings. Premium strict audit reports four existing static action-detection false positives: dynamically bound map-room buttons, home, sound and merchant items. Real map selection, home/start flow, sound and merchant selection/purchase were verified; no placeholder handlers were added to silence the scanner. Syntax and `git diff --check` pass. Attribution/source-processing notes are in ASSET-CREDITS.md and the public sound credits.

This is targeted flow, migration, exercise, media and responsive QA. It is not a claim that every possible twelve-room route or random combat outcome was manually played to completion.
