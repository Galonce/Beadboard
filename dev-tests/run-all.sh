#!/bin/bash
# Runs every suite against /mnt/user-data/outputs/beadboard.html. Copy the .mjs files to /home/claude first.
cd /home/claude
# Chromium location differs between environments; set CHROME to override.
if [ -z "$CHROME" ]; then
  for c in /usr/bin/google-chrome $(ls -d /home/claude/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome 2>/dev/null); do
    [ -x "$c" ] && export CHROME="$c" && break
  done
fi
for t in regress tcal tchk tsave tbg tlib2 tpack tlayout2 tstuck timport topen tboard2 tdrag3 tlink tzoom tzoom2 tdrawall tref2 tshapes tshapes2 tcolors tsel2 tmask2 ttoolcol trefpick tloupe tswatch talpha; do
  out=$(timeout 150 node $t.mjs 2>&1 | grep -v 403)
  err=$(echo "$out" | grep -iE "errors: \[|Timeout|Error:|TOUCHING|PROBLEM|DIFFERENT|ENOENT|FAILED" | head -1)
  echo "$t: ${err:-ok}"
done
