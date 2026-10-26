// Consolidated drawing-side regression: painting, selection, board gap, drafts, chips, sizes.
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:1180,height:820}, deviceScaleFactor:2 });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(name, ok, got)=>{ console.log((ok?'ok  ':'FAIL')+' '+name+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(name); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>localStorage.clear()); await page.reload(); await page.waitForTimeout(700);
const openAll = () => page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await openAll();
const at = (x,y) => page.evaluate(([x,y])=>{ const r=preview.getBoundingClientRect(); return { X: r.left+(x+0.5)*r.width/gw, Y: r.top+(y+0.5)*r.height/gh }; }, [x,y]);
const drag = async (pts) => { const a=await at(...pts[0]); await page.mouse.move(a.X,a.Y); await page.mouse.down();
  for (const p of pts.slice(1)) { const c=await at(...p); await page.mouse.move(c.X,c.Y); } await page.mouse.up(); await page.waitForTimeout(120); };
const tool = t => page.locator(`#drawtools button[data-tool="${t}"]`).click();
const row = y => page.evaluate(y=>{ let s=''; for(let x=0;x<gw;x++) s+= grid[y*gw+x]===-1?'.':'#'; return s; }, y);
const beads = () => page.evaluate(()=>grid.reduce((a,v)=>a+(v!==-1),0));
const reset = () => page.evaluate(()=>{ design.cells.fill(-1); design.mask.fill(0); design.sel.fill(0); undoStack=[]; redoStack=[]; designChanged(); });

// ---- sizes menu
await page.click('#newdesign'); await page.waitForTimeout(150);
const menu = await page.evaluate(()=>[...newsizes.querySelectorAll('.quick')].map(q=>[...q.children].map(b=>b.textContent).join(',')));
check('size menu: free sizes + board sizes', menu[0]==='16 × 16,24 × 24,32 × 32,48 × 48,64 × 64' && menu[1]==='52 × 52,78 × 78,104 × 104', menu);
await page.locator('#newsizes button', { hasText: '16 × 16' }).click(); await page.waitForTimeout(300); await openAll();
check('new 16x16 in design mode', await page.evaluate(()=>design && design.w===16 && pen.tool==='pencil' && document.querySelector('[data-sec="pattern"]').hidden), null);

// ---- painting
await drag([[1,1],[12,1]]);
check('fast swipe draws a continuous line', (await row(1)) === '.############...', await row(1));
await page.click('#pm-x'); await drag([[2,3]]); await page.click('#pm-x');
check('mirror left/right', (await row(3)) === '..#..........#..', await row(3));
await page.evaluate(()=>setPenColor(CODES.indexOf('A5')));
for (const [a,c] of [[[4,6],[10,6]],[[4,10],[10,10]],[[4,6],[4,10]],[[10,6],[10,10]]]) await drag([a,c]);
await tool('mask'); await drag([[7,6]]);
await tool('fill'); await page.evaluate(()=>setPenColor(CODES.indexOf('E6'), true)); await drag([[7,8]]);
check('fill stays inside, masked peg is a wall', (await row(5)) === '................' && (await row(8)) === '....#######.....', [await row(5), await row(8)]);
await tool('pencil'); await drag([[7,6]]);
check('masked peg cannot be painted', await page.evaluate(()=>grid[6*gw+7]===-1), null);
const before = await row(8); await page.click('#pu-undo'); await page.waitForTimeout(120);
check('undo responds on first press (no-op strokes dropped)', (await row(8)) !== before, await row(8));
await page.click('#pu-redo'); await page.waitForTimeout(120);
await tool('pick'); await drag([[7,8]]);
check('eyedropper picks and returns to pencil', await page.evaluate(()=>CODES[pen.color]==='E6' && pen.tool==='pencil'), null);
await tool('pencil'); await page.locator('#drawtools button[data-tool="pencil"]').click();
check('tapping the active tool keeps it while designing', await page.evaluate(()=>pen.tool==='pencil'), null);
const pre13 = await row(13);
await page.evaluate(async ()=>{ const r=preview.getBoundingClientRect(), c=r.width/gw;
  const ev=(el,t,id,x,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,pointerType:'touch'}));
  const X=r.left+2.5*c, Y=r.top+13.5*c; ev(preview,'pointerdown',41,X,Y); ev(preview,'pointermove',41,X+6*c,Y);
  ev(stage,'pointerdown',42,X+100,Y+100); ev(stage,'pointerup',41,X,Y); ev(stage,'pointerup',42,X,Y); });
await page.waitForTimeout(200);
check('second finger cancels the stroke', (await row(13)) === pre13, await row(13));

