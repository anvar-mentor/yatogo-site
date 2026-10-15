'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');const {createServer}=require('../scripts/preview.cjs');
const output=path.resolve(process.env.TEST_OUTPUT_DIR||'test-results/news');
(async()=>{fs.mkdirSync(output,{recursive:true});const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});try{
for(const width of [320,390,768,1440]){
 const ctx=await b.newContext({viewport:{width,height:width===390?844:960},reducedMotion:'reduce'});await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(const lang of ['ru','uz','en']){await p.goto(base+'/?lang='+lang);assert.equal(await p.locator('html').getAttribute('lang'),lang);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const desktop=width>=1320;const group=p.locator(desktop?'.nav .nav-group':'#mobileNav .nav-group');if(!desktop)await p.locator('#burger').click();await group.locator('summary').click();assert.equal(await group.locator('a[href="#docs"]').isVisible(),true);if(lang==='ru'&&(width===390||width===1440))await p.screenshot({path:path.join(output,'menu-'+width+'.png')});await group.locator('a[href="#docs"]').click();assert.equal(await group.getAttribute('open'),null);if(!desktop)assert.equal(await p.locator('#burger').getAttribute('aria-expanded'),'false');
  if(lang==='ru'&&(width===390||width===1440)){await p.locator('#news').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollTo(0,document.getElementById('news').getBoundingClientRect().top+scrollY-90));await p.locator('#news img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await p.screenshot({path:path.join(output,'home-news-'+width+'.png')});await p.locator('#news').screenshot({path:path.join(output,'home-news-full-'+width+'.png')});}
 }
 for(const route of ['/news/','/news/novyy-tashkent-vozmozhnosti-dlya-biznesa/']){const r=await p.goto(base+route);assert.equal(r.status(),200);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await p.locator('img[src="/assets/news/novyy-tashkent-business.png"]').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth===1200)));
  if(width===390||width===1440)await p.screenshot({path:path.join(output,(route==='/news/'?'news-index-':'news-article-')+width+'.png')});
  if(route!=='/news/'){if(width===390||width===1440){await p.locator('#actions').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,'news-body-'+width+'.png')});}}
  if(width<1101){await p.locator('.news-mobile-menu>summary').click();assert.equal(await p.locator('.news-mobile-menu nav>a[href="/blog/"]').isVisible(),true);await p.locator('.news-mobile-menu>summary').click();}
 }
assert.deepEqual(errors,[]);await ctx.close();console.log('PASS news and navigation',width);
}
const ctx=await b.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const p=await ctx.newPage();await p.goto(base+'/');await p.goto(base+'/news/');await p.locator('.news-mobile-menu>summary').click();assert.equal(await p.locator('.news-mobile-menu nav>a[href="/blog/"]').isVisible(),true);await ctx.close();
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
