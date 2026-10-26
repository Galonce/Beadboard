import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820}, deviceScaleFactor:2 });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.evaluate(()=>{ libpanel.open=true;
  library.push({id:'dSHARED',name:'Shared star',w:2,h:2,rle:'4:131'}); saveLibrary(); renderLibrary(); });
const state = () => page.evaluate(()=>({ designs: library.map(d=>d.name).join(', '), G9: toHex(RGB[CODES.indexOf('G9')]), checked: checked.size, msg: libmsg.textContent }));
console.log('before         ', await state());

// 1. default: designs only
await page.setInputFiles('#libfile','/tmp/other-device.json'); await page.waitForTimeout(400);
console.log('ask shows      ', await page.evaluate(()=>[...document.querySelectorAll('#libimportask .importopt')].map(o=>
  (o.querySelector('input').checked?'[x] ':'[ ] ') + (o.querySelector('input').disabled?'(locked) ':'') + o.innerText.replace(/\s+/g,' ').trim())));
await page.locator('#libimportask').screenshot({ path:'/tmp/importask.png' });
await page.locator('#libimportask .pick:not(.secondary)').click(); await page.waitForTimeout(300);
console.log('designs only   ', await state());

// 2. colors too, once unlocked
await page.evaluate(()=>{ parentUnlocked = true; });
await page.setInputFiles('#libfile','/tmp/other-device.json'); await page.waitForTimeout(400);
console.log('designs option ', await page.evaluate(()=>document.querySelector('#imp-designs').disabled ? 'disabled: none new' : 'enabled'));
await page.check('#imp-colors');
await page.locator('#libimportask .pick:not(.secondary)').click(); await page.waitForTimeout(400);
console.log('with colors    ', await state());

// 3. cancel changes nothing
await page.setInputFiles('#libfile','/tmp/other-device.json'); await page.waitForTimeout(300);
await page.locator('#libimportask .pick.secondary').click(); await page.waitForTimeout(200);
console.log('cancel hides   ', await page.evaluate(()=>libimportask.hidden));
console.log('errors:', errs.length?errs:'none');
await b.close();