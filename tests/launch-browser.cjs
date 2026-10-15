const assert=require('node:assert/strict'),path=require('path'),fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const {createServer}=require('../scripts/preview.cjs');
(async()=>{const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});const output=process.env.TEST_OUTPUT_DIR||'test-results/launch';fs.mkdirSync(output,{recursive:true});try{
for(const width of [320,390,768,1440])for(const lang of ['ru','en','uz']){
 const ctx=await browser.newContext({viewport:{width,height:width===390?844:960},reducedMotion:'reduce'});await ctx.route(/https:\/\//,r=>r.fulfill({status:200,body:''}));const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/?lang='+lang);await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.locator('#launchTitle,.launch-intro,.launch-top').count(),0);assert.equal(await p.locator('[data-launch-option]').count(),4);
 if(lang==='ru'&&[390,1440].includes(width))await p.screenshot({path:path.join(output,'hero-'+width+'.png')});
 for(const [answers,keys] of [ [[0,0,0,1],['activity','documents','visit','ready']], [[1,1,1,0],['activity','foreign','remote','ready']], [[2,0,2,1],['activity','documents','visit','accounting']], [[2,1,0,0],['activity','foreign','remote','market']], [[3,1,3,2],['choose','foreign','format','ready']] ]){
  for(const i of answers)await p.locator('[data-launch-option="'+i+'"]').click();
  assert.equal(await p.locator('.launch-route li').count(),4);assert.equal(await p.locator('.launch-price,.launch-days').count(),0);
  const dict=await p.evaluate(()=>window.I18N[document.documentElement.lang]);assert.deepEqual(await p.locator('.launch-route li>b').allTextContents(),keys.map(k=>dict['launch.route.'+k]));
  const text=await p.locator('#launchBody').innerText();assert.ok(!/Classic|Business|Premium|\$|launch\./.test(text));assert.ok(text.includes(dict['launch.timing']));
  const link=new URL(await p.locator('[data-launch-discuss]').getAttribute('href'));assert.equal(link.hostname,'t.me');assert.equal(link.pathname,'/infoyatogo');const message=link.searchParams.get('text');
  for(let i=0;i<4;i++){assert.ok(message.includes(dict['launch.client'+i+'.'+answers[i]]));assert.ok(!message.includes(dict['launch.q'+i]));}
  assert.ok(message.startsWith(dict['launch.message']));assert.ok(message.endsWith(dict['launch.messageEnd']));assert.ok(!/Classic|Business|Premium|\$/.test(message));assert.equal(await p.locator('#planDialog').evaluate(e=>e.open),false);assert.equal(await p.locator('#f-comment').inputValue(),'');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(lang==='ru'&&[390,1440].includes(width)&&answers[0]===1){await p.locator('#launchBuilder').scrollIntoViewIfNeeded();await p.locator('#launchBuilder').screenshot({path:path.join(output,'result-'+width+'.png'),style:'.header{visibility:hidden}'});}
  await p.locator('[data-launch-restart]').click();assert.equal(await p.locator('[data-launch-option]').count(),4);
 }
 await p.locator('[data-launch-option="3"]').click();await p.locator('[data-launch-back]').click();assert.equal(await p.locator('[data-launch-option="3"]').getAttribute('aria-current'),'true');
 await p.locator('#langBtn').click();await p.locator('[data-lang="'+(lang==='en'?'uz':'en')+'"]').click();assert.equal(await p.locator('#launchQuestion').textContent(),await p.evaluate(()=>window.I18N[document.documentElement.lang]['launch.q0']));assert.deepEqual(errors,[]);
 console.log('PASS action plan',width,lang);await ctx.close();
}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
