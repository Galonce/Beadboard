import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820}, deviceScaleFactor:2 });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(15,15); pen.tool='shape'; pen.color=CODES.indexOf('F5'); syncDrawUI(); document.querySelectorAll('details.sec').forEach(d=>d.open = d.dataset.sec==='draw'); });
const at = (x,y) => page.evaluate(([x,y])=>{ const r=preview.getBoundingClientRect(); return { X: r.left+(x+0.5)*r.width/gw, Y: r.top+(y+0.5)*r.height/gh }; }, [x,y]);
const drag = async (a,c) => { const p=await at(...a); await page.mouse.move(p.X,p.Y); await page.mouse.down(); const q=await at(...c); await page.mouse.move(q.X,q.Y,{steps:4}); await page.mouse.up(); await page.waitForTimeout(80); };
const pic = () => page.evaluate(()=>{ const out=[]; for(let y=0;y<gh;y++){ let s=''; for(let x=0;x<gw;x++) s+= grid[y*gw+x]===-1?'·':'#'; out.push(s);} return out; });
const clear = () => page.evaluate(()=>{ design.cells.fill(-1); design.mask.fill(0); design.sel.fill(0); undoStack=[]; pen.mirrorX=false; Object.assign(pen.shape,{equal:false,center:false,smooth:0}); designChanged(); });
const beads = () => page.evaluate(()=>beadTotal());

// crisp box shapes unchanged
const shots=[];
await clear(); await page.evaluate(()=>Object.assign(pen.shape,{type:'rrect',style:'outline',width:2,corner:4})); await drag([1,1],[13,13]); shots.push(['rrect r4 w2', await pic()]);
await clear(); await page.evaluate(()=>Object.assign(pen.shape,{type:'ellipse',style:'outline',width:1})); await drag([1,3],[13,11]); shots.push(['ellipse', await pic()]);
// radial stars: the point under the finger is a vertex
await clear(); await page.evaluate(()=>Object.assign(pen.shape,{type:'star',style:'filled',points:5,inner:45})); await drag([7,7],[7,1]); shots.push(['star, dragged up', await pic()]);
await clear(); await drag([7,7],[13,7]); shots.push(['star, dragged right', await pic()]);
await clear(); await page.evaluate(()=>Object.assign(pen.shape,{type:'polygon',style:'outline',width:1,sides:6})); await drag([7,7],[12,3]); shots.push(['hexagon, dragged NE', await pic()]);
console.log(shots.map(([t])=>t.padEnd(17)).join(' ')); for (let r=0;r<15;r++) console.log(shots.map(([,p])=>p[r]+'  ').join(' ')); console.log();
const upTip = shots[2][1][1][7]==='#' && shots[2][1][1].replace(/·/g,'').length===1;
const rightTip = shots[3][1][7][13]==='#';
check('star tip follows the finger (up, then right)', upTip && rightTip, [shots[2][1][1], shots[3][1][7]]);

// snap angle: -31° lands on -30°
check('Snap angle rounds to 15° steps', await page.evaluate(()=>{ pen.shape.type='star';
  const A={x:7,y:7}, k=a=>({x:7+6*Math.cos(a), y:7+6*Math.sin(a)}), key=c=>c.map(q=>q[0]).sort((m,n)=>m-n).join();
  return key(shapeCells(A,k(-31*Math.PI/180),{shift:true})) === key(shapeCells(A,k(-30*Math.PI/180),{})) &&
         key(shapeCells(A,k(-31*Math.PI/180),{})) !== key(shapeCells(A,k(-30*Math.PI/180),{})); }), null);

