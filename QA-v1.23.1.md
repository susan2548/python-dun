# v1.23.1 — Thai CSV downloads for Excel

The supplied downloaded CSV contains valid Thai UTF-8 bytes but lacks EF BB BF. The API emits that BOM correctly; `Response.text()` in the browser consumes it before creating the downloadable Blob. Excel then interprets the file as its legacy local encoding.

`assessment-client.js` now owns `downloadCsv`, preserving raw response bytes and ensuring exactly one UTF-8 BOM before invoking the existing download owner. The teacher exporter uses this path. No score, CSV field, roster filter, formula escaping or database data changes.

A regression test passes real Fetch responses with/without an initial BOM through the download helper and checks the captured Blob, filename, byte prefix, Thai text and original rows. A repaired copy of the user's already-downloaded file is produced outside the repository; its content bytes are identical apart from the required BOM.
