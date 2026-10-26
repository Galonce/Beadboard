import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:1180,height:820}, deviceScaleFactor:2, hasTouch:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(24,24); document.querySelectorAll('details.sec').forEach(d=>d.open = d.dataset.sec==='draw'); });

// colors and tools
check('picking a color keeps the Shape tool', await page.evaluate(()=>{ pen.tool='shape'; setPenColor(CODES.indexOf('A5')); return pen.tool; })==='shape', null);
check('…and Fill and Select', await page.evaluate(()=>{ pen.tool='fill'; setPenColor(CODES.indexOf('A5')); const f=pen.tool; pen.tool='select'; setPenColor(CODES.indexOf('A5')); return f==='fill' && pen.tool==='select'; }), null);
check('…but the eraser hands over to the pencil', await page.evaluate(()=>{ pen.tool='eraser'; setPenColor(CODES.indexOf('A5', true)); return pen.tool; })==='pencil', null);

// order: shape-specific sliders right under the picker
check('sides/points/inner sit above the hold buttons', await page.evaluate(()=>{ const c=[...shapectl.children].map(e=>e.id||e.className); return c.indexOf('sidesctl') < c.indexOf('holdrow') && c.indexOf('innerctl') < c.indexOf('holdrow') && c.indexOf('shapetypes') < c.indexOf('sidesctl'); }), null);

check('every shape control lives inside the shape panel, hidden for other tools', await page.evaluate(()=>{
  const ids=['shapetypes','cornerctl','sidesctl','pointsctl','innerctl','holdrow','shapestyle','swctl','smoothctl'];
  const inside = ids.every(id=>shapectl.contains(document.getElementById(id)));
  pen.tool='pencil'; syncDrawUI(); const hiddenForPencil = shapectl.hidden && shapectl.offsetParent===null;
  const brushOutside = !shapectl.contains(sizectl) && !shapectl.contains(opctl);
  return inside && hiddenForPencil && brushOutside; }), null);
// snap angle for an octagon: flat on its edge is reachable
const snap = (deg) => page.evaluate(d=>{ pen.shape.type='polygon'; pen.shape.sides=8;
  const A={x:12,y:12}, at=a=>({x:12+8*Math.cos(a*Math.PI/180), y:12+8*Math.sin(a*Math.PI/180)}), key=c=>c.map(q=>q[0]).sort((m,n)=>m-n).join();
  const got=key(shapeCells(A,at(d),{shift:true}));
  for (const t of [-90,-75,-67.5,-60,-45,-30,-22.5,-15,0]) if (key(shapeCells(A,at(t),{}))===got) return t; return null; }, deg);
const s66 = await snap(-66), s82 = await snap(-82), s50 = await snap(-50);
check('octagon: -66° snaps to -67.5° (flat side up)', s66===-67.5, s66);
check('octagon: -82° snaps to -75°, -50° to -45° (same as -90° by symmetry)', s82===-75 && (s50===-45 || s50===-90), [s82, s50]);
check('octagon flat side up: top row is a flat run', await page.evaluate(()=>{ design.cells.fill(-1); pushUndo(); pen.shape.style='filled'; pen.shape.smooth=0;
  stampShape(snapshot(), {x:12,y:12}, {x:12+8*Math.cos(-67.5*Math.PI/180), y:12+8*Math.sin(-67.5*Math.PI/180)}, {}); buildFromDesign();
  let top=-1; for (let y=0;y<24 && top<0;y++) for (let x=0;x<24;x++) if (grid[y*24+x]!==-1){ top=y; break; }
  let run=0; for (let x=0;x<24;x++) if (grid[top*24+x]!==-1) run++; return run >= 5; }), null);

// changing sides mid-drag updates the shape live
await page.evaluate(()=>{ design.cells.fill(-1); undoStack=[]; pen.tool='shape'; pen.shape.type='polygon'; pen.shape.sides=3; pen.shape.style='filled'; designChanged(); });
const at = (x,y) => page.evaluate(([x,y])=>{ const r=preview.getBoundingClientRect(); return { X: r.left+(x+0.5)*r.width/gw, Y: r.top+(y+0.5)*r.height/gh }; }, [x,y]);
const p0=await at(12,12), p1=await at(12,3);
await page.mouse.move(p0.X,p0.Y); await page.mouse.down(); await page.mouse.move(p1.X,p1.Y,{steps:3}); await page.waitForTimeout(80);
const tri = await page.evaluate(()=>beadTotal());
await page.evaluate(()=>{ shapesides.value=8; shapesides.dispatchEvent(new Event('input')); }); await page.waitForTimeout(80);
const oct = await page.evaluate(()=>beadTotal());
await page.mouse.up(); await page.waitForTimeout(80);
check('sides changed mid-drag: triangle becomes an octagon live', oct > tri * 1.5 && await page.evaluate(()=>undoStack.length)===1, {tri, oct});

// scrolling the panel with a second finger mid-drag
await page.evaluate(()=>{ document.querySelectorAll('details.sec').forEach(d=>d.open=true); ctrl.scrollTop=0; });
await page.mouse.move(p0.X,p0.Y); await page.mouse.down(); await page.mouse.move(p1.X,p1.Y,{steps:2}); await page.waitForTimeout(50);
const moved = await page.evaluate(async ()=>{ const t=document.querySelector('#famchips') || document.querySelector('#drawnote'); const r=t.getBoundingClientRect(); const x=r.left+10, y=r.top+5;
  const ev=(type,yy)=>t.dispatchEvent(new PointerEvent(type,{pointerId:77,pointerType:'touch',clientX:x,clientY:yy,bubbles:true}));
  ev('pointerdown',y); ev('pointermove',y-60); ev('pointermove',y-180); ev('pointerup',y-180); return ctrl.scrollTop; });
await page.mouse.up();
check('second finger scrolls the controls mid-drag', moved >= 170, moved);
check('…and does nothing when no drag is happening', await page.evaluate(()=>{ ctrl.scrollTop=0; const t=document.querySelector('#drawnote'), r=t.getBoundingClientRect();
  const ev=(type,yy)=>t.dispatchEvent(new PointerEvent(type,{pointerId:78,pointerType:'touch',clientX:r.left+5,clientY:yy,bubbles:true}));
  ev('pointerdown',r.top); ev('pointermove',r.top-150); ev('pointerup',r.top-150); return ctrl.scrollTop; })===0, null);

// hold buttons: plain click alone still latches; a full tap toggles once
await page.evaluate(()=>{ pen.tool='shape'; pen.shape.type='rect'; pen.shape.equal=false; syncDrawUI(); });
await page.evaluate(()=>shapeeq.click()); await page.waitForTimeout(50);
check('a bare click latches the button', await page.evaluate(()=>pen.shape.equal===true), null);
await page.evaluate(()=>{ pen.shape.equal=false; syncDrawUI(); });
await page.locator('#shapeeq').scrollIntoViewIfNeeded(); await page.tap('#shapeeq'); await page.waitForTimeout(200);
check('a real tap toggles exactly once', await page.evaluate(()=>pen.shape.equal===true), null);
check('latched state shows an "On" badge', await page.evaluate(()=>getComputedStyle(shapeeq,'::after').content.includes('On')), null);
await page.tap('#shapeeq'); await page.waitForTimeout(200);
check('tap again turns it off', await page.evaluate(()=>pen.shape.equal===false), null);

check('masked pegs carry the pink dot', await page.evaluate(()=>MASK_DOT===true), null);
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
