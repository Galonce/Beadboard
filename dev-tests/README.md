# Beadboard dev tests

Playwright suites that drive the app the way a person would. Not part of the deployed app.

After a workspace reset:
1. `bash setup-fixtures.sh` regenerates the sprites and test images (including a stand-in photo and a see-through sprite).
2. Copy the `.mjs` files to `/home/claude/` and run `bash run-all.sh` (each suite takes up to a couple of minutes).

`tdrawall.mjs` covers drawing, selection, board gap, drafts, color families and size presets.
`tref2.mjs` covers the reference image. `tswatch.mjs` covers the swatch board PDF, `talpha.mjs` see-through pixels. The rest cover conversion, the library, the board,
calibration, import/export, sprite sheets and touch gestures.

The suites use Chromium from `$CHROME`, falling back to `/usr/bin/google-chrome`; `run-all.sh` finds one automatically.
If Playwright is missing, install it with `npm i -g playwright@1`.
