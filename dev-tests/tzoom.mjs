import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:390,height:844} });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(500); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.setInputFiles('#file','/mnt/user-data/uploads/IMG_3989.png'); await page.waitForTimeout(900);
const st = () => page.evaluate(()=>({ s:+vp.s.toFixed(3), fit:+vp.fit.toFixed(3), fitted:vp.fitted, zoom:zoomlbl.textContent }));

// 1. trackpad pinch (ctrl+wheel) zooms around the cursor
const box = await page.locator('#stage').boundingBox();
await page.mouse.move(box.x + box.width*0.3, box.y + box.height*0.3);
for (let i=0;i<6;i++){ await page.mouse.wheel(0,-60); }
await page.keyboard.down('Control'); for (let i=0;i<6;i++){ await page.mouse.wheel(0,-60); } await page.keyboard.up('Control');
await page.waitForTimeout(200);
console.log('ctrl+wheel zoom  ', await st());

// 2. two-finger pinch, synthesised as real pointer events on the stage
await page.click('#fitbtn'); await page.waitForTimeout(100);
console.log('after Fit        ', await st());
await page.evaluate(()=>{
  const s = document.getElementById('stage'), r = s.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  const ev = (type,id,x,y)=>s.dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:y,bubbles:true,pointerType:'touch',isPrimary:id===1}));
  ev('pointerdown',1,cx-20,cy); ev('pointerdown',2,cx+20,cy);
  for (let k=1;k<=10;k++){ ev('pointermove',1,cx-20-k*8,cy); ev('pointermove',2,cx+20+k*8,cy); }
  ev('pointerup',1,cx-100,cy); ev('pointerup',2,cx+100,cy);
});
await page.waitForTimeout(150);
console.log('pinch out x5     ', await st());

// 3. a tap while zoomed must hit the bead under the finger
const hit = await page.evaluate(()=>{
  const cv = document.getElementById('preview'), r = cv.getBoundingClientRect();
  // pick a bead that is on screen: the centre of the stage
  const s = document.getElementById('stage').getBoundingClientRect();
  const px = s.left + s.width/2, py = s.top + s.height/2;
  const gx = Math.floor((px - r.left)/r.width*gw), gy = Math.floor((py - r.top)/r.height*gh);
  return { px, py, expected: CODES[grid[gy*gw+gx]], gx, gy };
});
await page.mouse.click(hit.px, hit.py); await page.waitForTimeout(250);
console.log('tap while zoomed ', hit.expected, '->', await page.evaluate(()=>swaptitle.textContent));

// 4. a drag must NOT count as a tap
await page.evaluate(()=>closeSwap());
await page.mouse.move(hit.px, hit.py); await page.mouse.down();
await page.mouse.move(hit.px+40, hit.py+30, {steps:6}); await page.mouse.up(); await page.waitForTimeout(200);
console.log('drag is not a tap', await page.evaluate(()=>swaptitle.textContent));

// 5. each view remembers its own zoom
const zPreview = (await st()).s;
await page.click('#tab-chart'); await page.waitForTimeout(300);
console.log('codes view       ', await st());
await page.click('#tab-preview'); await page.waitForTimeout(300);
console.log('back to preview  ', (await st()).s === zPreview ? 'zoom restored '+zPreview : 'LOST zoom '+JSON.stringify(await st()));

// 6. rotate the phone
await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(500);
console.log('rotated          ', await page.evaluate(()=>{ const s=stage.getBoundingClientRect(), c=ctrl.getBoundingClientRect();
  return { stage:`${Math.round(s.width)}x${Math.round(s.height)}`, controls: c.left >= s.right-1 ? 'RIGHT':'BELOW',
           pageScrolls: document.scrollingElement.scrollHeight > innerHeight+1 }; }));
console.log('errors:', errs.length?errs:'none');
await b.close();