# v1.14 recorded combat audio QA

The user rejected the v1.13 synthetic speech and requested deeper audio work using external sound packs. They clarified that both short effort vocalizations and spoken skill calls are welcome. This release changes combat sound selection, timing and mixing, with no balance or learning-rule changes.

## Sources and sound direction

- Human character performances from John Carroll's Warrior/Mage/Orc packs, specified CC0 on the creator pages. Fire/Blizzard/Protect and the rogue's short ambush phrase are original performed words; the user's illustrative catchphrase is not used. Light/heavy effort takes accompany some normal attacks. Six hero skills have different source files.
- Recorded blade attacks/clashes by StarNinjas, fantasy effects by ViRiX Dreamcore (CC-BY-3.0), and creature/material recordings by rubberduck, artisticdude, ArcadeParty and Kenney. Sources and modifications are public from the footer's credits link and per-file manifest.
- Separate windup, release, and impact cues. Two rogue slash sounds match the two release moments while preserving one aggregate impact. Different responses for flesh, guard/armor, skeleton, golem, and wraith. Misses play a passing sound without an impact cue. Variation rotates actual source takes, not just the pitch of one repeated file.
- Speech begins with the action after the cut-in. Short transition sound during the cut-in. One voice slot and at most eight concurrent effect sources. Voice toggle includes speech/effort/monster vocalizations while keeping weapon/spell effects. Music ducks temporarily; existing background tracks remain.

## Verified

- Prepared 62 MP3s, totaling 616,970 bytes. Trimmed measured digital lead/tail while retaining breath attacks, applied gain/high-pass/limiting without makeup gain, and short fades. Every rendered file was decoded again during preparation: non-silent and max decoded sample peak 0.9527, below clipping. Local speech recognition aided selection of short human phrases; it is not used by the game.
- Browser Web Audio audit decoded all 62 files and checked duration/nonzero/below-clipping peaks against the manifest. Zero fetch/decode errors. Source recordings and author pages were inspected; this is not a claim of an independent human listening panel. An 18-second preview using the same selected files, gains and animation cue times was produced for subjective listening feedback.
- Browser motion/audio lab: 30 action cases across all three heroes/six monsters, covering normal attacks, guard, Focus, six hero skills, monster specials and an explicit miss. Exactly one impact per action; temporary motion cleaned up. Observed 108 effect sources and 22 voice starts, zero late drops, zero recording failures; final active source count zero after muting. Different monster skill voice keys are additionally covered in bank tests.
- Control audit: speech-only off suppresses speech while spell effects still play; muting immediately after a pending voice prevents it from starting; changing scenes stops active audio; replacement/stop removes old captions and voices. Master sound is off on fresh page load. Cosmetic variation uses a separate random source and does not change saved combat RNG.
- Actual game booted from an isolated localhost fixture; valid Python fireball/frost answers advanced lesson 1 → 2 → 3, deducting 3 and 4 MP once. A Focus turn displayed the new Thai action caption with the human vocal. No warning/error logs observed. Public saves were not used for combat or reset tests.
- Footer attribution link and the renamed character-audio toggle are real controls. Verified the actual game at 390px iframe width: the toggle fits the two-column tool buttons, can be switched off/on without a turn, and the footer points to the published credit file. Existing battle layout, focus behavior and motion preferences are retained.

## Checks

`node --test combat-soundbank.test.mjs animation-profiles.test.mjs class-balance.test.mjs tactical-engine.test.mjs combat-rules.test.mjs code-editor.test.mjs map-state.test.mjs` — seven suites pass. Sound tests cover every clip/source/hash/license link, distinct six-skill voices, nine actor registries, five cue stages, material/miss differences, bounded layer gain, and no immediate repeated take. Syntax checks pass.

`designmd lint DESIGN.md` — zero errors/warnings. Premium strict UI audit retains the same five known static actionless-button false positives (runtime-bound map, command menu, header Home/audio, and world template controls). No new affordance findings and no fake handlers were added.

## Limits

Human listening preference is subjective; the user has an audio preview and the live game to assess the new delivery. This is an audio/presentation pass, not another full six-floor balance campaign or a comprehensive browser/device certification. New audio files are small and preloaded without blocking play; missing/slow optional audio is skipped rather than delaying a turn. No source WAVs, original archives, speech models, TTS or speech-recognition runtime ship with the game.
