import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:1000} });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));

// --- Colours tab with no image at all
await page.click('#tab-colors'); await page.waitForTimeout(400);
console.log('colours tab, no image:', await page.evaluate(()=>({
  visible: !document.getElementById('colview').hidden,
  swatches: document.querySelectorAll('#refgrid button').length,
  emptyHidden: document.getElementById('empty').hidden })));

// --- gate: locked by default
await page.fill('#refsearch','G9'); await page.waitForTimeout(400);
console.log('locked, editor shown?', await page.evaluate(()=>!!document.querySelector('.caled')));

// set a PIN
await page.locator('#calib .linkbtn').first().click(); await page.waitForTimeout(250);
const ins = page.locator('.pinform input');
await ins.nth(0).fill('1234'); await ins.nth(1).fill('9999');
await page.locator('.pinform .pick').click(); await page.waitForTimeout(200);
console.log('mismatch msg:', await page.evaluate(()=>document.querySelector('.pinform .msg').textContent));
await ins.nth(1).fill('1234'); await page.locator('.pinform .pick').click(); await page.waitForTimeout(300);
console.log('unlocked, editor shown?', await page.evaluate(()=>!!document.querySelector('.caled')));

// adjust G9 brightness down, save
const g9 = await page.evaluate(()=>({ factory: toHex(ORIG_RGB[CODES.indexOf('G9')]), before: toHex(RGB[CODES.indexOf('G9')]) }));
await page.evaluate(()=>{ const r=document.querySelectorAll('.caled input[type=range]')[2]; r.value=60; r.dispatchEvent(new Event('input')); });
await page.locator('.caled .pick').first().click(); await page.waitForTimeout(400);
console.log('G9', g9, '-> after', await page.evaluate(()=>toHex(RGB[CODES.indexOf('G9')])),
            '| stored:', await page.evaluate(()=>localStorage.getItem('beadboard:calib')));

// lock, reload: calibration must persist, gate must re-lock
await page.reload(); await page.waitForTimeout(800); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
console.log('after reload — G9:', await page.evaluate(()=>toHex(RGB[CODES.indexOf('G9')])), '| unlocked?', await page.evaluate(()=>parentUnlocked));

// wrong PIN refused, right PIN works
await page.click('#tab-colors'); await page.waitForTimeout(300);
await page.locator('#calib .linkbtn').first().click(); await page.waitForTimeout(200);
await page.locator('.pinform input').first().fill('0000'); await page.locator('.pinform .pick').click(); await page.waitForTimeout(200);
console.log('wrong PIN:', await page.evaluate(()=>document.querySelector('.pinform .msg').textContent));
await page.locator('.pinform input').first().fill('1234'); await page.locator('.pinform .pick').click(); await page.waitForTimeout(300);
console.log('right PIN unlocked:', await page.evaluate(()=>parentUnlocked));

// calibration reaches the matcher: a pixel the old G9 colour should now not need G9
await page.click('#tab-preview');
console.log('matcher uses calibrated LAB:', await page.evaluate(()=>{
  const i=CODES.indexOf('G9'); const L=oklab(...RGB[i]);
  return Math.abs(L[0]-LAB[i][0])<1e-9; }));

// back to factory
await page.click('#tab-colors'); await page.fill('#refsearch','G9'); await page.waitForTimeout(300);
await page.locator('.caled .pick.secondary', { hasText: 'Back to factory' }).first().click(); await page.waitForTimeout(300);
console.log('back to factory:', await page.evaluate(()=>toHex(RGB[CODES.indexOf('G9')])), '| stored:', await page.evaluate(()=>localStorage.getItem('beadboard:calib')));
console.log('errors:', errs.length?errs:'none');
await b.close();