# Beadboard dev tests

Playwright suites that drive the app the way a person would. Not part of the deployed app.

After a workspace reset:
1. `bash setup-fixtures.sh` regenerates the sprites and test images.
2. Copy the `.mjs` files to `/home/claude/` and run `bash run-all.sh` (each suite takes up to a couple of minutes).

`tdrawall.mjs` covers drawing, selection, board gap, drafts, color families and size presets.
`tref2.mjs` covers the reference image. The rest cover conversion, the library, the board,
calibration, import/export, sprite sheets and touch gestures.
