import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:900,height:1100}});
page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
page.on('dialog', d=>d.accept('T'));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.click('#sample'); await page.waitForTimeout(600);
await page.evaluate(()=>{const s=document.getElementById('w');s.value=16;s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'));});
await page.waitForTimeout(500);
await page.click('#libsave'); await page.waitForTimeout(400);
await page.evaluate(()=>{ addToBoard(library[0]); addToBoard(library[0]); });
await page.waitForTimeout(500);
await page.evaluate(()=>boardcv.scrollIntoView({block:'center'}));
const g = await page.evaluate(()=>{const r=boardcv.getBoundingClientRect();return{x:r.left,y:r.top,cell:boardCell};});
console.log('two placed:', await page.evaluate(()=>placed.map(p=>`${p.w}x${p.h}@${p.x},${p.y}`).join(' | ')));

// drag #2 so it passes OVER #1 and lands in clear space beyond
const st = await page.evaluate(()=>({x:placed[1].x,y:placed[1].y}));
await page.mouse.move(g.x + (st.x+2.5)*g.cell, g.y + (st.y+2.5)*g.cell);
await page.mouse.down();
// pass directly over design 0
await page.mouse.move(g.x + 4.5*g.cell, g.y + 4.5*g.cell, {steps:10});
console.log('over #1 -> flagged bad:', await page.evaluate(()=>dragBad));
// continue to clear space low on the board
await page.mouse.move(g.x + 8.5*g.cell, g.y + 36.5*g.cell, {steps:12});
console.log('clear   -> flagged bad:', await page.evaluate(()=>dragBad));
await page.mouse.up(); await page.waitForTimeout(300);
console.log('landed at:', await page.evaluate(()=>`${placed[1].x},${placed[1].y}`), '| msg:', await page.evaluate(()=>document.getElementById('bmsg').textContent));

// now drag it to an illegal spot and release — must snap back
const now = await page.evaluate(()=>({x:placed[1].x,y:placed[1].y}));
await page.mouse.move(g.x + (now.x+2.5)*g.cell, g.y + (now.y+2.5)*g.cell);
await page.mouse.down();
await page.mouse.move(g.x + 3.5*g.cell, g.y + 3.5*g.cell, {steps:12});
await page.mouse.up(); await page.waitForTimeout(300);
console.log('illegal release ->', await page.evaluate(()=>`${placed[1].x},${placed[1].y}`), '| msg:', await page.evaluate(()=>document.getElementById('bmsg').textContent));
console.log('gap intact:', await page.evaluate(()=>{
  const bs=boardSize(); const own=new Int32Array(bs*bs).fill(-1);
  placed.forEach((pl,i)=>{for(let y=0;y<pl.h;y++)for(let x=0;x<pl.w;x++) if(pl.cells[y*pl.w+x]!==-1) own[(pl.y+y)*bs+(pl.x+x)]=i;});
  for(let y=0;y<bs;y++)for(let x=0;x<bs;x++){const a=own[y*bs+x]; if(a<0)continue;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=bs||ny>=bs)continue; const c=own[ny*bs+nx]; if(c>=0&&c!==a) return false;}}
  return true; }));
await b.close();