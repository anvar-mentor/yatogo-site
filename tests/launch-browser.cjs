const assert=require('node:assert/strict'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const {createServer}=require('../scripts/preview.cjs');
(async()=>{const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [320,390,768,1440])for(const lang of ['ru','en','uz']){
const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/?lang='+lang);await p.evaluate(()=>document.fonts.ready);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await p.locator('[data-launch-option]').count(),4);
for(const [answers,plan,price,days] of [[[0,0,0,1],'Classic','650','10'],[[1,1,0,0],'Business','900','5'],[[2,0,2,2],'Premium','1 150','2']]){
for(const i of answers)await p.locator('[data-launch-option="'+i+'"]').click();assert.equal(await p.locator('#launchQuestion').textContent(),plan);assert.ok((await p.locator('.launch-price').textContent()).includes(price));assert.ok((await p.locator('.launch-days').textContent()).includes(days));assert.ok(!(await p.locator('.launch-days').textContent()).includes('plans.'));
await p.locator('[data-launch-discuss]').scrollIntoViewIfNeeded();const scroll=await p.evaluate(()=>scrollY);await p.locator('[data-launch-discuss]').click();assert.equal(await p.locator('#planDialog').evaluate(e=>e.open),true);assert.equal(await p.locator('#f-plan').inputValue(),plan);assert.ok((await p.locator('#f-comment').inputValue()).includes(await p.evaluate(()=>window.I18N[document.documentElement.lang]['launch.q0'])));await p.locator('[data-close-plan]').click();assert.equal(await p.evaluate(()=>scrollY),scroll);await p.locator('[data-launch-restart]').click();}
await p.locator('[data-launch-option="3"]').click();await p.locator('[data-launch-back]').click();assert.equal(await p.locator('[data-launch-option]').count(),4);
await p.locator('#langBtn').click();await p.locator('[data-lang="'+(lang==='en'?'uz':'en')+'"]').click();assert.equal(await p.locator('#launchQuestion').textContent(),await p.evaluate(()=>window.I18N[document.documentElement.lang]['launch.q0']));
await p.locator('#taxes summary').click();assert.equal(await p.locator('#taxes details').evaluate(e=>e.open),true);assert.deepEqual(errors,[]);
if(lang==='ru'&&(width===390||width===1440)){await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.screenshot({path:path.join(process.env.TEST_OUTPUT_DIR || __dirname,'implemented-hero-'+width+'.png')});await p.locator('#taxes').screenshot({path:path.join(process.env.TEST_OUTPUT_DIR || __dirname,'implemented-taxes-'+width+'.png')});}
console.log('PASS',width,lang);await ctx.close();}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
