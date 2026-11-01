# Learner accounts and ranking

The game remains plain HTML/CSS/JavaScript and Pyodide. Vercel Node Functions in `api/` add server-side authentication, private saves and public ranking. Neon Auth and Postgres are provisioned through the Vercel integration `python-dungeon-learners`, Free plan, Singapore. Provider credentials and the cookie-signing secret belong only in Vercel environment variables; never put them in browser code, screenshots or Git.

## Local development

1. `npm ci` (the repository pins SDK/driver versions and compatible security overrides; `.npmrc` excludes unused React/Next peer installation).
2. Link the existing Vercel project and `vercel env pull .env.local` using its existing team scope.
3. Required names: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`. The auth URL must be fully provisioned HTTPS, not the temporary `provisioning` value.
4. `node --env-file=.env.local tools/migrate-cloud.mjs` applies additive tables, RLS and the save transaction function. The real auth schema is managed by Neon; do not recreate it.
5. `npm run build`, then `npm run dev`; local game/API are at `http://localhost:8781`.

The build copies an explicit runtime allowlist into ignored `public/` and bundles only the browser auth client. `server/`, `api/`, `.env*`, QA fixtures and setup tools are not static files. Vercel separately packages the API functions. Do not replace this with a whole-repository static upload. Before a release run migrations against the intended database, build, test, push main and inspect the Vercel deployment. A preview branch may get its own Neon database and require its own migration.

## Data behavior

- Guests keep the old local save. Signed-in saves are cached under a user-scoped key and written only to the server-session owner's row.
- A pending local mutation retains its ID on retry. Revision conflicts pause writes rather than silently replacing another device's save. A choice backs up the local version first.
- Floor-clear events are queued with the save and saved atomically with progress. They are historical: a quick New Game does not erase an unsent victory. The server recomputes stars from mistakes and requires at least three answers/zero enemy HP.
- Twelve distinct logged-in floor clears enter the hall. Imported guest stars alone do not. Repeat clears can improve stars, never duplicate a person. New Game resets the current run while retaining historical best results.
- Public ranking exposes nickname, class, stars, completion date and rank only. It never exposes auth IDs/email or individual saves. Tie ordering uses first full completion, then stable server ID internally.
- The Python checker and combat run in the browser. This is a classroom progress ranking, not server-replayed competitive anti-cheat. Do not describe receipt shape/identity checks as proof against a malicious modified client.

## Authentication operations

The current UI supports email/password signup, login, logout and email-code password recovery. Neon owns password hashing, sessions and email delivery. There is no password/secret in localStorage. The server toolkit owns cookie handling; write APIs enforce exact origin and the expected current account.

Google login is intentionally absent until the owner's app-specific Google OAuth credentials and provider callbacks are configured in Neon. Use the real production origin, the callback displayed by Neon, and test the complete provider round trip. Do not add a button that only simulates Google login or ship development shared OAuth credentials as the app's production identity. Production email recovery delivery should be checked with an owner-controlled inbox and configured sender before wider classroom rollout; the QA reserved-domain accounts cannot verify inbox receipt.

## Verification tools

`npm test` includes gameplay and queue/policy contracts. `tools/qa-cloud.mjs` exercises real signup/session/private data/revision/eligibility APIs using explicitly disposable QA accounts and creates four clearly named QA ranking fixtures. Use only during a controlled local QA run, then remove its exact recorded IDs before releasing. The fixtures list and screenshots live outside the shipped app. `tools/qa-run-voices.html` is served only by the local dev server and exercises actual playback plus both mute controls.
