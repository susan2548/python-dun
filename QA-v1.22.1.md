# v1.22.1 — readable academy button labels

Reproduced on production: the entry link contained its correct Thai label, but `.assessment-page a` overrode `.btn` text colour. Both foreground and background computed to `rgb(155,232,194)` (1:1 contrast).

Scoped the academy's ordinary-link rule to anchors without `.btn`, preserving the canonical colours in styles.css for every button link. No labels, auth handlers, accounts, scores or save behavior changed. Updated the academy CSS cache version and release footer/package version.

Verification:

- Actual local academy entry now computes dark text `rgb(18,37,42)` against mint, and its link opens `/game?return=/assessment#login` with the existing login form.
- Browser visual comparison using the published styles and actual button classes: mint anchor/native button contrast 11.12:1; gold 10.15:1; ghost 9.56:1. Normal text links retain mint. Disabled button label remains visible.
- Temporary local visual specimen is excluded from Git and removed before publication. Production proof screenshot is saved outside source after deployment.
- `npm test`: all 30 tests pass, including the original 2,407 Python validation cases. `npm run build` passes.
- Design-token lint and premium audit are rerun; the existing 14 dynamic-handler static findings are unchanged, with no unresolved UI ownership.