// ---- brush, opacity, softness, selection
await page.evaluate(()=>newBlankDesign(24,24)); await page.waitForTimeout(250); await openAll();
const sizes=[]; for (const n of [1,2,3,4,5]) { await reset(); await page.evaluate(n=>{ pen.size=n; pen.opacity=100; pen.soft=0; pen.tool='pencil'; syncDrawUI(); }, n); await drag([[10,10]]); sizes.push(await beads()); }
check('brush footprints 1/4/9/12/21', sizes.join()==='1,4,9,12,21', sizes);
await page.evaluate(()=>{ pen.size=1; });
await reset(); await page.evaluate(()=>{ for(let x=2;x<20;x++) design.cells[5*24+x]=CODES.indexOf('H2'); designChanged(); }); await page.waitForTimeout(120);
await page.evaluate(()=>{ pen.color=CODES.indexOf('F2'); pen.opacity=40; pen.blend='mix'; pen.tool='pencil'; syncDrawUI(); });
await drag([[2,5],[10,5],[2,5],[10,5]]); const one = await page.evaluate(()=>grid[5*gw+4]);
await drag([[2,5],[10,5]]); const two = await page.evaluate(()=>grid[5*gw+4]);
check('Mix: once per stroke, builds across strokes', one !== two && one !== await page.evaluate(()=>CODES.indexOf('H2')), [one,two]);
await reset(); await page.evaluate(()=>{ pen.blend='dither'; pen.opacity=50; pen.color=CODES.indexOf('C5'); pen.tool='select'; pen.selMode='box'; syncDrawUI(); });
await drag([[0,0],[7,7]]); await page.locator('#selacts button[data-act="fill"]').click(); await page.waitForTimeout(120);
check('Dither 50% fills half of a selection', (await beads()) === 32, await beads());
await page.evaluate(()=>{ pen.opacity=100; pen.tool='pencil'; pen.color=CODES.indexOf('A5'); syncDrawUI(); });
await drag([[3,10],[3,3],[12,3]]);
check('painting stays inside the selection', await page.evaluate(()=>{ let n=0; for(let y=0;y<gh;y++)for(let x=0;x<gw;x++) if(grid[y*gw+x]===CODES.indexOf('A5')&&(x>7||y>7)) n++; return n; }) === 0, null);
await tool('move'); await drag([[2,2],[12,2]]);
check('move the selection', await page.evaluate(()=>{ const b=selBounds(); return b.x0===10 && b.x1===17; }), null);
await reset(); await page.evaluate(()=>{ const c=CODES.indexOf('E6'); for (const [x,y] of [[2,2],[2,3],[2,4],[3,4],[4,4]]) design.cells[y*24+x]=c; for(let y=2;y<=4;y++)for(let x=2;x<=4;x++) design.sel[y*24+x]=1; designChanged(); });
await page.waitForTimeout(120);
const shape = () => page.evaluate(()=>{ const b=selBounds(); let s=''; for(let y=b.y0;y<=b.y1;y++){ for(let x=b.x0;x<=b.x1;x++) s+= grid[y*gw+x]!==-1?'#':'.'; s+='/'; } return s; });
await page.locator('#selacts button[data-act="flipx"]').click(); await page.waitForTimeout(100); const f1 = await shape();
await page.locator('#selacts button[data-act="rot"]').click(); await page.waitForTimeout(100); const r1 = await shape();
check('flip and rotate a selection', f1==='..#/..#/###/' && r1==='#../#../###/', [f1,r1]);
await page.locator('#selacts button[data-act="dup"]').click(); await page.waitForTimeout(100);
check('duplicate copies and switches to Move', (await beads())===10 && await page.evaluate(()=>pen.tool==='move'), await beads());
await reset(); await page.evaluate(()=>{ const a=CODES.indexOf('B3'); for(let x=0;x<6;x++){ design.cells[24+x]=a; design.cells[72+x]=a; } designChanged(); }); await page.waitForTimeout(120);
await page.evaluate(()=>{ pen.tool='select'; pen.selMode='color'; pen.selOp='replace'; syncDrawUI(); }); await drag([[1,1]]);
const r6 = await page.evaluate(()=>design.selN); await page.evaluate(()=>{ pen.selOp='add'; }); await drag([[1,3]]);
check('same-color select, then add', r6===6 && await page.evaluate(()=>design.selN)===12, r6);
await reset(); await page.evaluate(()=>{ pen.tool='pencil'; pen.size=8; pen.soft=50; pen.blend='dither'; pen.color=CODES.indexOf('C5'); syncDrawUI(); }); await drag([[12,12]]);
check('soft brush: solid core, scattered rim', await page.evaluate(()=>{ const core=[[11,11],[12,11],[11,12],[12,12]].every(([x,y])=>grid[y*gw+x]!==-1); let rim=0, rimOn=0; for(const [dx,dy,d] of brushOffsets(8)) if(d>0.8){ rim++; if(grid[(12+dy)*gw+12+dx]!==-1) rimOn++; } return core && rimOn>0 && rimOn<rim; }), null);
await page.evaluate(()=>{ pen.size=1; pen.soft=0; pen.opacity=100; });

