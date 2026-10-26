import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(16,16); for (let p=0;p<256;p++) design.cells[p]=CODES.indexOf('H7'); designChanged(); });
await page.setInputFiles('#reffile','/home/claude/detail.png'); await page.waitForTimeout(800);
await page.evaluate(()=>{ ref.top=true; ref.smooth=true; ref.op=0.8; syncDrawUI(); drawPreview(); });
// screen position of an image pixel
const imgPt = (ix, iy) => page.evaluate(([ix,iy])=>{ const r=refRect(), b=preview.getBoundingClientRect(), W=ref.img.width, H=ref.img.height;
  const px=r.x0+(ix+0.5)/W*r.iw, py=r.y0+(iy+0.5)/H*r.ih; return { X:b.left+px/gw*b.width, Y:b.top+py/gh*b.height }; }, [ix,iy]);
const fam = () => page.evaluate(()=>familyOf(pen.color));
const pickTool = () => page.evaluate(()=>{ pen.tool='pick'; syncDrawUI(); });

// one peg here covers 25×25 image pixels; the red detail is 4×4
await pickTool(); let p = await imgPt(199.5, 199.5); await page.touchscreen.tap(p.X, p.Y); await page.waitForTimeout(120);
check('tap on a tiny red detail picks red (not the blue around it)', ['reds','pinks'].includes(await fam()), await page.evaluate(()=>CODES[pen.color]));
await pickTool(); p = await imgPt(100, 100); await page.touchscreen.tap(p.X, p.Y); await page.waitForTimeout(120);
check('tap on the blue field picks blue', (await fam())==='blues', await page.evaluate(()=>CODES[pen.color]));

// press on blue, slide onto the detail with the loupe, lift
await pickTool();
const a = await imgPt(150, 150), d = await imgPt(199.5, 199.5);
await page.mouse.move(a.X, a.Y); await page.mouse.down(); await page.waitForTimeout(60);
const l1 = await page.evaluate(()=>{ const l=document.querySelector('.loupe'); return { shown: l && l.style.display==='flex', code: l && l.querySelector('b').textContent }; });
await page.mouse.move(d.X, d.Y, { steps: 8 }); await page.waitForTimeout(60);
const l2 = await page.evaluate(()=>{ const l=document.querySelector('.loupe'), r=l.getBoundingClientRect(); return { shown: l.style.display==='flex', code: l.querySelector('b').textContent, aboveFinger: r.bottom < innerHeight }; });
const colorDuring = await page.evaluate(()=>pen.tool);
await page.mouse.up(); await page.waitForTimeout(120);
const l3 = await page.evaluate(()=>({ hidden: document.querySelector('.loupe').style.display==='none', code: CODES[pen.color], fam: familyOf(pen.color), tool: pen.tool }));
check('loupe appears on press, showing the bead under the finger', l1.shown && !!l1.code, l1);
check('sliding onto the detail updates the loupe', l2.shown && l2.code !== l1.code, { l1, l2 });
check('nothing is picked until you lift', colorDuring === 'pick', colorDuring);
check('lifting picks the detail color and hides the loupe', l3.hidden && ['reds','pinks'].includes(l3.fam) && l3.code === l2.code && l3.tool==='pencil', l3);

// a second finger cancels the aim
await pickTool(); const before = await page.evaluate(()=>pen.color);
await page.mouse.move(a.X, a.Y); await page.mouse.down(); await page.waitForTimeout(50);
await page.evaluate(()=>stage.dispatchEvent(new PointerEvent('pointerdown',{pointerId:42,clientX:10,clientY:10,bubbles:true,pointerType:'touch'}))); await page.waitForTimeout(50);
const cancelled = await page.evaluate(()=>({ hidden: document.querySelector('.loupe').style.display==='none', strokeGone: stroke===null }));
await page.evaluate(()=>stage.dispatchEvent(new PointerEvent('pointerup',{pointerId:42,clientX:10,clientY:10,bubbles:true,pointerType:'touch'})));
await page.mouse.up(); await page.waitForTimeout(80);
check('a second finger cancels: loupe gone, color unchanged', cancelled.hidden && cancelled.strokeGone && await page.evaluate(()=>pen.color)===before, cancelled);

// lifting outside the image picks the bead there
await page.evaluate(()=>{ ref.s=0.4; ref.cx=4; ref.cy=4; drawPreview(); pen.tool='pick'; syncDrawUI(); });
const in1 = await page.evaluate(()=>{ const b=preview.getBoundingClientRect(); return { X:b.left+4/gw*b.width, Y:b.top+4/gh*b.height, X2:b.left+13/gw*b.width, Y2:b.top+13/gh*b.height }; });
await page.mouse.move(in1.X, in1.Y); await page.mouse.down(); await page.mouse.move(in1.X2, in1.Y2, { steps: 6 });
const offImg = await page.evaluate(()=>document.querySelector('.loupe').style.display);
await page.mouse.up(); await page.waitForTimeout(100);
check('slid off the image: loupe hides, lift picks the bead there (H7)', offImg==='none' && await page.evaluate(()=>CODES[pen.color])==='H7', offImg);

// pixel art: the exact pixel, not a blend
await page.setInputFiles('#reffile','/home/claude/sprites/smiley.png'); await page.waitForTimeout(600);
await page.evaluate(()=>{ ref.top=true; ref.s=1; ref.cx=8; ref.cy=8; syncDrawUI(); drawPreview(); pen.tool='pick'; syncDrawUI(); });
p = await imgPt(3, 7); await page.touchscreen.tap(p.X, p.Y); await page.waitForTimeout(120);
check('pixel art: the one-pixel cheek picks its pink exactly', await page.evaluate(()=>{ const [L,a,b]=oklab(240,90,110); return pen.color===nearestLab(L,a,b); }), await page.evaluate(()=>CODES[pen.color]));
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'} | page errors: ${errs.length?errs:'none'}`);
await b.close();
