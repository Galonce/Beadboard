import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});

// Reproduce the real environment: an embedded viewer where pop-ups are blocked.
async function run(label, blockPopups, blockStorage){
  const ctx = await b.newContext({ viewport:{width:390,height:900} });
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.addInitScript(([bp, bs]) => {
    if (bp) { window.prompt = () => null; window.alert = () => {}; window.confirm = () => false; }
    if (bs) {
      const deny = () => { throw new DOMException('denied','SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get(){ return { getItem:deny, setItem:deny, removeItem:deny }; } });
    }
  }, [blockPopups, blockStorage]);
  await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
  await page.click('#sample'); await page.waitForTimeout(600);
  await page.click('#libsave'); await page.waitForTimeout(400);
  await page.fill('#libname', 'Dragon'); await page.press('#libname', 'Enter'); await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({
    saved: library.map(d=>d.name).join(', ') || 'none',
    listShows: document.getElementById('liblist').innerText.replace(/\s+/g,' ').trim().slice(0,60),
    msg: document.getElementById('libmsg').textContent
  }));
  console.log(label.padEnd(26), JSON.stringify(r), errs.length ? 'ERR '+errs : '');
  await ctx.close();
}
await run('popups blocked',           true,  false);
await run('popups + storage blocked', true,  true);
await b.close();