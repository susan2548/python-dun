# v1.19 — live star ranking

Requested behavior: ongoing learners appear; stars descending, equal-star completed learners ordered by active duration ascending. No fabricated historical duration.

## Verified before release

- `npm test`: 19 passing entries, including all 2,407 Python validation cases, unchanged combat/economy/learning gates, plus active time, malformed clocks, polling overlap, stale replies, pause/recovery.
- `npm run build`: runtime modules included, no server source or secrets in static output.
- `tools/verify-ranking-db.mjs`: 10 integration groups against real Neon in a uniquely named isolated schema, removed in finally. Covers legacy unknown duration, unfinished rows, star/time order, idempotence/conflict, queued clear after reset, retained best run, imported stars excluded, faster complete second run, monotonic elapsed time, rerunnable migration and nickname. No learner records changed.
- CUA local actual browser: four pedestals and ledger show completed, ongoing and legacy states; automatic timestamps advanced without clicking; page 2 boundary buttons correct.
- Local network interruption: latest four page-2 rows retained with visible offline/retry status.
- Mobile iframe: content viewport 375px, document scrollWidth 375px, table viewport 303px and scrollWidth 760px; no page overflow.
- Design token lint: zero errors / warnings. Premium static scan retains eight known dynamic-handler false positives (map, result controls, cross-file header actions, auth mode buttons and merchant items); scanner ownership unresolved count zero. Runtime handlers remain tested rather than changed to satisfy a static pattern.

## Rules and limits

Time includes visible authenticated map/battle reading, coding and preparation, pauses in hidden tabs and non-game screens; complete turns only are saved. Live refresh is five-second polling after acknowledged cloud saves, not a push socket. Best run remains through reset; per-run receipts prevent old/new run mixing. Imported guest grades do not create ranked stars. Old incomplete and complete records preserve grades with null duration. No client-combat/clock anti-cheat claim.

Production deployment and smoke evidence will be recorded after release.
