import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args:['--no-sandbox']});
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(700);
await page.evaluate(()=>{ localStorage.clear(); document.querySelectorAll('details.sec').forEach(d=>d.open=true); });
const fail = m => console.log('FAILED', m);
const state = () => page.evaluate(()=>{
  const at=(x,y)=>grid[y*gw+x], code=i=>i===EMPTY?'-':CODES[i];
  return { size:gw+'x'+gh, body:code(at(6,6)), shadow:code(at(6,11)), glow:code(at(11,6)), speck:code(at(1,1)), bg:code(at(0,15)),
    box:!alphabox.hidden, info:ainfo.textContent, shadowHex: at(6,11)===EMPTY?null:hex(at(6,11)) };
});
// 1. default: 10% cutoff, own color
await page.setInputFiles('#file','/home/claude/sprites/alpha.png'); await page.waitForTimeout(900);
let s = await state(); console.log('default  ', s);
if (s.size!=='16x16') fail('size');
if (!s.box) fail('alpha controls hidden');
if (s.shadow==='-' || s.glow==='-') fail('faint pixels dropped');
if (s.speck!=='-' || s.bg!=='-') fail('too-faint or empty pixels got beads');
if (!/12 partly see-through pixels became beads · 1 too faint/.test(s.info)) fail('info '+s.info);
const lum = h => { const v=parseInt(h.slice(1),16); return ((v>>16)+(v>>8&255)+(v&255))/3; };
// own color: 50% black shadow stays black, 20% blue glow stays strong blue
if (lum(s.shadowHex) > 40) fail('own color: shadow should be black '+s.shadowHex);
const own = s;
// 1b. on white: shadow = black at 50% on white -> mid gray
await page.locator('#abg button').nth(1).tap(); await page.waitForTimeout(500);
s = await state(); console.log('on white ', s.shadow, s.shadowHex, s.glow);
if (!(lum(s.shadowHex)>90 && lum(s.shadowHex)<170)) fail('shadow not mid gray '+s.shadowHex);
if (s.glow === own.glow) fail('blend should lighten the glow');
// 2. black background -> shadow becomes black-ish
await page.locator('#abg button').nth(3).tap(); await page.waitForTimeout(500);
s = await state(); console.log('black bg ', s.shadow, s.shadowHex, s.glow);
if (lum(s.shadowHex) > 40) fail('shadow on black should be dark');
// 3. cutoff 30%: glow (20%) drops, shadow stays
await page.evaluate(()=>{ acut.value=30; acut.dispatchEvent(new Event('input')); acut.dispatchEvent(new Event('change')); }); await page.waitForTimeout(500);
s = await state(); console.log('cut 30%  ', s.shadow, s.glow, s.info);
if (s.glow!=='-' || s.shadow==='-') fail('cutoff');
// 4. persists across reload
await page.reload(); await page.waitForTimeout(700);
const kept = await page.evaluate(()=>({cut:aCut, bg:aBg}));
console.log('reload   ', kept); if (kept.cut!==30 || kept.bg!=='#000000') fail('persist');
// 5. custom color input
await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.setInputFiles('#file','/home/claude/sprites/alpha.png'); await page.waitForTimeout(900);
await page.evaluate(()=>{ const i=document.getElementById('abgpick'); i.value='#ffff00'; i.dispatchEvent(new Event('change')); }); await page.waitForTimeout(500);
s = await state(); if (s.shadowHex==='#000000') fail('custom color ignored'); console.log('yellow bg', s.shadowHex, await page.evaluate(()=>[...document.querySelectorAll('#abg [data-on]')].map(e=>e.dataset.on).join('')));
// 6. an opaque image hides the controls
await page.setInputFiles('#file','/home/claude/sprites/photo.png'); await page.waitForTimeout(1200);
if (await page.evaluate(()=>!alphabox.hidden)) fail('controls shown for opaque photo');
// screenshot of the controls
await page.evaluate(()=>{ localStorage.clear(); aCut=10; aBg='own'; });
await page.setInputFiles('#file','/home/claude/sprites/alpha.png'); await page.waitForTimeout(900);
await page.evaluate(()=>alphabox.scrollIntoView({block:'center'})); await page.waitForTimeout(300);
await page.screenshot({ path:'/tmp/alpha-ui.png' });
// 7. a fresh start defaults to own color
await page.evaluate(()=>localStorage.clear()); await page.reload(); await page.waitForTimeout(700);
if (await page.evaluate(()=>aBg) !== 'own') fail('default not own color');
console.log('errors:', errs.length?errs:'none');
await b.close();
