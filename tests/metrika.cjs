'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const {createServer} = require('../scripts/preview.cjs');
async function run() {
  const server = createServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({channel:'msedge', headless:true});
  // Never load the real tag or send test conversions, leads or messages.
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async options => {const c = await newContext(options); await c.route(/https:\/\//, r => r.fulfill({status:200,contentType:'application/javascript',body:''})); return c;};
  const calls = p => p.evaluate(() => (window.ym.a || []).map(a => Array.from(a)));
  const goals = async p => (await calls(p)).filter(a => a[1] === 'reachGoal');
  async function fill(p) {
    await p.locator('#f-name').fill('TEST PRIVATE NAME');
    await p.locator('#f-phone').click();
    await p.locator('#f-phone').fill('@test_private');
    await p.locator('#f-comment').fill('TEST PRIVATE COMMENT');
    await p.locator('#f-consent').check();
  }
  try {
    for (const lang of ['ru','uz','en']) {
      const context = await browser.newContext({reducedMotion:'reduce', viewport:{width:1440,height:900}});
      const p = await context.newPage();
      await p.addInitScript(() => {window.open = u => {window.__opened = u; return null;};});
      await p.goto(base + '/?lang=' + lang);
      assert.equal((await calls(p)).filter(a => a[1] === 'init').length, 1);
      assert.equal((await calls(p)).filter(a => a[1] === 'hit').length, 0);
      assert.equal(await p.locator('script[src*="metrika/tag.js"]').count(), 1);
      assert.equal(await p.locator('script[src*="metrika/tag.js"]').evaluate(x => x.async), true);
      assert.equal(await p.locator('[data-metrika-goal]').count(), 4);
      assert.equal(await p.locator('.ym-disable-keys').count(), 3);
      assert.equal(await p.locator('[data-phone-link]').getAttribute('href'), 'tel:+998501113939');
      assert.equal(await p.locator('[data-tg-link]').evaluateAll(xs => xs.every(x => x.href === 'https://t.me/anwaryul')), true);
      assert.equal(await p.locator('[data-wa-link]').evaluateAll(xs => xs.every(x => x.href === 'https://wa.me/998501113939')), true);
      await p.locator('.header__cta').click();
      await p.locator('.hero__cta [data-metrika-goal]').click();
      await p.setViewportSize({width:390,height:900});
      await p.locator('#burger').click();
      await p.locator('#mobileNav [data-metrika-goal]').click();
      await p.locator('#services').scrollIntoViewIfNeeded();
      await p.locator('.mbar [data-metrika-goal]').click();
      assert.equal((await goals(p)).length, 4);
      await p.locator('.hero__cta [data-metrika-goal]').evaluate(x => x.click());
      assert.equal((await goals(p)).length, 4, 'synthetic click is not a conversion');
      const next = lang === 'en' ? 'uz' : 'en';
      await p.locator('#langBtn').click();
      await p.locator('[data-lang="' + next + '"]').click();
      assert.equal((await calls(p)).filter(a => a[1] === 'hit').length, 1);
      await p.locator('#langBtn').click();
      await p.locator('[data-lang="' + next + '"]').click();
      assert.equal((await calls(p)).filter(a => a[1] === 'hit').length, 1);
      await p.locator('.form__submit').click();
      assert.equal(await p.evaluate(() => window.__opened), undefined);
      await fill(p);
      await p.locator('.form__submit').click();
      assert.match(await p.evaluate(() => window.__opened), /^https:\/\/t.me\//);
      assert.equal((await goals(p)).length, 4, 'Telegram fallback is not a lead');
      assert.equal(JSON.stringify(await calls(p)).includes('TEST PRIVATE'), false);
      assert.equal(JSON.stringify(await calls(p)).includes('test_private'), false);
      // Counter unavailable or throwing must not prevent navigation.
      await p.evaluate(() => {window.ym = () => {throw new Error('blocked');};});
      await p.locator('.hero__cta [data-metrika-goal]').click();
      await p.evaluate(() => {delete window.ym;});
      await p.locator('.hero__cta [data-metrika-goal]').click();
      await context.close();
    }
    // Exercise the currently inactive API path entirely through mocks.
    const apiContext = await browser.newContext();
    const p = await apiContext.newPage();
    await p.route('**/site.config.js?*', r => {
      const config = fs.readFileSync(path.join(__dirname,'../site.config.js'),'utf8');
      return r.fulfill({contentType:'application/javascript', body:config.replace("leadEndpoint: ''", "leadEndpoint: '/mock-lead'")});
    });
    let requests = 0;
    let mode = 'pending';
    let pending;
    await p.route('**/mock-lead', async r => {
      requests++;
      if (mode === 'pending') {pending = r; return;}
      if (mode === 'network') return r.abort();
      return r.fulfill({status:mode === 'http' ? 500 : 200, contentType:'application/json', body:'{"success":false}'});
    });
    await p.goto(base);
    await fill(p);
    await p.evaluate(() => {const f=document.querySelector('#leadForm'); f.requestSubmit(); f.requestSubmit();});
    await p.waitForFunction(() => document.querySelector('.form__submit').disabled);
    while (!pending) await new Promise(r => setTimeout(r, 10));
    assert.equal(requests, 1);
    await pending.fulfill({status:200, contentType:'application/json', body:'{"success":true}'});
    await p.waitForFunction(() => !document.querySelector('.form__submit').disabled);
    assert.equal((await goals(p)).length, 0, 'no backend contract, no lead even on 2xx');
    for (mode of ['http','network','rejected']) {
      await fill(p);
      await p.locator('.form__submit').click();
      await p.waitForFunction(() => !document.querySelector('.form__submit').disabled);
      assert.equal((await goals(p)).length, 0);
      if (mode !== 'rejected') assert.equal(await p.locator('#formStatus').getAttribute('data-state'), 'error');
    }
    console.log('PASS: 3 languages, 4 CTA placements, single init/hit, private fields, fallback, duplicate submits, HTTP/network errors and blocked analytics. No live tracking sent.');
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
}
run().catch(e => {console.error(e); process.exitCode = 1;});