// hold a button with a second finger mid-drag: live, then released
await clear(); await page.evaluate(()=>{ pen.shape.type='rect'; pen.shape.style='filled'; syncDrawUI(); });
const p0=await at(2,2), p1=await at(12,7);
await page.mouse.move(p0.X,p0.Y); await page.mouse.down(); await page.mouse.move(p1.X,p1.Y,{steps:4}); await page.waitForTimeout(60);
const rect = await beads();
await page.evaluate(()=>shapeeq.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,bubbles:true,pointerType:'touch'}))); await page.waitForTimeout(80);
const held = await beads(); const heldLit = await page.evaluate(()=>shapeeq.dataset.held);
await page.evaluate(()=>shapeeq.dispatchEvent(new PointerEvent('pointerup',{pointerId:9,bubbles:true,pointerType:'touch'}))); await page.waitForTimeout(80);
const released = await beads();
await page.mouse.up(); await page.waitForTimeout(80);
check('hold "Square" mid-drag: live square, back to rectangle on release', rect===66 && held===121 && released===66 && heldLit==='1', {rect, held, released, heldLit});
check('a hold during a drag does not latch it on', await page.evaluate(()=>pen.shape.equal===false), null);
check('second finger on the button does not cancel the drag', (await beads())===66 && await page.evaluate(()=>undoStack.length)===1, await beads());
// quick tap with no drag latches it
await page.evaluate(()=>{ shapeeq.dispatchEvent(new PointerEvent('pointerdown',{pointerId:10,bubbles:true})); shapeeq.dispatchEvent(new PointerEvent('pointerup',{pointerId:10,bubbles:true})); });
check('quick tap keeps it on', await page.evaluate(()=>pen.shape.equal===true && shapeeq.dataset.on==='1'), null);
await page.evaluate(()=>{ design.cells.fill(-1); undoStack=[]; designChanged(); }); await drag([2,2],[12,7]);
check('latched Square draws squares', (await beads())===121, await beads());
await page.evaluate(()=>{ shapeeq.dispatchEvent(new PointerEvent('pointerdown',{pointerId:11,bubbles:true})); shapeeq.dispatchEvent(new PointerEvent('pointerup',{pointerId:11,bubbles:true})); });
check('tap again turns it off', await page.evaluate(()=>pen.shape.equal===false), null);
check('polygons and stars hide From center', await page.evaluate(()=>{ pen.shape.type='star'; syncDrawUI(); const h=shapectr.hidden; pen.shape.type='rect'; syncDrawUI(); return h && !shapectr.hidden && shapeeqlbl.textContent==='Square'; }), null);

// smooth edges
const smoothRun = (bg, blend, smooth) => page.evaluate(([bg,blend,smooth])=>{
  design.cells.fill(bg==='none'?-1:CODES.indexOf(bg)); design.mask.fill(0); undoStack=[]; buildFromDesign();
  Object.assign(pen.shape,{type:'ellipse',style:'filled',smooth,equal:true,center:false}); pen.blend=blend; pen.opacity=100; pen.color=CODES.indexOf('F5');
  pushUndo(); stampShape(snapshot(), {x:2,y:2}, {x:12,y:12}, {}); buildFromDesign();
  const c={}; for (const v of design.cells) { const k=v===-1?'empty':CODES[v]; c[k]=(c[k]||0)+1; } return c; }, [bg,blend,smooth]);
const crispW = await smoothRun('H2','mix',0), smoothW = await smoothRun('H2','mix',60);
const blends = Object.keys(smoothW).filter(k=>k!=='F5'&&k!=='H2');
check('Mix over white: edges get in-between colors', Object.keys(crispW).length===2 && blends.length>=1, {crisp: crispW, smooth: smoothW});
const crispE = await smoothRun('none','mix',0), smoothE = await smoothRun('none','mix',60);
check('Mix over empty pegs: stays crisp, about the same size', Object.keys(smoothE).length===2 && Math.abs(smoothE.F5-crispE.F5) <= 8, {crispE, smoothE});
const pegs = (blend, smooth) => page.evaluate(([blend,smooth])=>{ design.cells.fill(-1); undoStack=[]; Object.assign(pen.shape,{type:'ellipse',style:'filled',smooth,equal:true,center:false}); pen.blend=blend;
  pushUndo(); stampShape(snapshot(), {x:2,y:2}, {x:12,y:12}, {}); return [...design.cells.keys()].filter(p=>design.cells[p]!==-1); }, [blend,smooth]);
const crispSet = new Set(await pegs('dither',0)), dithSet = await pegs('dither',100);
const outside = dithSet.filter(p=>!crispSet.has(p)).length, missing = [...crispSet].filter(p=>!dithSet.includes(p)).length;
check('Dither over empty: a scatter beyond the edge and gaps just inside it', outside > 0 && missing > 0, {outside, missing});
check('smooth edges show the blend choice', await page.evaluate(()=>{ pen.tool='shape'; pen.shape.smooth=50; pen.opacity=100; syncDrawUI(); return !blendmodes.hidden; }), null);
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
