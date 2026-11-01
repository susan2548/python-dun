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

## Production verification

- Atomically migrated all 27 schema statements on the linked Neon resource; existing learner records retained. Deployment 787cf5d is Ready on python-dungeon-live.vercel.app (Vercel deployment dpl_9Vtr6NKpD2KVyHDs1GF2imgJKJQJ).
- Updated tools/qa-cloud.mjs to avoid assumptions about an empty leaderboard, use only its own reserved fixtures, and remove all related rows/accounts in finally. Eleven authenticated API groups passed on both localhost and production: unfinished visibility, equal-star duration order, private load, account guard, revision conflict, invalid time, idempotent retry, retained best after reset, login/logout and static privacy.
- Actual production CUA browser observed equal 36-star finishers ordered 00:01:40 before 00:03:20 despite the slower account finishing first. Ongoing fixture advanced from 3 stars / 1 floor to 6 stars / 2 floors through automatic polling, with no refresh click/reload.
- Separate real UI account: signup, hero start, map clock advanced to 83,089ms, ranking pause kept that exact persisted value across a later database read. Played floor 1 through three real Python answers and victory: 3 stars, one positive elapsed-time receipt, 254,233ms active saved time. Another production browser saw its 3-star / 1-floor record automatically. No half-turn resets or HP/MP refill occurred.
- Real UI sign-out returned to mandatory gate. Removed only the three live synthetic fixtures and the separate UI fixture; final query found zero v19 QA identities. The successful standalone production API run also cleaned its own three accounts.
- Offline simulation recovered automatically on local server restart without losing page-2 rows.

The terminal HOLD experiment exited on stdin EOF; its three known fixtures were explicitly identified by the single reserved email nonce and removed after browser observation. The unsupported HOLD mode was removed from the committed QA tool. No student data was removed.

