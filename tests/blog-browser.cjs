'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {createServer}=require('../scripts/preview.cjs');
const output=path.resolve(process.env.TEST_OUTPUT_DIR||'test-results/blog');

async function run(){
  fs.mkdirSync(output,{recursive:true});
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  try{
    for(const width of [390,1440]){
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await context.route(/https:\/\//,route=>route.fulfill({status:200,body:''}));
      const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/blog/otkryt-ooo-v-uzbekistane/',{waitUntil:'networkidle'});
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('.facts .fact').count(),3);
      assert.equal(await page.locator('.faq details').count(),8);
      assert.equal(await page.locator('.toc a').count(),13);
      assert.equal(await page.locator('.cta-box a').getAttribute('href'),'/?#contact'.replace('?',''));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(output,'article-'+width+'-top.png')});
      await page.screenshot({path:path.join(output,'article-'+width+'.png'),fullPage:true});
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:390,height:900}});
    const page=await context.newPage();
    await page.goto(base+'/blog/',{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('.article-list .article-card').count(),2);
    assert.equal(await page.locator('.article-card').first().getAttribute('href'),'/blog/otkryt-ooo-v-uzbekistane/');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(output,'index-390.png'),fullPage:true});
    await context.close();
    console.log('Blog index and article passed at 390px and 1440px.');
  }finally{
    await browser.close();await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(error=>{console.error(error);process.exitCode=1});
