import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath:'/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args:['--no-sandbox']});
const page = await b.newPage({ viewport:{width:1180,height:820}, deviceScaleFactor:2 });
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto('file:///mnt/user-data/outputs/beadboard.html'); await page.waitForTimeout(600); await page.evaluate(()=>document.querySelectorAll('details.sec').forEach(d=>d.open=true));
await page.evaluate(()=>{ libpanel.open=true; });

// save the cat, remember its exact beads
await page.setInputFiles('#file','/home/claude/sprites/cat.png'); await page.waitForTimeout(600);
await page.fill('#libname','Cat'); await page.click('#libsave'); await page.waitForTimeout(250);
const saved = await page.evaluate(()=>({ rle: library[0].rle, w: library[0].w, h: library[0].h }));

// + Board places it
await page.click('#tab-board'); await page.waitForTimeout(300);
await page.locator('#liblist li .lact', { hasText: '+ Board' }).click(); await page.waitForTimeout(300);
console.log('+ Board        ', await page.evaluate(()=>placed.length + ' on board'));

// load something else, then Open the cat from the library
await page.click('#sample'); await page.waitForTimeout(500);
await page.locator('#liblist li .lact', { hasText: 'Open' }).click(); await page.waitForTimeout(700);
const opened = await page.evaluate(()=>{ const t=tightBounds(grid,gw,gh); return { view, grid:`${gw}x${gh}`, rle: encodeCells(t.cells),
  banner: libediting.hidden ? 'hidden' : libeditingtext.textContent }; });
console.log('Open -> exact? ', opened.rle === saved.rle ? 'identical beads' : 'DIFFERENT', '| view', opened.view, '|', opened.grid);
console.log('banner         ', opened.banner);

// swap the orange body color for another, then save back
const before = await page.evaluate(()=>counts.map(([i,n])=>CODES[i]+':'+n).join(' '));
await page.locator('#list li').first().click(); await page.waitForTimeout(200);
const to = await page.evaluate(()=>document.querySelector('#swapnear button').textContent);
await page.locator('#swapnear button').first().click(); await page.waitForTimeout(400);
const after = await page.evaluate(()=>counts.map(([i,n])=>CODES[i]+':'+n).join(' '));
console.log('swap           ', before, '->', after, `(to ${to})`);
const boardBefore = await page.evaluate(()=>placed[0].cells.join(','));
await page.click('#libupdate'); await page.waitForTimeout(300);
console.log('save changes   ', await page.evaluate(()=>libmsg.textContent));
console.log('library updated', await page.evaluate((r)=>library[0].rle !== r, saved.rle));
console.log('board updated  ', await page.evaluate((bb)=>placed[0].cells.join(',') !== bb, boardBefore));

// board codes overlay
await page.click('#tab-board'); await page.waitForTimeout(300);
await page.check('#boardcodes'); await page.waitForTimeout(300);
await page.locator('#stage').screenshot({ path:'/tmp/boardcodes.png' });

// choosing a new image ends editing
await page.setInputFiles('#file','/home/claude/sprites/heart.png'); await page.waitForTimeout(600);
console.log('new image      ', await page.evaluate(()=>({ editing: editingLib, banner: libediting.hidden ? 'hidden' : 'shown' })));
console.log('errors:', errs.length?errs:'none');
await b.close();