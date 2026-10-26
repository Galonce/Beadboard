import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:1180,height:820} });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(500);
await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));

// three designs, saved
await page.click('#sample'); await page.waitForTimeout(500);
for (const [w,name] of [[30,'Big'],[20,'Mid'],[16,'Small']]) {
  await page.evaluate(v=>{const s=document.getElementById('w');s.value=v;s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'));}, w);
  await page.waitForTimeout(300);
  await page.fill('#libname', name); await page.click('#libsave'); await page.waitForTimeout(250);
}
await page.click('#tab-board'); await page.waitForTimeout(300);
console.log('presets:', await page.evaluate(()=>[...document.querySelectorAll('#boardsizes button')].map(b=>b.textContent+(b.dataset.on==='1'?' (on)':'')).join(' | ')));

// switch to 78 and place all three
await page.locator('#boardsizes button', { hasText: '78' }).click(); await page.waitForTimeout(300);
console.log('78 board:', await page.evaluate(()=>({ board: boardSize(), grid: gridArea(), active: document.querySelector('#boardsizes [data-on="1"]').textContent })));
for (let i=0;i<3;i++){ await page.locator('#liblist li').nth(i).locator('.lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(250); }
await page.evaluate(()=>{ placed[0].x=50; placed[0].y=46; drawBoard(); });   // park the big one where only a 78 board has room
console.log('placed on 78:', await page.evaluate(()=>placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' ')));

// back to 52: the parked one must be re-fitted, not lost
await page.locator('#boardsizes button', { hasText: '52' }).click(); await page.waitForTimeout(300);
console.log('back to 52:', await page.evaluate(()=>({ placed: placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' '), msg: bmsg.textContent })));

// the board choice is remembered
await page.locator('#boardsizes button', { hasText: '78' }).click(); await page.waitForTimeout(200);
await page.reload(); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
console.log('after reload board:', await page.evaluate(()=>boardSize()));

// delete needs confirmation
await page.evaluate(()=>{ libpanel.open = true; });
await page.locator('#liblist li .ldel').first().click(); await page.waitForTimeout(200);
console.log('after tapping ×:', await page.evaluate(()=>({ designs: library.length, row: document.querySelector('#liblist .libconfirm')?.innerText.replace(/\s+/g,' ') })));
await page.locator('#liblist .lno').click(); await page.waitForTimeout(200);
console.log('after Keep:', await page.evaluate(()=>library.length));
await page.locator('#liblist li .ldel').first().click(); await page.waitForTimeout(200);
await page.locator('#liblist .lyes').click(); await page.waitForTimeout(200);
console.log('after Delete:', await page.evaluate(()=>({ designs: library.map(d=>d.name).join(','), msg: libmsg.textContent })));

// clear board needs a second tap
await page.click('#tab-board'); await page.waitForTimeout(300);
await page.locator('#liblist li').first().click(); await page.waitForTimeout(250);
await page.click('#bt-clear'); await page.waitForTimeout(100);
console.log('one tap on Clear:', await page.evaluate(()=>({ onBoard: placed.length, label: document.getElementById('bt-clear').textContent })));
await page.click('#bt-clear'); await page.waitForTimeout(100);
console.log('second tap:', await page.evaluate(()=>({ onBoard: placed.length, msg: bmsg.textContent })));
console.log('errors:', errs.length?errs:'none');
await b.close();