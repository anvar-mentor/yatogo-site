'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {createServer}=require('../scripts/preview.cjs');
const output=path.resolve(process.env.TEST_OUTPUT_DIR||'test-results/privacy');
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  for(const width of [390,1440])for(const lang of ['ru','uz','en']){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
   await page.goto(base+'/privacy/?lang='+lang,{waitUntil:'networkidle'});
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('.policy-lang:visible').count(),1);
   assert.equal(await page.locator('.policy-lang:visible h1').count(),1);
   assert.equal(await page.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('[data-lang-link="'+lang+'"]').evaluate(x=>getComputedStyle(x).backgroundColor),'rgb(11, 122, 91)');
   assert.equal(new URL(await page.locator('[data-home]').first().getAttribute('href'),base).pathname,'/');
   assert.deepEqual(errors,[]);
   if(width===390||lang==='ru')await page.screenshot({path:path.join(output,lang+'-'+width+'.png'),fullPage:true});
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:900}});await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));
  const page=await ctx.newPage();await page.goto(base+'/?lang=en');
  assert.equal(await page.locator('#leadForm [data-privacy-link]').getAttribute('href'),'/privacy/?lang=en');
  assert.equal(await page.locator('.footer [data-privacy-link]').getAttribute('href'),'/privacy/?lang=en');
  await page.locator('#langBtn').click();await page.locator('[data-lang="uz"]').click();
  assert.equal(await page.locator('#leadForm [data-privacy-link]').getAttribute('href'),'/privacy/?lang=uz');
  await ctx.close();
  console.log('Privacy page and language-aware links passed at 390px and 1440px.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
}
run().catch(e=>{console.error(e);process.exitCode=1});
