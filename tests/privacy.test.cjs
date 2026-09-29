'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('../scripts/preview.cjs');
const root=path.resolve(__dirname,'..');

test('privacy page identifies the controller and contains three complete language versions',()=>{
 const html=fs.readFileSync(path.join(root,'privacy/index.html'),'utf8');
 assert.match(html,/ООО «YATOGO»/);
 assert.match(html,/«YATOGO» MChJ/);
 assert.match(html,/YATOGO LLC/);
 assert.match(html,/312412517/);
 assert.match(html,/info\.yatogo@gmail\.com/);
 assert.match(html,/Xorazm viloyati, Urganch shahar/);
 assert.equal((html.match(/class="policy-lang /g)||[]).length,3);
 assert.match(html,/113132820/);
 assert.match(html,/does not store an enquiry/);
});

test('main language documents link to the matching policy and expose no old contact placeholders',()=>{
 for(const [file,lang] of [['index.html','ru'],['seo/uz.html','uz'],['seo/en.html','en']]){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(html,new RegExp('data-privacy-link href="/privacy/\\?lang='+lang+'"'));
  assert.match(html,/mailto:info\.yatogo@gmail\.com/);
  assert.doesNotMatch(html,/info@yatogo\.ru|>г\. Ташкент<|>Toshkent shahri<|>Tashkent, Uzbekistan</);
 }
});

test('local server exposes the policy directory and keeps private deployment notes blocked',async t=>{
 const server=createServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const policy=await fetch(base+'/privacy/?lang=en');
 assert.equal(policy.status,200);
 assert.match(await policy.text(),/<article class="policy-lang policy-lang--en"/);
 assert.equal((await fetch(base+'/deploy/METRIKA.md')).status,404);
});
