import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true, acceptDownloads:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>localStorage.clear());
const lay = await page.evaluate(()=>{
  const out = {};
  for (const [B] of BOARD_PRESETS) for (const [w,h] of SW_SIZES) {
    const L = swatchLayout(B,w,h); const occ = new Map(); let bad = 0;
    const put = (bd,x,y)=>{ const k=bd+':'+x+','+y; if(occ.has(k)||x<0||y<0||x>=B||y>=B) bad++; occ.set(k,1); };
    for (const t of L.items) for (let j=0;j<h;j++) for (let i=0;i<w;i++) put(t.board,t.x+i,t.y+j);
    for (const c of L.conns) put(c.board,c.x,c.y);
    let loose = 0;
    for (const c of L.conns) if(!occ.has(c.board+':'+(c.x-1)+','+c.y) || !occ.has(c.board+':'+(c.x+1)+','+c.y)) loose++;
    out[`${B} ${w}x${h}`] = { perRow:L.perRow, boards:L.boards, conns:L.conns.length, total:L.total, bad, loose, seq:L.items.every((t,k)=>t.i===k) };
  }
  return out;
});
console.table(lay);
const want = { '78 3x3':[19,1,209,2198], '78 4x3':[15,1,206,2858], '52 3x3':[13,2,204,2193], '104 3x3':[26,1,212,2201] };
for (const [k,[pr,bd,cn,tt]] of Object.entries(want)) { const v = lay[k];
  if (v.perRow!==pr || v.boards!==bd || v.conns!==cn || v.total!==tt) console.log('FAILED layout', k, v); }
for (const [k,v] of Object.entries(lay)) if (v.bad || v.loose || !v.seq) console.log('FAILED overlap/joiner', k, v);
await page.tap('#tab-colors'); await page.waitForTimeout(400);
if (!await page.evaluate(()=>!!swkit.offsetParent)) console.log('FAILED kit hidden');
await page.locator('#swboard button').nth(0).tap(); await page.locator('#swsize button').nth(1).tap(); await page.waitForTimeout(100);
const [dl] = await Promise.all([ page.waitForEvent('download', {timeout:15000}), page.tap('#swpdf') ]);
if (dl.suggestedFilename() !== 'swatch-board-52-4x3.pdf') console.log('FAILED filename', dl.suggestedFilename());
for (const [B,w,h,n] of [[78,3,3,3],[78,4,3,3],[52,3,3,6],[104,4,3,3]]) {
  const b64 = await page.evaluate(async ([B,w,h])=>{ const bl = makeSwatchPDF(B,w,h); const buf = new Uint8Array(await bl.arrayBuffer()); let s=''; for (const c of buf) s+=String.fromCharCode(c); return btoa(s); }, [B,w,h]);
  const pages = (Buffer.from(b64,'base64').toString('latin1').match(/\/Type \/Page[^s]/g)||[]).length;
  if (pages !== n) console.log('FAILED pages', B, w, h, pages, 'expected', n);
}
console.log('errors:', errs.length?errs:'none');
await b.close();
