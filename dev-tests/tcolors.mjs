import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(16,16); });
await page.waitForTimeout(300);
// draw a stroke in Preview with a real drag
const r = await page.evaluate(()=>{ const b=preview.getBoundingClientRect(); return {x:b.left, y:b.top, w:b.width}; });
await page.mouse.move(r.x+20, r.y+20); await page.mouse.down(); await page.mouse.move(r.x+r.w*0.7, r.y+60, {steps:6}); await page.mouse.up();
await page.waitForTimeout(200);
console.log('drawn          ', await page.evaluate(()=>beadTotal()), 'beads');
await page.tap('#tab-colors'); await page.waitForTimeout(400);
await page.locator('#refgrid button').nth(5).tap(); await page.waitForTimeout(300);
console.log('tap in Colors  ', await page.evaluate(()=>({ refSel, detail: refdetail.textContent.slice(0,30) })));
// and the guard still works where it matters: a drag on the canvas isn't also a tap
await page.tap('#tab-preview'); await page.waitForTimeout(300);
await page.evaluate(()=>{ pen.tool=null; syncDrawUI(); });
const r2 = await page.evaluate(()=>{ const b=preview.getBoundingClientRect(); return {x:b.left, y:b.top, w:b.width}; });
await page.mouse.move(r2.x+30, r2.y+30); await page.mouse.down(); await page.mouse.move(r2.x+r2.w*0.6, r2.y+90, {steps:6}); await page.mouse.up(); await page.waitForTimeout(250);
console.log('drag in Preview', await page.evaluate(()=>({ swapOpened: swapFrom !== null })), '(expect false: a drag is not a tap)');
console.log('errors:', errs.length?errs:'none'); await b.close();
