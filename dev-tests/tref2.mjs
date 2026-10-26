import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:1180,height:820}, deviceScaleFactor:2 });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>localStorage.clear()); await page.reload(); await page.waitForTimeout(700);
await page.evaluate(()=>{ newBlankDesign(32,32); document.querySelectorAll('details.sec').forEach(d=>d.open = ['draw','ref'].includes(d.dataset.sec)); });
await page.waitForTimeout(300);
console.log('section        ', await page.evaluate(()=>({ shown: !refpanel.hidden, controls: !refctl.hidden })));
await page.setInputFiles('#reffile', '/home/claude/refphoto.jpg'); await page.waitForTimeout(800);
console.log('added          ', await page.evaluate(()=>({ img: `${ref.img.width}x${ref.img.height}`, smooth: ref.smooth, rect: Object.values(refRect()).map(v=>+v.toFixed(1)).join(', '), beads: beadTotal() })));

// position: drag 8 pegs right
await page.click('#ref-pos'); await page.waitForTimeout(100);
const pr = await page.evaluate(()=>{ const r=preview.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2, peg:r.width/gw }; });
await page.mouse.move(pr.x, pr.y); await page.mouse.down(); await page.mouse.move(pr.x + 8*pr.peg, pr.y, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(150);
console.log('moved          ', await page.evaluate(()=>({ cx: +ref.cx.toFixed(2), cy: +ref.cy.toFixed(2), heading: drawtoolname.textContent, beads: beadTotal() })), '(expect cx 24, no beads painted)');
await page.click('#ref-fit'); await page.waitForTimeout(100);
await page.evaluate(()=>{ ref.s = 1.5; syncDrawUI(); drawPreview(); });   // cover the whole canvas

// Turn into beads
await page.click('#refconvert'); await page.waitForTimeout(300);
console.log('turned         ', await page.evaluate(()=>({ beads: beadTotal(), colors: counts.length, msg: msg.textContent })));
await page.screenshot({ path:'/tmp/ref-beads.png' });
await page.click('#pu-undo'); await page.waitForTimeout(200);
console.log('undo           ', await page.evaluate(()=>beadTotal()), 'beads');

// only inside a selection, never on masked pegs
await page.evaluate(()=>{ for (let y=0;y<10;y++) for (let x=0;x<10;x++) design.sel[y*32+x]=1; design.mask[0]=1; designChanged(); });
await page.waitForTimeout(150);
await page.click('#refconvert'); await page.waitForTimeout(300);
console.log('selection      ', await page.evaluate(()=>({ beads: beadTotal(), maskedEmpty: grid[0] === -1 })), '(expect 99: 10x10 minus the masked peg)');
await page.evaluate(()=>{ design.sel.fill(0); design.mask[0]=0; designChanged(); });

// lower opacity, then the faded reference is what you trace on
await page.evaluate(()=>{ $('refop').value = 25; $('refop').dispatchEvent(new Event('input')); });
console.log('opacity        ', await page.evaluate(()=>ref.op));

// close and reopen: drawing and reference both come back
await page.waitForTimeout(900);
await page.reload(); await page.waitForTimeout(1200);
console.log('after reopen   ', await page.evaluate(()=>({ design: design && `${design.w}x${design.h}`, beads: beadTotal(), ref: !!ref, op: ref && ref.op, cx: ref && +ref.cx.toFixed(1) })));
// a new blank canvas starts clean
await page.evaluate(()=>newBlankDesign(16,16)); await page.waitForTimeout(200);
console.log('new blank      ', await page.evaluate(()=>({ ref: !!ref, controls: !refctl.hidden })));

// pixel art keeps crisp sampling and gets its own beads
await page.setInputFiles('#reffile', '/home/claude/sprites/smiley.png'); await page.waitForTimeout(600);
await page.click('#refconvert'); await page.waitForTimeout(300);
console.log('pixel art      ', await page.evaluate(()=>({ smooth: ref.smooth, beads: beadTotal(), colors: counts.length })));

// On top: the reference draws over the beads at the same opacity, and the setting survives a reopen
await page.evaluate(()=>{ newBlankDesign(16,16); });
await page.setInputFiles('#reffile', '/home/claude/refphoto.jpg'); await page.waitForTimeout(800);
await page.evaluate(()=>{ for (let p=0;p<256;p++) design.cells[p]=CODES.indexOf('H7'); ref.op=0.6; designChanged(); });
await page.waitForTimeout(300);
const px = () => page.evaluate(()=>{ const c=preview, x=c.getContext('2d'); const d=x.getImageData(Math.round(c.width*0.53), Math.round(c.height*0.53), 1, 1).data; return [d[0],d[1],d[2]]; });
const under = await px();
await page.click('#ref-top'); await page.waitForTimeout(250);
const over = await px();
console.log('on top         ', { under, over, button: await page.evaluate(()=>$('ref-top').dataset.on) }, '(black bead stays black underneath, gets tinted on top)');
await page.waitForTimeout(700); await page.reload(); await page.waitForTimeout(1200);
console.log('kept on reopen ', await page.evaluate(()=>({ top: ref && ref.top, button: $('ref-top').dataset.on })));
console.log('errors:', errs.length?errs:'none'); await b.close();
