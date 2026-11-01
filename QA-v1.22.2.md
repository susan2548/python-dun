# v1.22.2 — accurate auth failure recovery

Production investigation found repeated sign-in HTTP 403 responses on an older immutable deployment hostname. The old form classified every rejected response as invalid credentials. The user's existing credentials succeed on the canonical domain; verified in the user's native Chrome and opened the teacher landing page. No credential, permission, database schema, learner save or auth origin policy changes.

Changes:

- Public auth messages distinguish 401 credentials, 403 rejected page, 429 throttling, 5xx outages and network failures. Provider error details and submitted values are never included in these messages.
- A 403 recovery link uses the fixed canonical domain, with an allowlisted assessment/teacher return target. It is hidden again on resubmission. Email-verification errors retain their own recovery instruction.
- A teacher-page permission error preserves a known signed-in account header and logout control, allowing a learner to switch accounts normally.
- Runtime import/cache versions and release labels updated to 1.22.2.

Verification:

- Native Chrome: successful existing teacher-account sign-in, teacher landing page visible. Screenshot stored outside the repository, without credentials.
- Actual browser UI with a temporary localhost-only HTTP fixture (no external auth/DB calls): 403 shows the canonical recovery link retaining `/teacher`; a subsequent 401 shows only the generic credentials message and hides that link.
- Actual browser UI with a temporary non-teacher identity: teacher gate retains the account name and logout button. Permissions remain denied.
- `npm test`: 34 tests pass, including four new auth error regression tests and the existing 2,407 Python validation cases.
- `npm run build` passes. Runtime files are included; tests, server files and secrets are excluded from static output.

An immutable deployment already loaded in another tab does not receive new code automatically. Use the canonical production domain for future sessions.
