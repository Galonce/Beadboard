import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:1180,height:820}, deviceScaleFactor:2, acceptDownloads:true });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600);
await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.setInputFiles('#file','/tmp/big88.png'); await page.waitForTimeout(800);
await page.fill('#libname','Big 88'); await page.click('#libsave'); await page.waitForTimeout(200);
const plus = () => page.locator('#liblist li').first().locator('.lact', { hasText: '+ Board' }).click();

// 1. on a single 52 board it can't fit, and now it says so where you tapped
await page.click('#tab-preview'); await plus(); await page.waitForTimeout(300);
console.log('52, too big     ', await page.evaluate(()=>({ view, libmsg: libmsg.textContent })));

// 2. the 104 board: grid centered with 2 bare pegs all round
await page.click('#tab-board'); await page.waitForTimeout(200);
await page.locator('#boardsizes button', { hasText: '104' }).click(); await page.waitForTimeout(300);
console.log('104 board       ', await page.evaluate(()=>({ dims: boardDims(), grid: gridArea(), note: document.getElementById('boardsize-note').textContent })));
await plus(); await page.waitForTimeout(300);
console.log('88 on 104       ', await page.evaluate(()=>placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' ')));

// 3. link two 52s across and two down = 104 x 104 surface
await page.locator('#boardsizes button', { hasText: '52' }).click(); await page.waitForTimeout(300);
console.log('back to one 52  ', await page.evaluate(()=>({ placed: placed.length, bmsg: bmsg.textContent })));
await page.click('#lx-plus'); await page.click('#ly-plus'); await page.waitForTimeout(300);
await plus(); await page.waitForTimeout(300);
console.log('2x2 linked 52s  ', await page.evaluate(()=>({ dims: boardDims(), label: boardLabel(), placed: placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' ') })));
await page.locator('#stage').screenshot({ path:'/tmp/linked.png' });

// 4. a non-square surface (2 across, 1 down) and dragging along it
await page.click('#ly-minus'); await page.waitForTimeout(300);
console.log('2x1 surface     ', await page.evaluate(()=>({ dims: `${boardDims().W}x${boardDims().H}`, placed: placed.length, bmsg: bmsg.textContent })));
await page.evaluate(()=>{ placed=[]; selected=-1; });
await page.setInputFiles('#file','/home/claude/sprites/heart.png'); await page.waitForTimeout(500);
await page.fill('#libname','Heart'); await page.click('#libsave'); await page.waitForTimeout(200);
await page.click('#tab-board'); await page.waitForTimeout(200);
await page.locator('#liblist li').nth(1).locator('.lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(300);
const g = await page.evaluate(()=>{ const r=boardcv.getBoundingClientRect(), d=boardDims(); return { x:r.left, y:r.top, cx:r.width/d.W, cy:r.height/d.H, p:{x:placed[0].x,y:placed[0].y} }; });
await page.mouse.move(g.x+(g.p.x+5.5)*g.cx, g.y+(g.p.y+4.5)*g.cy); await page.mouse.down();
await page.mouse.move(g.x+(g.p.x+5.5+70)*g.cx, g.y+(g.p.y+4.5+20)*g.cy, {steps:12}); await page.mouse.up(); await page.waitForTimeout(200);
console.log('drag across join', g.p.x+','+g.p.y, '->', await page.evaluate(()=>`${placed[0].x},${placed[0].y}`), '(expect +70,+20)');

// 5. the largest layout stays under iOS's canvas limit
await page.locator('#boardsizes button', { hasText: '104' }).click();
for (let i=0;i<4;i++){ await page.click('#lx-plus').catch(()=>{}); await page.click('#ly-plus').catch(()=>{}); }
await page.waitForTimeout(500);
console.log('4x4 of 104      ', await page.evaluate(()=>({ dims: `${boardDims().W}x${boardDims().H}`, cell: boardCell,
  canvasMpx: +(boardcv.width*boardcv.height/1e6).toFixed(1), plusDisabled: document.getElementById('lx-plus').disabled })));

// 6. remembered
await page.reload(); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
console.log('after reload    ', await page.evaluate(()=>boardLabel()));

// 7. board PDF of a linked layout
await page.click('#tab-board'); await page.click('#ly-minus'); await page.click('#ly-minus'); await page.click('#ly-minus');
await page.click('#lx-minus'); await page.click('#lx-minus'); await page.waitForTimeout(300);
await page.locator('#liblist li').nth(1).locator('.lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(300);
const dl = page.waitForEvent('download', { timeout: 30000 });
await page.click('#bt-pdf'); const d = await dl; await d.saveAs('/tmp/linked.pdf');
console.log('board PDF       ', fs.statSync('/tmp/linked.pdf').size, 'bytes,', await page.evaluate(()=>boardLabel()));
console.log('errors:', errs.length?errs:'none');
await b.close();