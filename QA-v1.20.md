# v1.20 — combat satchel disclosure

User feedback: move potions into the command area without narrowing the existing four action buttons. Added a separate header satchel button with stock badge and an inline tray. Existing potion icons, values and usePotion resolution remain canonical. No database/schema changes.

Verified so far:

- npm test: 19 passing entries including 2,407 Python cases and item-turn guarded counter/status/cooldown checks.
- npm run build: includes combat-inventory.js and original field-satchel.svg; server files remain excluded.
- Real account/browser: four action buttons remain four; bag opens without changing turn or typed code. Escape collapses and restores trigger focus. Selecting skill closes bag; opening bag hides skill details without changing selected skill or code.
- Full HP/MP show disabled cards with explicit full-resource reasons. Busy Python/animation locks trigger and collapses tray.
- Real first-floor play: wizard fireball spent 3 MP; healing card restored 12 missing HP, consumed one potion, triggered exactly one guarded enemy response, and preserved question 2/3 plus written code. Mana card restored exactly 3 MP, consumed one potion, triggered one enemy response and retained the same question. Subsequent full MP card disabled correctly.

- Used both potions to zero stock: trigger remained openable with 0 badge, both cards disabled with ไอเทมหมด, explicit empty-bag/shop direction shown; turn advanced once per dose and accepted-answer count stayed 2/3 through the item turns.
- Bought a health potion through the existing shop; restored battle tray reflected ×1 health / ×0 mana.
- Actual narrow game in a 390px iframe: inner document clientWidth=375 and scrollWidth=375, action columns 145.167px each (two-by-two), supply cards one 274px column, satchel 119.833px. Disabled card computed opacity=1 so its reason remains readable.
- Escape focus, skill/tray mutual disclosure, action selection and code retention verified through real UI; no editor prefilled answers introduced.
- Design token lint: 0 errors / warnings. Premium static scan: 8 known existing cross-file/dynamic-handler false positives, 0 unresolved owners, no new inventory warnings.

Production publication and final static smoke follow this local verification. No learner balance values or authentication/ranking schema changed.
