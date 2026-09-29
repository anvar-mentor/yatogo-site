'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {createServer}=require('../scripts/preview.cjs');
const output=path.resolve(process.env.TEST_OUTPUT_DIR||'test-results');
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async options => {const c = await newContext(options); await c.route(/https:\/\//, r => r.fulfill({status:200,contentType:'application/javascript',body:''})); return c;};
 const results=[];
 try{
  for(const width of [320,390,768,1440])for(const lang of ['ru','uz','en']){
   const ctx=await browser.newContext({viewport:{width,height:900},locale:'en-US',reducedMotion:'reduce'});
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
   await page.addInitScript(()=>{window.open=(url)=>{window.__messageUrl=url;return null}});
   await page.goto(base+'/?lang='+lang,{waitUntil:'networkidle'});
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://yatogo.ru/'+(lang==='ru'?'':'?lang='+lang));
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,empty:[...document.querySelectorAll('[data-i18n]')].filter(x=>!x.textContent.trim()).map(x=>x.dataset.i18n),broken:[...document.querySelectorAll('a[href^="#"]')].filter(x=>!document.getElementById(x.hash.slice(1))).map(x=>x.hash),headings:[...document.querySelectorAll('h1,h2,h3,h4')].map(x=>[x.tagName,x.textContent])}));
   assert.equal(state.overflow,false);assert.deepEqual(state.empty,[]);assert.deepEqual(state.broken,[]);
   if(width===390||width===1440){await page.screenshot({path:path.join(output,lang+'-'+width+'-top.png')});}
   if(width<1320){await page.locator('#burger').click();assert.equal(await page.locator('#mobileNav').evaluate(x=>x.inert),false);await page.locator('#mobileNav a[href="#services"]').click();assert.equal(await page.locator('#burger').getAttribute('aria-expanded'),'false');}
   await page.locator('#langBtn').click();await page.locator('[data-lang="'+(lang==='en'?'uz':'en')+'"]').click();
   const switched=lang==='en'?'uz':'en';assert.equal(await page.locator('html').getAttribute('lang'),switched);
   const meta=await page.evaluate(()=>({title:document.title,og:document.querySelector('meta[property="og:title"]').content,twitter:document.querySelector('meta[name="twitter:title"]').content,desc:document.querySelector('meta[name="description"]').content,expected:window.I18N[document.documentElement.lang]['meta.desc']}));
   assert.equal(meta.title,meta.og);assert.equal(meta.title,meta.twitter);assert.equal(meta.desc,meta.expected);
   await page.locator('[data-service="ip"]').click();assert.equal(await page.locator('#f-service').inputValue(),'ip');
   await page.locator('.form__submit').click();assert.equal(await page.locator('#f-name').getAttribute('aria-invalid'),'true');
   await page.locator('#f-name').fill('SEO TEST');await page.locator('#f-phone').focus();await page.locator('#f-phone').fill('@seo_test');await page.locator('#f-consent').check();await page.locator('.form__submit').click();
   const message=await page.evaluate(()=>window.__messageUrl);assert.ok(message.startsWith('https://t.me/anwaryul?text='));assert.ok(decodeURIComponent(message).includes('SEO TEST'));
   await page.locator('[data-plan="Premium"]').first().click();assert.equal(await page.locator('#f-plan').inputValue(),'Premium');
   await page.locator('#faq details').nth(1).locator('summary').click();assert.equal(await page.locator('#faq details').nth(1).getAttribute('open'),'');
   for(let i=0;i<3;i++)await page.locator('.quiz__opt').first().click();assert.equal(await page.locator('[data-quiz="choose"]').count(),1);
   const max=Math.min(30000,await page.evaluate(()=>document.body.scrollHeight));for(let y=0;y<max;y+=800){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(20)}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width===390&&lang==='ru')await page.screenshot({path:path.join(output,'ru-390-full.png'),fullPage:true});
   assert.deepEqual(errors,[]);results.push({width,lang,passed:true});await ctx.close();console.log('PASS',width,lang);
  }
  for(const lang of ['ru','uz','en']){
   const ctx=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}}),page=await ctx.newPage();await page.goto(base+'/?lang='+lang);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.locator('#compareTable tbody tr').count(),17);assert.equal(await page.locator('#faq details').count(),7);assert.equal(await page.locator('.review:not([aria-hidden])').count(),20);
   assert.equal(await page.locator('.form__submit').isDisabled(),true);assert.equal(await page.locator('a[href="#"]').count(),0);
   assert.equal(await page.locator('.reveal').evaluateAll(xs=>xs.some(x=>getComputedStyle(x).opacity==='0')),false);
   await ctx.close();results.push({lang,noJS:true,passed:true});
  }
  const ctx=await browser.newContext({locale:'en-US'}),page=await ctx.newPage();await page.addInitScript(()=>localStorage.setItem('yatogo.lang','en'));await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('lang'),'ru');assert.equal(page.url(),base+'/');await ctx.close();
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(results,null,2));console.log('All browser regressions passed; no real messages sent.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
}
run().catch(e=>{console.error(e);process.exitCode=1});
