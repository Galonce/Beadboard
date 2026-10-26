import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(32,32); for (let p=0;p<1024;p++) design.cells[p]=CODES.indexOf('H7'); designChanged(); });
await page.setInputFiles('#reffile','/home/claude/refphoto.jpg'); await page.waitForTimeout(900);
// fit the photo, so it covers the canvas width; the sun sits upper right
await page.evaluate(()=>{ ref.s=1; ref.cx=16; ref.cy=16; drawPreview(); });
const tapAt = async (px,py) => { const r = await page.evaluate(([px,py])=>{ const b=preview.getBoundingClientRect(); return {X:b.left+px/gw*b.width, Y:b.top+py/gh*b.height}; }, [px,py]); await page.touchscreen.tap(r.X, r.Y); await page.waitForTimeout(150); };
const pick = async (px,py) => { await page.evaluate(()=>{ pen.tool='pick'; syncDrawUI(); }); await tapAt(px,py); return page.evaluate(()=>({ code: CODES[pen.color], tool: pen.tool, msg: msg.textContent })); };

// under the beads: the eyedropper still picks the bead
const under = await pick(23.2, 7.5);
check('reference underneath: picks the bead (H7)', under.code==='H7', under);
// on top: picks from the photo — sun is yellow, sky is blue, hill is green
await page.evaluate(()=>{ ref.top=true; syncDrawUI(); drawPreview(); });
const sun = await pick(23.5, 12), sky = await pick(4, 9), hill = await pick(6, 22);
const fam = c => page.evaluate(c=>familyOf(CODES.indexOf(c)), c);
check('on top: the sun picks a yellow', (await fam(sun.code))==='yellows' || (await fam(sun.code))==='oranges', sun);
check('on top: the sky picks a blue or purple', ['blues','purples'].includes(await fam(sky.code)), sky);
check('on top: the hill picks a green', (await fam(hill.code))==='greens', hill);
check('picking switches back to the pencil and says what it picked', sun.tool==='pencil' && /Picked .* reference/.test(sun.msg), sun);
check('on a flat area, matches what Turn into beads places', await page.evaluate(()=>{
  const W=32; const before=design.cells.slice(); pen.blend='mix'; $('refcull').value=0; $('refsmooth').checked=true;
  design.cells.fill(-1); refToBeads(); const placed=design.cells[22*W+6]; design.cells=before; designChanged();
  return CODES[placed]; }) === hill.code, hill.code);
// outside the image: falls back to the bead under the finger
await page.evaluate(()=>{ ref.s=0.5; ref.cx=8; ref.cy=8; drawPreview(); });
const outside = await pick(28, 28);
check('outside the image: picks the bead there', outside.code==='H7', outside);
// hidden: back to beads
await page.evaluate(()=>{ ref.s=1; ref.cx=16; ref.cy=16; ref.show=false; drawPreview(); });
check('reference hidden: picks the bead', (await pick(23.2,7.5)).code==='H7', null);
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
