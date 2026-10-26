#!/bin/bash
# Runs every suite against /mnt/user-data/outputs/beadboard.html. Copy the .mjs files to /home/claude first.
cd /home/claude
for t in regress tcal tchk tsave tbg tlib2 tpack tlayout2 tstuck timport topen tboard2 tdrag3 tlink tzoom tzoom2 tdrawall tref2 tshapes tshapes2 tcolors tsel2 tmask2 ttoolcol trefpick tloupe; do
  out=$(timeout 150 node $t.mjs 2>&1 | grep -v 403)
  err=$(echo "$out" | grep -iE "errors: \[|Timeout|Error:|TOUCHING|PROBLEM|DIFFERENT|ENOENT|FAILED" | head -1)
  echo "$t: ${err:-ok}"
done
