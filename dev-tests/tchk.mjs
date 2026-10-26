import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:1000} });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.click('#tab-colors'); await page.waitForTimeout(300);

const marks = () => page.evaluate(()=>({
  ticks: document.querySelectorAll('#refgrid button[data-chk="1"]').length,
  shown: document.querySelectorAll('#refgrid button').length }));
console.log('locked, no marks       ', await marks());

// set PIN & unlock
await page.locator('#calib .linkbtn').first().click();
const ins = page.locator('.pinform input');
await ins.nth(0).fill('1234'); await ins.nth(1).fill('1234');
await page.locator('.pinform .pick').click(); await page.waitForTimeout(300);
console.log('unlocked progress      ', await page.evaluate(()=>document.querySelector('.pbprog .pbnote').textContent));

// open H1, mark it "looks right"
await page.fill('#refsearch','H1'); await page.waitForTimeout(300);
await page.locator('.caled button', { hasText: 'Looks right' }).click(); await page.waitForTimeout(300);
console.log('after Looks right      ', await page.evaluate(()=>({
  progress: document.querySelector('.pbprog .pbnote').textContent,
  button: [...document.querySelectorAll('.caled button')].map(b=>b.textContent).find(t=>t.includes('Checked')) })));

// step with Next unchecked: should skip H1 and land on the next code in order
await page.locator('.caled button', { hasText: 'Next unchecked' }).click(); await page.waitForTimeout(300);
console.log('next unchecked lands on', await page.evaluate(()=>CODES[refSel]));

// adjust & save also marks checked
await page.evaluate(()=>{ const r=document.querySelectorAll('.caled input[type=range]')[2]; r.value=40; r.dispatchEvent(new Event('input')); });
await page.locator('.caled .pick').first().click(); await page.waitForTimeout(400);
console.log('save marks checked     ', await page.evaluate(()=>({ code: CODES[refSel], checked: checked.has(CODES[refSel]),
  progress: document.querySelector('.pbprog .pbnote').textContent })));

// filter: unchecked only hides the two
await page.fill('#refsearch',''); await page.dispatchEvent('#refsearch','input'); await page.waitForTimeout(200);
await page.locator('.pbfilter input').check(); await page.waitForTimeout(300);
console.log('unchecked only         ', await marks());

// persistence across reload; lock resets, markers hidden again
await page.reload(); await page.waitForTimeout(800); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
console.log('after reload           ', await page.evaluate(()=>({ stored: localStorage.getItem('beadboard:checked'), unlocked: parentUnlocked })));
await page.click('#tab-colors'); await page.waitForTimeout(300);
console.log('relocked, no marks     ', await marks());
console.log('errors:', errs.length?errs:'none');
await b.close();