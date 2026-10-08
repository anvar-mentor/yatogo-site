'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {createServer}=require('../scripts/preview.cjs');
const output=process.env.TEST_OUTPUT_DIR||'test-results';
(async()=>{fs.mkdirSync(output,{recursive:true});const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [320,390,1440])for(const lang of ['ru','uz','en']){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.open=url=>{window.__requestMessage=url;return null;});await p.goto('http://127.0.0.1:'+server.address().port+'/?lang='+lang);
 const visibleField=id=>p.locator(id).evaluate(e=>!e.closest('.field').hidden);
 await p.locator('#f-name').fill('Context Test');await p.locator('#f-phone').fill('@context_test');
 for(const i of [0,1,1,1])await p.locator('[data-launch-option="'+i+'"]').click();await p.locator('[data-launch-discuss]').click();
 assert.equal(await visibleField('#f-service'),false);assert.equal(await visibleField('#f-plan'),true);assert.equal(await p.locator('#f-plan').inputValue(),'Business');assert.equal(await p.locator('#f-name').inputValue(),'Context Test');assert.ok((await p.locator('#f-comment').inputValue()).includes(await p.evaluate(()=>window.I18N[document.documentElement.lang]['launch.q0'])));
 if(lang==='ru'&&width!==320){await p.locator('#f-name').fill('');await p.locator('#f-phone').fill('');await p.locator('#planDialog').screenshot({path:path.join(output,'launch-form-'+width+'.png')});}
 await p.locator('[data-close-plan]').click();assert.equal(await visibleField('#f-service'),true);assert.equal(await p.locator('#f-service').isDisabled(),false);
 await p.locator('[data-service="ip"]').click();assert.equal(await p.locator('#planDialog').evaluate(e=>e.open),true);assert.equal(await visibleField('#f-service'),true);assert.equal(await p.locator('#f-service').isVisible(),false);assert.equal(await p.locator('#f-service-fixed').isVisible(),true);assert.equal(await p.locator('#f-service-fixed').getAttribute('readonly'),'');assert.equal(await p.locator('#f-service').inputValue(),'ip');assert.equal(await visibleField('#f-plan'),false);assert.equal(await p.locator('#f-plan').inputValue(),'');assert.equal(await p.locator('#f-comment').inputValue(),'');
 if(lang==='ru'&&width!==320)await p.locator('#planDialog').screenshot({path:path.join(output,'ip-form-'+width+'.png')});
 await p.locator('#f-name').fill('Context Test');await p.locator('#f-phone').fill('@context_test');await p.locator('#f-consent').check();await p.locator('.form__submit').click();
 const msg=decodeURIComponent(await p.evaluate(()=>window.__requestMessage));assert.ok(msg.includes(await p.evaluate(()=>window.I18N[document.documentElement.lang]['form.service.ip'])));assert.ok(!msg.includes('Business'));await p.waitForTimeout(30);assert.equal(await p.locator('#f-service').inputValue(),'ip');
 await p.locator('[data-close-plan]').click();assert.equal(await p.locator('#f-service').isVisible(),true);assert.equal(await visibleField('#f-plan'),true);assert.equal(await p.locator('#f-plan').isDisabled(),false);
 await p.locator('[data-plan="Premium"]').first().click();assert.equal(await visibleField('#f-service'),true);assert.equal(await visibleField('#f-plan'),true);assert.equal(await p.locator('#f-plan').inputValue(),'Premium');await p.locator('[data-close-plan]').click();
 assert.equal(await p.locator('[data-i18n="charter.kicker"]').count(),0);assert.equal(await p.locator('#docs').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS request contexts',width,lang);await ctx.close();
}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
