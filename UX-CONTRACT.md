# UI ownership and learner data contract

## Auth failure recovery v1.22.2

`auth-feedback.js` owns fixed public auth error messages; `learners.js` owns form busy state and the conditional canonical-domain recovery link. A 403 must not masquerade as invalid credentials. Keep recovery destinations fixed to the canonical domain and allowlist return paths; never reflect provider details or passwords. Resubmission hides stale recovery links. Assessment permission gates preserve a known signed-in identity and logout control; authorization remains enforced by the server. Verification is documented in QA-v1.22.2.md.

## Assessment workflow v1.22

Authoritative sources: explicit user approval for a same-site assessment workflow, the supplied six-unit teaching plan, and `server/assessment-schema.sql` / `api/assessment.js` server invariants. `ASSESSMENT.md` documents those rules and operations. Existing learner auth, save and game contracts below remain in force.

| Capability | Canonical owner | Observable behavior / verification |
| --- | --- | --- |
| Assessment routes and session | assessment.js + learners.js + api/assessment.js | Existing verified session; allowlisted login return; private 401/403 states; no new identity provider |
| Select/Listbox | Native select in assessment.js | Platform-owned popup deliberately retained for classroom and teacher-only question-form selection; Thai labels and native keyboard selection |
| Academy forms | assessment-client.js validateForm | Native labelled controls/selects, app-owned Thai field errors, novalidate, preserve values and focus first invalid field |
| Shared overlays and feedback | ui-dialog.js | Named modal, inert background, visible focus cycle, Escape/close/cleanup/focus restore, shared live toast |
| Answer draft | assessment-exam.js + CloudSaveQueue + assessment_save | Account/attempt-bound local cache, online ACK status, IME-safe input, immutable retry mutation, CAS, explicit conflict recovery with backup; no silent overwrite |
| Submission | api/assessment.js + assessment_submit | Flush drafts first; review blank answers; server-only grading, lock once submitted, duplicate ACK safe, closed round retains drafts but blocks submit |
| Class list/report | assessment.js + api/assessment.js report | Own-class authorization, 20 rows/page with clamping, name/code search and page in URL, no-results recovery, all-class UTF-8 CSV with formula protection |

The selected classroom controls pre/post availability. Post requires submitted pre; it does not require any game completion. Submitted pre and first post remain immutable; teacher can authorize one extra post attempt at a time. First post, best post and retake count are separate. First-post stars are a twelve-floor snapshot of authenticated game clears, not later current stars. Pre baseline, first-post /24, optional linear /20 and stars /36 remain separately labelled, with no invented pass mark or combined grade. Teacher-only key preview/review is private and never included in student questions or static assets.

Teachers are granted explicitly in assessment_teachers using an existing verified account; students cannot self-grant. Teachers see only classes they own, students only their enrollments/attempts. Public rankings never include student codes, real names from enrollment, test scores or emails. Assessment changes are additive and do not reset game saves. Submitted records are retained until an explicit future owner-requested cleanup; there is no product deletion action in this release. Acknowledged local cache is ignored after 72 hours; unacknowledged drafts remain recoverable and are never discarded by age. The main key is removed after confirmed submission; conflict backups stay device-local for recovery. Personal reporting and CSV require a verified teacher session on every request.

Source: user requests for separate learner authentication and live star ranking, including ongoing learners; completed ties use active time to finish (v1.19). Campaign and learning invariants are owned by `campaign.js`, `lesson-progress.js`, `question-bank.js` and `hero-classes.js`.

