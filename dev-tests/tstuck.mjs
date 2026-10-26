import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820} });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(500); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.setInputFiles('#file','/tmp/offsheet.png'); await page.waitForTimeout(700);
const geo = () => page.evaluate(()=>{ const a=app.getBoundingClientRect(), s=stage.getBoundingClientRect();
  return { appTop: Math.round(a.top), appH: Math.round(a.height), stage:`${Math.round(s.width)}x${Math.round(s.height)}`, scrollY: Math.round(scrollY) }; });
console.log('normal                ', await geo());

// 1. iOS-style forced page scroll while a field is focused
await page.evaluate(()=>{ document.body.style.minHeight='200vh'; window.scrollTo(0,400); document.scrollingElement.scrollTop=400; });
console.log('forced scroll         ', await geo(), '(app must stay at top 0)');

// 2. keyboard: the visible area shrinks while typing, then comes back
await page.evaluate(()=>{ assheet.checked=true; assheet.dispatchEvent(new Event('change')); });
await page.waitForTimeout(300);
await page.focus('#fw');
await page.setViewportSize({width:1180,height:470}); await page.waitForTimeout(300);
console.log('keyboard up           ', await geo());
await page.evaluate(()=>document.activeElement.blur());
await page.setViewportSize({width:1180,height:820}); await page.waitForTimeout(400);
await page.evaluate(()=>{ document.body.style.minHeight=''; });
await page.waitForTimeout(300);
console.log('keyboard down, settled', await geo(), '(expect same as normal)');
console.log('errors:', errs.length?errs:'none');
await b.close();