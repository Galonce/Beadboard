import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(16,16); pen.tool='select'; syncDrawUI(); document.querySelectorAll('details.sec').forEach(d=>d.open = d.dataset.sec==='draw'); });
await page.waitForTimeout(200);
const at = (x,y) => page.evaluate(([x,y])=>{ const r=preview.getBoundingClientRect(); return { X: r.left+(x+0.5)*r.width/gw, Y: r.top+(y+0.5)*r.height/gh }; }, [x,y]);
const drag = async (pts) => { const a=await at(...pts[0]); await page.mouse.move(a.X,a.Y); await page.mouse.down(); for (const p of pts.slice(1)) { const c=await at(...p); await page.mouse.move(c.X,c.Y,{steps:2}); } await page.mouse.up(); await page.waitForTimeout(80); };
const selN = () => page.evaluate(()=>design.selN);
const set = (o) => page.evaluate(o=>{ Object.assign(pen,o); syncDrawUI(); }, o);
const reset = () => page.evaluate(()=>{ design.sel.fill(0); undoStack=[]; redoStack=[]; designChanged(); });

// box: replace, add, remove
await reset(); await set({ selMode:'box', selOp:'replace' });
await drag([[1,1],[4,4]]); const b1 = await selN();
await drag([[8,8],[9,9]]); const b2 = await selN();
await set({ selOp:'add' }); await drag([[1,1],[4,4]]); const b3 = await selN();
await set({ selOp:'remove' }); await drag([[1,1],[2,2]]); const b4 = await selN();
check('box: replace 16, replace again 4, add → 20, remove 2x2 → 16', [b1,b2,b3,b4].join()==='16,4,20,16', [b1,b2,b3,b4]);

// brush: replace clears first, even when starting on a selected peg; add; remove
await reset(); await set({ selMode:'brush', selOp:'replace', size:1 });
await page.evaluate(()=>{ for (let x=0;x<16;x++) design.sel[x]=1; designChanged(); });
await drag([[3,0],[3,5]]);
check('brush replace: starting on a selected peg still starts fresh', (await selN())===6, await selN());
await set({ selOp:'add' }); await drag([[6,0],[6,3]]);
check('brush add', (await selN())===10, await selN());
await set({ selOp:'remove' }); await drag([[3,2],[3,5]]);
check('brush remove', (await selN())===6, await selN());

// same color: replace, add, remove
await reset(); await page.evaluate(()=>{ const a=CODES.indexOf('B3'); for(let x=0;x<6;x++){ design.cells[16+x]=a; design.cells[48+x]=a; } designChanged(); });
await set({ selMode:'color', selOp:'replace' });
await drag([[1,1]]); const c1 = await selN();
await set({ selOp:'add' }); await drag([[1,3]]); const c2 = await selN();
await set({ selOp:'remove' }); await drag([[1,1]]); const c3 = await selN();
check('same color: 6, add → 12, remove → 6', [c1,c2,c3].join()==='6,12,6', [c1,c2,c3]);

// hold Remove mid-drag: live, then back on release
await reset(); await set({ selMode:'box', selOp:'replace' });
await page.evaluate(()=>{ for (let p=0;p<256;p++) design.sel[p]=1; designChanged(); });
const p0=await at(2,2), p1=await at(5,5);
await page.mouse.move(p0.X,p0.Y); await page.mouse.down(); await page.mouse.move(p1.X,p1.Y,{steps:2}); await page.waitForTimeout(60);
const replaceN = await selN();
await page.evaluate(()=>selrembtn.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,bubbles:true,pointerType:'touch'}))); await page.waitForTimeout(60);
const heldN = await selN();
await page.evaluate(()=>selrembtn.dispatchEvent(new PointerEvent('pointerup',{pointerId:9,bubbles:true,pointerType:'touch'}))); await page.waitForTimeout(60);
const backN = await selN(); await page.mouse.up(); await page.waitForTimeout(60);
check('hold Remove mid-drag: live subtract, back to replace on release', replaceN===16 && heldN===240 && backN===16, [replaceN, heldN, backN]);
check('a hold during a drag does not latch', await page.evaluate(()=>pen.selOp==='replace'), null);

// latching by tap, one at a time
await page.locator('#seladdbtn').scrollIntoViewIfNeeded();
await page.tap('#seladdbtn'); await page.waitForTimeout(120);
const afterAdd = await page.evaluate(()=>[pen.selOp, seladdbtn.dataset.on, selrembtn.dataset.on].join());
await page.tap('#selrembtn'); await page.waitForTimeout(120);
const afterRem = await page.evaluate(()=>[pen.selOp, seladdbtn.dataset.on, selrembtn.dataset.on].join());
await page.tap('#selrembtn'); await page.waitForTimeout(120);
const off = await page.evaluate(()=>pen.selOp);
check('tap Add latches; tap Remove switches; tap again returns to replace', afterAdd==='add,1,0' && afterRem==='remove,0,1' && off==='replace', [afterAdd, afterRem, off]);

// selections are undo steps
await reset(); await set({ selMode:'box', selOp:'replace' });
await drag([[1,1],[6,6]]); await drag([[9,9],[10,10]]);
await page.evaluate(()=>undo()); await page.waitForTimeout(60);
const u1 = await selN();
await page.evaluate(()=>undo()); await page.waitForTimeout(60);
const u2 = await selN();
await page.evaluate(()=>redo()); await page.waitForTimeout(60);
check('undo/redo walk through selections (36 → 0 → 36)', u1===36 && u2===0 && (await selN())===36, [u1, u2, await selN()]);
await page.evaluate(()=>selAction('none')); await page.waitForTimeout(60);
await page.evaluate(()=>undo()); await page.waitForTimeout(60);
check('Select None can be undone', (await selN())===36, await selN());
const before = await page.evaluate(()=>undoStack.length);
await drag([[12,12]]); await drag([[12,12]]);       // the same 1-peg box twice: the second changes nothing
check('a selection that changes nothing adds no undo step', await page.evaluate(()=>undoStack.length)===before+1, await page.evaluate(()=>undoStack.length));

// icons
check('Mask is the disc with a dot; Unmask has the ×', await page.evaluate(()=>{
  const m=document.getElementById('i-mask').innerHTML, u=document.getElementById('i-unmask').innerHTML;
  return /r="1\.7"/.test(m) && !/l5\.6 5\.6/.test(m) && /l5\.6 5\.6/.test(u); }), null);
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