| Capability | Canonical owner | Observable behavior / verification |
| --- | --- | --- |
| Form | learners.js account forms | Thai labels, novalidate, field-associated inline errors, masked passwords/show button, no duplicate submit; real managed auth |
| Modal | ui-dialog.js showModal/closeModal | Named dialog, inert background, native input/button focus cycle, Escape and focus restoration; shared by NPC and learner flows |
| Toast | ui-dialog.js toast | Shared live status; critical auth/sync errors also remain inline |
| Scrollbar | editor.css global rules | Visible, operable global baseline; ranking table owns horizontal overflow |
| Cloud saves | cloud-save.js + api/player.js | Account-bound local storage, verified server session, expected-account guard, revisions and idempotent mutation IDs; conflict pauses writes for explicit choice |
| Ranking list | learners.js + api/ranking.js | Native table, server-fixed stars-desc/completion-duration-asc sort, 20/page with boundary clamping, top four, actual loading/empty/error/success states |

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | learners.js | This contract's account and public-name rules | login / signup / recovery / nickname | real browser auth, field errors and cloud QA |
| Select/Listbox | Native select in assessment.js | Academy classroom/form selection | native, platform-owned popup | real browser selection, keyboard and narrow viewport |
| Scrollbar | editor.css | DESIGN.md runtime CSS ownership | default / ranking table overflow | computed widths and 390px browser view |
| Toast | ui-dialog.js toast | shared modal/feedback contract above | success / error / information | browser account and game flows |
| CRUD | api/player.js + cloud-save.js | server/schema.sql and account data rules below | create profile / load / save / current-run reset | tools/qa-cloud.mjs and cloud-save.test.mjs |

`premium-ui.json` audits `public/`, the exact generated production runtime copies. Build before auditing. Development-only sprite labs, source docs, server helpers and duplicate root copies are outside that published UI surface. Dynamically bound buttons remain subject to real browser verification even when the static scanner cannot detect their handlers.

Only game nicknames (2–24 characters), class, best run star sum, cleared-floor count, completion date and completion duration appear publicly. Do not publish email, auth user ID, passwords or session tokens. Session cookies are managed by the Neon server toolkit using HttpOnly/Secure cookies, same-origin proxy and exact-origin checks on writes. Database credentials and signing secrets are server-only. Build publishes an explicit static runtime directory, excluding .env and server source.

Legacy guest progress retains the original browser save, but anonymous play is no longer offered. A new account may explicitly copy that save or start fresh; existing cloud saves load under their own user ID. Logout returns to the mandatory login gate. Server-side personal save queries derive identity from the authenticated session; a client account ID is only a mismatch guard, never an authorization source. Offline edits remain account-bound locally. Concurrent cloud revisions require choosing cloud/local, with a local backup before replacement.

Ranking begins after an authenticated, named learner starts a hero. Stars come from distinct authenticated floor-clear receipts, each with at least three accepted answers and zero enemy HP; server recalculates grades from mistakes. Imported guest stars do not rank. Keep per-run clears and the player's best run: reset never mixes an old receipt into the new run or erases an earlier ranking. Order stars descending, completed first on equal stars, completed duration ascending (NULL last), floor count descending, completion date/stable identity as a final deterministic tie. Completion duration is seconds of visible authenticated map/battle time through the clear that establishes that score, including reading/writing/preparation, excluding hidden pages and ranking/login/intro. No answer deadline. A new full run can improve an equal-star completion time; one replayed floor cannot replace a full-run time. Legacy records remain untimed, never fabricated as zero. The client clock and combat are not a competitive anti-cheat verifier.

Account creation/login/logout, cloud load/update, nickname update and real ranking states require browser and API tests. Save queue retry/lost-ack/conflict tests live in `cloud-save.test.mjs`; the existing gameplay suites remain required.


## v1.17 entry and feedback contract

Explicit current-task rule: only authenticated learners may begin or resume play. learners.js owns the full-page login/signup/recovery gate, while game.js checks learner.requireLogin at intro/map/battle/Run boundaries. Boot shows an account-check state, never a playable guest flash. Logout, invalid session and account mismatch cannot enable a Run or start button. Existing cookie-derived authorization continues on every personal API route. Anonymous ranking is read-only and offers login. Legacy guest saves are retained for explicit import without anonymous play.

The shared full-page account form replaces the dismissible login modal. Native labels, 16px inputs, field errors, masked/show password, email preservation, busy/duplicate prevention, recovery and responsive document scrolling remain required. Account-management/NPC dialogs continue to reuse ui-dialog.js showModal. New-account import remains a deliberate choice, and account changes never merge saves automatically.

