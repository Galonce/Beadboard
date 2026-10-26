import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:390,height:900}});
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));

// 1. pixel art + distinct colours
await page.setInputFiles('#file','/mnt/user-data/uploads/IMG_3989.png'); await page.waitForTimeout(1100);
console.log('1 gameboy   ', await page.evaluate(()=>({grid:gw+'x'+gh, src:srcColours, beads:counts.length})));
// 2. swap
await page.locator('#list li').nth(1).click(); await page.waitForTimeout(350);
await page.locator('#swapnear button').first().click(); await page.waitForTimeout(600);
console.log('2 swap      ', await page.evaluate(()=>[...swaps.entries()].map(([a,c])=>CODES[a]+'->'+CODES[c]).join()));
// 3. survives requantize
await page.evaluate(()=>{const w=document.getElementById('w');w.value=80;w.dispatchEvent(new Event('input'));w.dispatchEvent(new Event('change'));});
await page.waitForTimeout(600);
console.log('3 persists  ', await page.evaluate(()=>[...swaps.entries()].length===1 && counts.length===4));
// 4. sprite sheet + offset + pixel exact
await page.setInputFiles('#file','/tmp/offsheet.png'); await page.waitForTimeout(900);
await page.check('#assheet'); await page.waitForTimeout(500);
await page.fill('#fw','120'); await page.fill('#fh','120'); await page.dispatchEvent('#fw','change'); await page.waitForTimeout(600);
const bx = await page.locator('#sheet').boundingBox(); const k = bx.width/512;
await page.locator('#sheet').click({position:{x:200*k,y:72*k}}); await page.waitForTimeout(600);
await page.evaluate(()=>{for(const [id,v] of [['ox',20],['oy',12]]){const o=document.getElementById(id);o.value=v;o.dispatchEvent(new Event('input'));}});
await page.waitForTimeout(700);
console.log('4 sheet     ', await page.evaluate(()=>({crop:`${crop.w}x${crop.h}@${crop.x},${crop.y}`, grid:gw+'x'+gh})));
// 5. photo path
await page.setInputFiles('#file','/tmp/big.jpg'); await page.waitForTimeout(1200);
console.log('5 photo 12MP', await page.evaluate(()=>({src:srcImage.width+'x'+srcImage.height, beads:counts.length})));
console.log('errors:', errs.length?errs:'none');
await b.close();