// ---- chips
await page.evaluate(()=>{ pen.pickMode='fam'; setPenColor(CODES.indexOf('H7')); });
check('families cover all 221 beads in 10 groups', await page.evaluate(()=>{ const n={}; for(let i=0;i<CODES.length;i++) n[familyOf(i)]=1; return Object.keys(n).length===10; }), null);
await page.locator('#famdots button[data-fam="blues"]').click(); await page.waitForTimeout(80);
check('browsing a family keeps the color', await page.evaluate(()=>famCur==='blues' && CODES[pen.color]==='H7'), null);
await page.locator('#famchips button').nth(3).click(); await page.waitForTimeout(80);
check('tapping a chip sets and marks it', await page.evaluate(()=>famchips.querySelector('[data-cur="1"]')?.textContent===CODES[pen.color]), null);
await page.evaluate(()=>setPenColor(CODES.indexOf('B5')));
check('chips follow a color picked elsewhere', await page.evaluate(()=>famCur==='greens'), null);

// ---- board: masks are empty, gap switch, stacking
await page.evaluate(()=>{ newBlankDesign(16,16); const A=CODES.indexOf('A5'); for(let y=2;y<6;y++)for(let x=2;x<8;x++) design.cells[y*16+x]=A; design.mask[3*16+9]=1; designChanged(); });
await page.waitForTimeout(250); await openAll(); await page.fill('#libname','Tag'); await page.click('#libsave'); await page.waitForTimeout(200);
await page.click('#tab-board'); await page.waitForTimeout(200); await openAll();
await page.locator('#liblist li').first().locator('.lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(200);
const D = `({ lib:'t', x:0, y:0, rot:0, flip:false, w:1, h:1, cells:Int32Array.from([CODES.indexOf('H7')]) })`;
check('masked peg is empty on the board; beads keep the gap', await page.evaluate(d=>{ const pl=placed[0], o=eval(d); return fits(o, pl.x+pl.w-1, pl.y+1, -1) && !fits(o, pl.x+pl.w-2, pl.y, -1); }, D), null);
if (await page.evaluate(()=>boardGap)) await page.click('#boardgap'); await page.waitForTimeout(100);
check('gap off allows overlap', await page.evaluate(d=>{ const pl=placed[0]; return fits(eval(d), pl.x+1, pl.y, -1); }, D), null);
await page.locator('#liblist li').first().locator('.lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(200);
await page.evaluate(()=>{ placed[1].x = placed[0].x + 2; placed[1].y = placed[0].y; placed[0].cells = placed[0].cells.map(v=>v===-1?-1:CODES.indexOf('F5')); drawBoard(); });
const pt = await page.evaluate(()=>{ const r=boardcv.getBoundingClientRect(), {W,H}=boardDims(), pl=placed[0]; return { X: r.left+(pl.x+0.5)*r.width/W, Y: r.top+(pl.y+0.5)*r.height/H }; });
await page.mouse.click(pt.X, pt.Y); await page.waitForTimeout(150);
check('touched design comes to the top', await page.evaluate(()=>{ const {cells,W}=boardGrid(); const t=placed[placed.length-1]; return CODES[cells[t.y*W+t.x+3]]==='F5'; }), null);
await page.click('#boardgap'); await page.waitForTimeout(120);
check('gap back on flags crowding', await page.evaluate(()=>/Auto-arrange/.test(bmsg.textContent)), null);
await page.click('#bt-pack'); await page.waitForTimeout(200);
check('auto-arrange spaces them out', await page.evaluate(()=>placed.every((pl,i)=>fits(pl,pl.x,pl.y,i))), null);

// ---- drafts
await page.click('#tab-preview').catch(()=>{}); await page.evaluate(()=>setView('preview'));
await page.locator('#liblist li').first().locator('.lact', { hasText: 'Open' }).click(); await page.waitForTimeout(300);
await page.evaluate(()=>{ pushUndo(); design.cells[0]=CODES.indexOf('C9'); designChanged(); }); await page.waitForTimeout(600);
await page.evaluate(()=>newBlankDesign(24,24)); await page.waitForTimeout(600);
await page.reload(); await page.waitForTimeout(900);
check('New blank, close, reopen: start screen', await page.evaluate(()=>design===null), null);
await page.evaluate(()=>{ newBlankDesign(24,24); pushUndo(); design.cells[30]=CODES.indexOf('F5'); designChanged(); }); await page.waitForTimeout(600);
await page.reload(); await page.waitForTimeout(900);
check('drawing survives a reopen', await page.evaluate(()=>design && design.w===24 && beadTotal()===1), null);
await page.evaluate(()=>{ pushUndo(); design.cells.fill(-1); designChanged(); }); await page.waitForTimeout(600);
await page.reload(); await page.waitForTimeout(900);
check('cleared canvas is not restored', await page.evaluate(()=>design===null), null);

console.log(`\n${fails.length ? fails.length+' FAILED: '+fails.join('; ') : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
