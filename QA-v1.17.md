# Python Dungeon v1.17 verification

Date: 2026-11-01 (Asia/Bangkok). Scope: mandatory learner entry, guild account forms, honours-hall presentation and speech-free Run results.

## Decisions

- Only a verified and loaded learner account can start/resume or issue commands. No anonymous practice entry. Public ranking stays readable and leads unauthenticated visitors to login.
- Original guest storage is preserved only for deliberate import into a new account. Existing account saves, injuries, MP, question deck, active battle and historical ranks are retained.
- Login/signup/recovery use a full-page brass-bound ledger beside the existing dungeon entrance. Four heraldic stone pedestals use the existing class portraits. No third-party game artwork was copied.
- Separate recorded sound sets report accepted/rejected Run results; successful charge/release begins after all command checks, before combat motion. Actual attack/skill performances remain action sounds.

## Executed checks

- `npm test`: 13/13 reported entries pass, including 2407/2407 Python validator cases; audio assertions require disjoint accepted/rejected source hashes, FX-only layers and no Run voice entries.
- `node --check game.js`, `learners.js`, `combat-audio.js`: pass.
- `npm run build`: pass; only runtime assets are published. QA fixtures stay in the development server and never enter the production ranking.
- `npx --yes -p @google/design.md designmd lint DESIGN.md`: 0 errors, 0 warnings.
- `git diff --check`: pass.
- Premium strict static audit executed: 8 actionless-button detections, all dynamic-handler false positives (map node, result buttons, cross-file header controls, two account-mode buttons and merchant item). These controls use actual JS handlers. Ownership unresolved: 0. This is not represented as a clean static audit.

## Real browser / real account service

A uniquely named disposable example.com QA learner was created through the actual signup form. No learner's own account or save was reset.

- Boot loading state exposes no playable controls; after anonymous resolution there is no start/Run button and no visible wallet.
- Empty login and password-confirmation mismatch produce Thai inline errors and focus the relevant field. Wrong password keeps the gate closed. Correct signup/login reaches hero selection; header and mode controls lock while submitting.
- A real first-room encounter was played: invalid Python retained the answer for correction; a correct answer changed enemy HP 62 to 37 and advanced to the next randomly selected question; code cleared after success. A correct attack submitted in skill mode was rejected without advancing a turn and the editor remained writable. Focus advanced exactly one utility turn.
- Logout returned to the full-page gate. Logging back in restored the active encounter, 90/105 HP, 10/10 MP and current question, without a heal. Logout in a second tab locked the first tab too; DOM probe confirmed gate=true and start/Run controls=0.
- Existing save retry recovered from a temporary upstream session timeout; unsaved state remained local, then reached saved status.
- Real Web Audio playback: accepted 2 FX / 0 voices / 806ms; rejected 2 FX / 0 voices / 959ms; both passed, no decode failures. Master mute suppressed effects. Disabling character voices retained Run FX.
- Empty real ranking shows four explicitly unclaimed seats. A separate localhost-only ranking fixture supplied 24 clearly QA-labelled rows for portrait, long-name and paging review; no fake finishers were inserted into the live database. Page 2 showed ranks 21–24 with disabled Next; page hash restored. A stopped local server produced an inline failure and refresh recovered after restart.
- Narrow iframe: actual document width 375 CSS px inside a 390px outer frame. Login had no horizontal overflow, inputs computed at 16px. Ranking document also stayed 375px; the 650px table scrolled in its own 319px container. Pedestals formed two columns, names wrapped and portraits stayed within their frames.
- Reduced-motion and forced-colors rules are supplied; OS-level preference switching was not performed.

The account API/database authorization and ranking algorithm are unchanged from v1.16. The classroom ranking still trusts client-side combat execution; this update does not claim competitive anti-cheat enforcement.

Visual research references: [Darkest Dungeon official](https://www.darkestdungeon.com/darkest-dungeon/) and [Slay the Spire official press kit](https://www.megacrit.com/press-kits/slay-the-spire/). The implemented layout/art remains Python Dungeon's own.