Run feedback is result-driven, not click-driven: success requires Python/action/cooldown/MP acceptance and precedes animation; empty, invalid, wrong mode or insufficient MP uses a separate non-voice recording set. Rejected commands unlock the editor and do not advance a lesson. Utility Run consumes its existing single turn. Master mute covers both effects; the character-voice toggle does not mute SFX. Tests: combat-soundbank.test.mjs, tools/qa-run-voices.html and browser combat QA.


## v1.18 identity and scene music

Brand geometry is owned by assets/brand and brand.css, reused across the header, welcome, guild and favicon. Existing home navigation and mandatory login remain canonical. The welcome music button and header toggle share game.js toggleAudio; same-scene hero changes must not restart a song, scene changes must leave one player, mute must retire it, and stale previous-media callbacks cannot revive a track. audio-engine.js remains the sole music owner. Verification: music-engine.test.mjs and tools/qa-menu-music.html, plus actual welcome/map transitions and a narrow logo layout check. Composer/license/source notices are available through the footer's เครดิตดนตรี link.


## Live ranking v1.19

`ranking-live.js` owns single-flight five-second polling. learners.js owns visible page lifecycle, last-updated/offline labels and stable row rendering; retain last successful data on failure, no loading flash per poll, ignore late responses after departure, suspend hidden polling and refresh on return. Native pagination remains 20/page and clamped. `play-clock.js` owns active time and legacy normalization; game.js samples time on visibility/transitions and persists every 15 seconds only at complete turns. Cloud queue keeps immutable receipt run/time through retries and resets. `server/ranking-migration.sql` adds RLS-protected run/clear tables and ranking fields; migrate atomically with tools/migrate-cloud.mjs. QA: ranking.test.mjs, isolated-schema tools/verify-ranking-db.mjs, browser/API checks in QA-v1.19.md.


## Combat inventory disclosure v1.20

Canonical owner: combat-inventory.js renders stock/availability, game.js renderCommandMenu owns disclosure/events, battle-workspace.css owns layout, and existing usePotion / prepareItemTurn own consumption, status ticks, cooldown and enemy response. Four action commands retain their widths. A fifth action tab is not introduced. Satchel has aria-expanded/aria-controls; its region is hidden when closed. Opening/closing never advances a turn, changes task or writes editor contents. Escape closes and restores trigger focus; selecting an action closes the tray. Executing any action locks the trigger and closes the tray; item activation is immediate and calls usePotion once, not the Python Run handler. Show full-resource and zero-stock disabled reasons. Existing lower utility row contains hint/reset/help/voice only. Verify real potion counters, unchanged task/code, busy locking and mobile document widths.


## Audio settings v1.21

Canonical owners: audio-preferences.js owns normalized device-local settings and storage notification; audio-engine.js owns master, music (recorded + synthesized fallback), effects and speech gain buses; combat-audio.js routes recorded speech independently from effects and cancels stale muted cues. audio-settings.js owns the shared native slider/switch panel, using ui-dialog.js showModal/closeModal cleanup and focus behavior. Only one audio-engine query version may be imported throughout runtime. The header gear and welcome button call the same entry; no separate battle voice switch remains. Busy battle turns delay opening settings rather than interrupting a cutscene. Closing settings preserves all game state and typed code.

Settings are immediate and saved on the device, not on a learner account. Opening the panel does not turn on a new visitor's audio. A remembered enable preference activates only after interaction. Muting preserves the corresponding percentage. Master zero/mute silences every route; music and speech duck callbacks always use the latest levels, and adjusting a level does not restart a song. Effect mute cannot mute speech; speech mute cannot mute Run/weapon effects. Delayed previews/cues cannot revive after close, channel mute or scene departure. Restore-levels resets defaults while retaining the current master enable switch. Verify persistence, separate-channel playback, live gain updates, cancellation, keyboard operation, focus and mobile widths; music-engine.test.mjs and audio-preferences.test.mjs cover audio invariants.
