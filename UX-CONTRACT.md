# UI ownership and learner data contract

Source: user's requested class-specific Run calls, separate learner authentication and a ranking for players who finish the game. Campaign and learning invariants are owned by `campaign.js`, `lesson-progress.js`, `question-bank.js` and `hero-classes.js`.

| Capability | Canonical owner | Observable behavior / verification |
| --- | --- | --- |
| Form | learners.js account forms | Thai labels, novalidate, field-associated inline errors, masked passwords/show button, no duplicate submit; real managed auth |
| Modal | game.js showModal/closeModal | Named dialog, inert background, native input/button focus cycle, Escape and focus restoration; shared by NPC and learner flows |
| Toast | game.js toast | Shared live status; critical auth/sync errors also remain inline |
| Scrollbar | editor.css global rules | Visible, operable global baseline; ranking table owns horizontal overflow |
| Cloud saves | cloud-save.js + api/player.js | Account-bound local storage, verified server session, expected-account guard, revisions and idempotent mutation IDs; conflict pauses writes for explicit choice |
| Ranking list | learners.js + api/ranking.js | Native table, server-fixed stars-desc/date-asc sort, 20/page with boundary clamping, top four, actual loading/empty/error/success states |

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | learners.js | This contract's account and public-name rules | login / signup / recovery / nickname | real browser auth, field errors and cloud QA |
| Scrollbar | editor.css | DESIGN.md runtime CSS ownership | default / ranking table overflow | computed widths and 390px browser view |
| Toast | game.js toast | shared modal/feedback contract above | success / error / information | browser account and game flows |
| CRUD | api/player.js + cloud-save.js | server/schema.sql and account data rules below | create profile / load / save / current-run reset | tools/qa-cloud.mjs and cloud-save.test.mjs |

`premium-ui.json` audits `public/`, the exact generated production runtime copies. Build before auditing. Development-only sprite labs, source docs, server helpers and duplicate root copies are outside that published UI surface. Dynamically bound buttons remain subject to real browser verification even when the static scanner cannot detect their handlers.

Only game nicknames (2–24 characters), class, best star sum and completion date appear publicly. Do not publish email, auth user ID, passwords or session tokens. Session cookies are managed by the Neon server toolkit using HttpOnly/Secure cookies, same-origin proxy and exact-origin checks on writes. Database credentials and signing secrets are server-only. Build publishes an explicit static runtime directory, excluding .env and server source.

Guest practice retains the original browser save. A new account may explicitly copy that save or start fresh; existing cloud saves load under their own user ID. Logout restores guest practice. Server-side personal save queries derive identity from the authenticated session; a client account ID is only a mismatch guard, never an authorization source. Offline edits remain account-bound locally. Concurrent cloud revisions require choosing cloud/local, with a local backup before replacement.

Ranking eligibility counts twelve distinct floor-clear events received while logged in, each with at least three accepted answers and zero enemy HP; stars are recalculated from mistakes on the server. Imported guest stars alone never create a ranking entry. Replay can improve a floor's best stars; reset does not erase historical best ranking. Ties retain the first recorded full completion time, then stable server identity order. Ranking is for learning, not typing speed. The game's Python execution and combat remain client-side; event shape/identity checks are not a competitive anti-cheat verifier.

Account creation/login/logout, cloud load/update, nickname update and real ranking states require browser and API tests. Save queue retry/lost-ack/conflict tests live in `cloud-save.test.mjs`; the existing gameplay suites remain required.
