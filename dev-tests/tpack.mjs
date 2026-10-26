import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820} });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(500); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.evaluate(()=>{ libpanel.open = true; });
const sprites = [['star2x','Star'],['flower','Flower'],['rocket','Rocket'],['cat','Cat'],['heart','Heart'],['star','Little star'],['cat2x','Big cat']];
for (const [f,n] of sprites) { await page.setInputFiles('#file',`/home/claude/sprites/${f}.png`); await page.waitForTimeout(450);
  await page.fill('#libname',n); await page.click('#libsave'); await page.waitForTimeout(150); }
await page.click('#tab-board'); await page.waitForTimeout(300);
const noOverlap = () => page.evaluate(()=>{
  const bs=boardSize(), own=new Int32Array(bs*bs).fill(-1);
  for (const [i,pl] of placed.entries()) for(let y=0;y<pl.h;y++)for(let x=0;x<pl.w;x++) if(pl.cells[y*pl.w+x]!==-1){
    const X=pl.x+x, Y=pl.y+y; if (X>=bs||Y>=bs) return 'OUT OF BOUNDS';
    if (own[Y*bs+X]>=0) return 'OVERLAP'; own[Y*bs+X]=i; }
  for(let y=0;y<bs;y++)for(let x=0;x<bs;x++){const a=own[y*bs+x]; if(a<0)continue;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=bs||ny>=bs)continue;
      const c=own[ny*bs+nx]; if(c>=0&&c!==a) return 'TOUCHING';}}
  return 'clean'; });

// six designs that do fit
for (let i=0;i<6;i++){ await page.locator('#liblist li').nth(i).click(); await page.waitForTimeout(120); }
await page.click('#bt-pack'); await page.waitForTimeout(300);
console.log('6 designs  :', await page.evaluate(()=>placed.length+' placed'), '|', await noOverlap(), '|', await page.evaluate(()=>bmsg.textContent||'(no message)'));
await page.evaluate(()=>{ selected=-1; drawBoard(); }); await page.locator('#boardcv').screenshot({path:'/tmp/packed.png'});

// add a 7th that can't fit: the layout must stay exactly as it was, and clean
const before = await page.evaluate(()=>placed.map(p=>`${p.x},${p.y}`).join(' '));
await page.locator('#liblist li').nth(6).click(); await page.waitForTimeout(200);
console.log('7th added  :', await page.evaluate(()=>placed.length+' placed'), '|', await page.evaluate(()=>bmsg.textContent));
await page.click('#bt-pack'); await page.waitForTimeout(300);
const after = await page.evaluate(()=>placed.slice(0,6).map(p=>`${p.x},${p.y}`).join(' '));
console.log('pack again :', after===before ? 'layout unchanged' : 'CHANGED', '|', await noOverlap(), '|', await page.evaluate(()=>bmsg.textContent||'(no message)'));
console.log('errors:', errs.length?errs:'none');
await b.close();