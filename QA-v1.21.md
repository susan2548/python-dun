# v1.21 — shared sound settings

Scope: a header gear plus the same welcome entry open one sound dialog, replacing old header music and combat voice toggles. Native sliders/switches independently control master, music, effects and hero/enemy voices. Existing recordings are reused; no new third-party audio assets or backend changes.

Research: Xbox XAG 105 and Game Accessibility Guidelines separate-effects/speech/music controls, linked in DESIGN.md.

Verified before release:

- Full unit/gameplay suite passes; audio-specific tests additionally verify defaults/legacy voice mute, independent level persistence and cross-tab storage, invalid data, no music restart on gain changes, independent speech/effects buses, duck callback honoring zero music, recorded sample cancellation after close, and retry after rejected autoplay unlock. All 2,407 Python validation cases remain passing.
- npm run build includes the new preferences/panel/CSS/gear and aligned single audio runtime import versions. No server/schema changes.
- Actual browser at local game gate and ranking: master controls, native keyboard Home/Arrow/PageUp, 0-percent values, separate mutes and recorded preview buttons work. Effects muted still allows the speech preview; speech muted still allows the effects preview. Preview reported successful real decoded playback.
- Reload restored music 12%, voices off and effects on. Muting music retained its 70% value after reset and left both other previews enabled. Music currentTime advanced from 64.10 to 64.41 seconds through changes, one media element remained, and master off removed it without resetting category levels.
- Tab boundary wraps from master switch to Done and back. Done/Escape restore the settings trigger and remove the dialog. Closing cancels pending samples.
- Desktop modal measured 643px content and client height: complete panel fits. Narrow iframe inner document 375px / scrollWidth 375px, modal width 333px, four native ranges; no horizontal overflow and separate category preview layout.
- Token lint recorded separately. Premium strict scan has 9 action-handler findings, 0 unresolved ownership: 8 pre-existing dynamic/cross-file cases plus the new dynamically rendered data-preview button, whose for-of callback and both real recorded actions were verified in the browser. No inline handler was added merely to satisfy the scanner.

No learner accounts, progress or ranking records were edited for this verification. Local test audio ended with master disabled and standard level values restored. Production publication and static/source smoke follow the local checks.
