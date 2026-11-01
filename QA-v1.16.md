# v1.16 — learner accounts, ranking and Run voice

## Scope

Three original human Run calls, email/password login with Neon Auth, account-isolated local/cloud saves in Neon Postgres, nickname management, dashboard and public completion ranking. Current integration is Free plan, Singapore. Google OAuth is not enabled or represented as working.

## Verification

- `npm test`: 13 tests/suites pass, including all existing battle/editor/campaign checks and 2,407 real Python validation cases; four additional queue/policy tests cover lost acknowledgements, in-flight edits/events, conflicts, account boundaries and historical victory/reset handling.
- `npm run build`: pass. Explicit static allowlist excludes server code, .env files, migration/QA tools and test fixtures. API functions are packaged separately by Vercel.
- Real cloud API run (`tools/qa-cloud.mjs`): nine groups pass: anonymous requests rejected; idempotent retries/revision conflicts; two-user isolation/forged owner rejection; imported stars do not enter ranking; fewer than three accepted answers rejected; twelve distinct clears enter once; public identity/email omission; reset retains best; logout/login restores session/save; four-place star ordering and page clamping. Reserved-domain test credentials/cookies remained in memory; temporary IDs and report are outside the published app.
- Real browser: signup; empty-form error; password masking; wrong-password error; logout returns guest; login restores the same account; room 1 resumes at question 2, TURN 2, 93 HP/10 MP and 37 enemy HP, without healing or changing the question. A valid Run displayed its spoken-call caption while Python checked the answer, then combat completed normally.
- Completed room 1 through three actual browser-entered answers: 3 stars, 75 HP, 65 coins. Dashboard counted one logged-in floor and the database confirmed one clear with three stars. Stopping the local API produced the real inline connection error; restarting and refreshing recovered the ranking. Additional API edge checks passed exact-origin rejection, queued historical victory after reset, late nickname eligibility and rename without duplicate entries.
- Playback lab with real Web Audio: adventurer/knight/wizard each incremented voices once, no decode failures; waits approximately 538/1,140/638 ms. Master mute and character-voice mute each prevented the call.
- Dashboard: four explicitly marked QA finishers showed ranks 1–4 in correct star order; personal stats belong to the signed-in user. At 390px iframe size the document/client width was 375px with no page overflow; table content (620px) scrolls inside its 307px wrapper. Mobile login/account dialogs and keyboard entry work. Screenshot evidence remains in `../asset-sources/`.

## Implementation and limits

Managed auth owns password hashing and Secure/HttpOnly session cookies. Same-origin proxy uses the supported Neon server toolkit. Private save APIs verify the session, exact write origin and expected account before selecting a user row. Writes lock a row and use compare-and-swap revisions plus persistent mutation IDs. User ID is never accepted as authorization from the request body.

Rank eligibility comes from twelve distinct logged-in floor-clear events, at least three accepted answers and zero enemy HP. Stars are derived from mistakes on the server; best grades and first completion time persist independently of current-run reset. The client still owns Python execution/combat; this is classroom progress tracking rather than competitive anti-cheat with server replay. Password recovery request/error UI is implemented; reserved-domain QA cannot prove delivery to a real inbox. An owner-controlled inbox/sender and app-specific Google OAuth credentials are separate provider setup for broader rollout.

The auth SDK is pinned. Compatible security overrides move Better Auth/core/OAuth to 1.7.14 and Zod to 4.6.6, resolving the initial high/critical dependency advisories; remaining audit items are low severity in unused UI/email-rendering dependencies. The static UI audit records any dynamically bound button false positives rather than adding artificial handlers. Every relevant account/ranking button is exercised in the browser; the existing map/menu binding pattern is retained.

Before public release remove all explicitly created QA ranking rows and test accounts, confirm real ranking is empty, then verify the live public URL and private API rejection. Never reset the public player's guest save during QA.
