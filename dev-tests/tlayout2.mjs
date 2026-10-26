import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
for (const [label,w,h] of [['phone portrait',390,844],['phone landscape',844,390],['iPad portrait',820,1180],['iPad landscape',1180,820]]) {
  const page = await b.newPage({ viewport:{width:w,height:h} });
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(400); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
  await page.setInputFiles('#file','/tmp/offsheet.png'); await page.waitForTimeout(700);   // 2:1 wide image
  const r = await page.evaluate(()=>{
    const s=stage.getBoundingClientRect(), c=ctrl.getBoundingClientRect(), cv=preview.getBoundingClientRect();
    return { stage:`${Math.round(s.width)}x${Math.round(s.height)}`, square: Math.abs(s.width-s.height)<1,
      controls: c.left>=s.right-1?'right':'below', ctrlShare: Math.round(100*(c.left>=s.right-1? c.width/innerWidth : c.height/innerHeight))+'%',
      contentFills: Math.round(100*Math.max(cv.width/s.width, cv.height/s.height))+'%',
      pageScrolls: document.scrollingElement.scrollHeight>innerHeight+1 };
  });
  console.log(label.padEnd(16), JSON.stringify(r), errs.length?'ERR '+errs:'');
  await page.close();
}
await b.close();