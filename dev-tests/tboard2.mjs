import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:900,height:1100}, acceptDownloads:true });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('dialog', d => d.accept(d.defaultValue() || 'Design'));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));

// build and save three designs of different sizes
for (const [file, w] of [['/tmp/sprite_bg.png',24],['/mnt/user-data/uploads/IMG_3989.png',30],['/tmp/sprite_bg.png',16]]) {
  await page.setInputFiles('#file', file); await page.waitForTimeout(900);
  await page.evaluate(v=>{const s=document.getElementById('w');s.value=v;s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'));}, w);
  await page.waitForTimeout(500);
  await page.check('#bgedge'); await page.waitForTimeout(500);
  await page.click('#libsave'); await page.waitForTimeout(500);
}
console.log('library:', await page.evaluate(()=>library.map(d=>d.name+' '+d.w+'x'+d.h)));
console.log('persisted:', await page.evaluate(()=>!!localStorage.getItem('beadboard:library')));

// place all three
await page.evaluate(()=>{ for (const d of library) addToBoard(d); });
await page.waitForTimeout(600);
const stat = () => page.evaluate(()=>({
  items: placed.length,
  pos: placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' '),
  beads: document.getElementById('b-beads').textContent,
  cols: document.getElementById('b-cols').textContent
}));
console.log('placed  ', await stat());

// spacing rule: no two designs may touch, even diagonally
console.log('gap held:', await page.evaluate(()=>{
  const bs = boardSize(); const owner = new Int32Array(bs*bs).fill(-1);
  placed.forEach((pl,i)=>{ for(let y=0;y<pl.h;y++)for(let x=0;x<pl.w;x++){
    if(pl.cells[y*pl.w+x]!==-1) owner[(pl.y+y)*bs+(pl.x+x)]=i; }});
  for(let y=0;y<bs;y++)for(let x=0;x<bs;x++){
    const a=owner[y*bs+x]; if(a<0) continue;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=bs||ny>=bs) continue;
      const c=owner[ny*bs+nx]; if(c>=0 && c!==a) return false; }}
  return true;
}));

// rotate the first item
await page.evaluate(()=>{ selected = 0; });
const before = await page.evaluate(()=>`${placed[0].w}x${placed[0].h}`);
await page.click('#bt-rot'); await page.waitForTimeout(400);
console.log('rotate  ', before, '->', await page.evaluate(()=>`${placed[0].w}x${placed[0].h}`));

await page.click('#bt-pack'); await page.waitForTimeout(500);
console.log('packed  ', await stat());

const dl = page.waitForEvent('download',{timeout:20000});
await page.click('#bt-pdf'); const d = await dl; await d.saveAs('/tmp/boardout.pdf');
console.log('board pdf:', fs.statSync('/tmp/boardout.pdf').size, 'bytes');
await page.locator('#boardcv').screenshot({path:'/tmp/boardview.png'});
console.log('errors:', errs.length?errs:'none');
await b.close();