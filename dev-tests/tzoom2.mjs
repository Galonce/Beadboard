import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820} });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(500); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
const pinch = (factor) => page.evaluate(f=>{
  const s=document.getElementById('stage'), r=s.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const ev=(t,id,x,y)=>s.dispatchEvent(new PointerEvent(t,{pointerId:id+10,clientX:x,clientY:y,bubbles:true,pointerType:'touch'}));
  ev('pointerdown',1,cx-20,cy); ev('pointerdown',2,cx+20,cy);
  ev('pointermove',1,cx-20*f,cy); ev('pointermove',2,cx+20*f,cy);
  ev('pointerup',1,cx-20*f,cy); ev('pointerup',2,cx+20*f,cy);
}, factor);

// ---------- sheet tap under zoom
await page.setInputFiles('#file','/tmp/offsheet.png'); await page.waitForTimeout(800);
await page.check('#assheet'); await page.waitForTimeout(400);
await page.fill('#fw','120'); await page.fill('#fh','120'); await page.dispatchEvent('#fw','change');
await page.evaluate(()=>{for(const [id,v] of [['ox',20],['oy',12]]){const o=document.getElementById(id);o.value=v;o.dispatchEvent(new Event('input'));}});
await page.waitForTimeout(400);
await pinch(2.5); await page.waitForTimeout(500);
const target = await page.evaluate(()=>{ const r=sheet.getBoundingClientRect(), st=stage.getBoundingClientRect();
  // aim at source pixel (200,72) — inside cell col 1,row 0 with the 20,12 offset — if on screen
  const k=r.width/srcImage.width; const x=r.left+200*k, y=r.top+72*k;
  return { x, y, onScreen: x>st.left && x<st.right && y>st.top && y<st.bottom }; });
await page.mouse.click(target.x, target.y); await page.waitForTimeout(400);
console.log('sheet tap @250%  ', target.onScreen ? '' : '(off-screen!)', await page.evaluate(()=>crop?`${crop.w}x${crop.h}@${crop.x},${crop.y}`:'none'), '(expect 120x120@140,12)');

// ---------- Codes view: one finger pans
await page.click('#tab-chart'); await page.waitForTimeout(300);
await pinch(3); await page.waitForTimeout(500);
const before = await page.evaluate(()=>({tx:vp.tx,ty:vp.ty}));
const sb = await page.locator('#stage').boundingBox();
await page.mouse.move(sb.x+sb.width/2, sb.y+sb.height/2); await page.mouse.down();
await page.mouse.move(sb.x+sb.width/2-120, sb.y+sb.height/2-80, {steps:6}); await page.mouse.up();
const after = await page.evaluate(()=>({tx:vp.tx,ty:vp.ty}));
console.log('codes 1-finger pan', `dx=${Math.round(after.tx-before.tx)} dy=${Math.round(after.ty-before.ty)}`, '(expect about -120,-80)');

// ---------- board drag under zoom, and pinch cancelling a drag
await page.evaluate(()=>{ library=[]; placed=[]; });
await page.click('#sample'); await page.waitForTimeout(500);
await page.evaluate(()=>{const s=document.getElementById('w');s.value=16;s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'));});
await page.waitForTimeout(400);
await page.fill('#libname','T'); await page.click('#libsave'); await page.waitForTimeout(300);
await page.evaluate(()=>addToBoard(library[library.length-1])); await page.waitForTimeout(500);
await pinch(2); await page.waitForTimeout(500);
const p0 = await page.evaluate(()=>`${placed[0].x},${placed[0].y}`);
const g = await page.evaluate(()=>{ const r=boardcv.getBoundingClientRect(), bs=boardSize(); const c=r.width/bs;
  return { x:r.left+(placed[0].x+3.5)*c, y:r.top+(placed[0].y+3.5)*c, c }; });
await page.mouse.move(g.x,g.y); await page.mouse.down();
await page.mouse.move(g.x+5*g.c, g.y+4*g.c, {steps:8}); await page.mouse.up(); await page.waitForTimeout(300);
console.log('board drag @200% ', p0, '->', await page.evaluate(()=>`${placed[0].x},${placed[0].y}`), '(expect +5,+4)');

// a second finger arriving mid-drag cancels the drag and becomes a pinch
const p1 = await page.evaluate(()=>`${placed[0].x},${placed[0].y}`);
await page.evaluate(()=>{
  const cv=document.getElementById('boardcv'), s=document.getElementById('stage');
  const r=cv.getBoundingClientRect(), c=r.width/boardSize();
  const x=r.left+(placed[0].x+3.5)*c, y=r.top+(placed[0].y+3.5)*c;
  const ev=(el,t,id,X,Y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:X,clientY:Y,bubbles:true,pointerType:'touch'}));
  ev(cv,'pointerdown',31,x,y); ev(cv,'pointermove',31,x+3*c,y);     // drag starts
  ev(s,'pointerdown',32,x+60,y+60);                                  // second finger lands
  ev(s,'pointermove',31,x+3*c-30,y-30); ev(s,'pointermove',32,x+90,y+90);
  ev(s,'pointerup',31,x,y); ev(s,'pointerup',32,x+90,y+90);
});
await page.waitForTimeout(300);
console.log('pinch cancels drag', p1, '->', await page.evaluate(()=>`${placed[0].x},${placed[0].y}`), '(expect unchanged)');
console.log('errors:', errs.length?errs:'none');
await b.close();