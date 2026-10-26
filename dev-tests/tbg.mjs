import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:390,height:950}});
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.setInputFiles('#file','/tmp/sprite_bg.png'); await page.waitForTimeout(1000);

const st = async l => console.log(l, await page.evaluate(()=>({
  grid: gw+'x'+gh,
  beads: +document.getElementById('s-total').textContent.replace(/,/g,''),
  removed: document.getElementById('s-removed').textContent,
  colours: counts.length,
  holeKept: grid[18*gw+19] !== -1      // the interior eye must survive
})));

await st('start      ');
await page.check('#bgedge'); await page.waitForTimeout(700);
await st('edge sweep ');

// does it survive a re-quantize?
await page.evaluate(()=>{const w=document.getElementById('w');w.value=80;w.dispatchEvent(new Event('input'));w.dispatchEvent(new Event('change'));});
await page.waitForTimeout(700);
await st('width 80   ');

// erase-colour tool on the remaining red
await page.uncheck('#bgedge'); await page.waitForTimeout(500);
await page.evaluate(()=>{const w=document.getElementById('w');w.value=40;w.dispatchEvent(new Event('input'));w.dispatchEvent(new Event('change'));});
await page.waitForTimeout(600);
await page.locator('#tools button[data-tool=color]').click();
const pv = await page.locator('#preview').boundingBox();
await page.locator('#preview').click({position:{x:pv.width*0.5,y:pv.height*0.5}});
await page.waitForTimeout(600);
await st('erase col  ');
await page.click('#bgreset'); await page.waitForTimeout(600);
await st('restored   ');
console.log('errors:', errs.length?errs:'none');
await b.close();