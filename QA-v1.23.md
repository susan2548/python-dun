# v1.23 — code-token questions and classroom cleanup

User requested four selectable/draggable answers for the former code-fill questions, clarification of multiple rooms, and teacher controls to remove learners. Chosen behavior: 12 radio + 12 code-token questions per parallel 24-point form; reversible room deletion and roster removal that retain assessment records and game accounts.

Before editing, pushed source tag `backup-v1.22.2-before-classroom-update-20261102`.

## Compatibility and data

- New attempts store form version 2. Existing version 1 attempts keep their original free-text form, answers and grading. Reviews resolve stored versions; teacher report/CSV label versions.
- Additive migration adds class `archived_at`, enrollment `removed_at` and version-aware start/join functions. The previous six-argument start signature remains supported for deployment compatibility. No game table or existing assessment answer is rewritten.
- Owner-only archive/restore uses class revision CAS. Archive/restore both close rounds. Removed learners cannot rejoin via code, read attempts, start, save or submit until restored. Active reports, totals and CSV exclude removed learners; a separate roster/CSV retains them for review/restoration.
- SQL write procedures lock class, enrollment and attempt in consistent order to protect against stale open tabs during removal/archive.

## Verification

- All 36 unit/behavior tests pass, including the original 2,407 Python validation cases. Every new token blank has four unique candidates, exactly one key and matched six-unit coverage. Version 1 rendering/validation/grading remains supported. Public student payloads omit keys/explanations.
- Isolated database schema: 13 check groups pass, including migration applied twice, concurrent attempt resume, owner/CAS checks, immutable results, version 1/2 starts, removal/rejoin blocking, archive blocking and restoration preserving results. The generated test schema is cleaned up.
- Full local API against reserved QA identities: 14 groups pass, including a second room preserving the first, cross-owner denial, removed roster/summary/CSV, blocked rejoin, restored original 1/24 and 24/24 results, class revision conflict, archive access denial and closed rounds after restore. No real teacher room/student was changed in testing.
- Actual browser: dragged a code option into its blank, changed/cleared using native controls, Space activation, answer count, autosave ACK and reload persistence. At 390px the bank has two columns with no horizontal document overflow. Pointer drag works with a non-drag alternative; no correctness feedback appears before submission.
- Build passes; runtime includes the token component and excludes server banks, tests and secrets.
- Premium static audit is not clean: 15 `affordance.actionless-button` findings from dynamically connected handlers (the prior 14 plus token buttons), zero unresolved ownership findings. Actions in the changed flow are checked in the actual browser/API; no fake inline handlers were added to silence static matching.

Teacher deletion here is reversible archival, not permanent erasure. Restoring a room does not reopen examination windows automatically. Existing game saves and previously submitted scores remain unchanged.
