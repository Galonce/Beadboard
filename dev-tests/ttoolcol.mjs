import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const fails=[]; const check=(n,ok,got)=>{ console.log((ok?'ok  ':'FAIL')+' '+n+(ok?'':'  got: '+JSON.stringify(got))); if(!ok) fails.push(n); };
for (const [label, vw] of [['iPhone', {width:390,height:844}], ['iPad landscape', {width:1180,height:820}]]) {
  const ctx = await b.newContext({ viewport: vw, deviceScaleFactor:2, hasTouch:true, isMobile: label==='iPhone' });
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
  await page.evaluate(()=>{ localStorage.clear(); newBlankDesign(16,16); document.querySelectorAll('details.sec').forEach(d=>d.open = d.dataset.sec==='draw'); });
  await page.waitForTimeout(300);
  // bring the Draw card's top to the top of the panel
  await page.evaluate(()=>{ ctrl.scrollTop += drawpanel.getBoundingClientRect().top - ctrl.getBoundingClientRect().top; });
  await page.waitForTimeout(250);
  const s = await page.evaluate(()=>{ const c=document.querySelector('.toolcol'); return { colH: c.clientHeight, colScrollH: c.scrollHeight, panelH: ctrl.clientHeight, fades: c.className }; });
  console.log(`\n${label}:`, s);
  if (label === 'iPhone') {
    check('the column is shorter than its tools, so it scrolls', s.colScrollH > s.colH + 20 && s.colH <= s.panelH, s);
    check('a fade at the bottom shows there is more', /fade-b/.test(s.fades) && !/fade-t/.test(s.fades), s.fades);
    const panelTop = await page.evaluate(()=>ctrl.scrollTop);
    await page.evaluate(()=>{ const c=document.querySelector('.toolcol'); c.scrollTop = c.scrollHeight; });
    await page.waitForTimeout(200);
    const r = await page.evaluate(()=>{ const c=document.querySelector('.toolcol'), b=document.getElementById('pu-clear').getBoundingClientRect(), p=ctrl.getBoundingClientRect();
      return { clearVisible: b.top >= p.top && b.bottom <= p.bottom, panelScroll: ctrl.scrollTop, fades: c.className }; });
    check('scrolling the tools reaches the last one without moving the content', r.clearVisible && r.panelScroll === panelTop, r);
    check('…and the fade moves to the top', /fade-t/.test(r.fades) && !/fade-b/.test(r.fades), r.fades);
    // second finger mid-drag on the tools scrolls the tools
    await page.evaluate(()=>{ document.querySelector('.toolcol').scrollTop = 0; });
    const pv = await page.evaluate(()=>{ const r=preview.getBoundingClientRect(); return {x:r.left+20,y:r.top+20}; });
    await page.mouse.move(pv.x,pv.y); await page.mouse.down(); await page.mouse.move(pv.x+40,pv.y+5,{steps:2});
    const mid = await page.evaluate(()=>{ const c=document.querySelector('.toolcol'), t=c.querySelector('button'), r=t.getBoundingClientRect(), p0=ctrl.scrollTop;
      const ev=(type,y)=>t.dispatchEvent(new PointerEvent(type,{pointerId:55,pointerType:'touch',clientX:r.left+5,clientY:y,bubbles:true}));
      ev('pointerdown',r.top+200); ev('pointermove',r.top+120); ev('pointermove',r.top+40); ev('pointerup',r.top+40);
      return { col: c.scrollTop, panelMoved: ctrl.scrollTop !== p0 }; });
    await page.mouse.up();
    check('mid-drag, a second finger on the tools scrolls the tools only', mid.col >= 150 && !mid.panelMoved, mid);
  } else {
    check('iPad: with the card at the top, the whole column fits, no fades', s.colScrollH <= s.colH + 1 && !/fade/.test(s.fades), s);
    await page.evaluate(()=>{ ctrl.scrollTop = 0; }); await page.waitForTimeout(250);
    const low = await page.evaluate(()=>{ const c=document.querySelector('.toolcol'), b=document.getElementById('pu-clear').getBoundingClientRect(), p=ctrl.getBoundingClientRect(), cr=c.getBoundingClientRect();
      return { colBottomInside: cr.bottom <= p.bottom + 1, fades: c.className }; });
    check('iPad, card lower in the panel: the column still ends inside the panel', low.colBottomInside, low);
  }
  console.log('errors:', errs.length?errs:'none');
  await ctx.close();
}
console.log(`\n${fails.length ? fails.length+' FAILED' : 'all checks passed'}`);
await b.close();
