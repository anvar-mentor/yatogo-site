'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {render}=require('../scripts/build-seo.cjs');
const {createServer}=require('../scripts/preview.cjs');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
test('generated pages stay synchronized with translations and source assets',()=>{
 for(const lang of ['ru','uz','en']) assert.equal(read(lang==='ru'?'index.html':'seo/'+lang+'.html'),render(lang));
});
test('all languages have a single H1, their own canonical, metadata and valid JSON-LD',()=>{
 const c={window:{}};vm.runInNewContext(read('assets/js/i18n.js'),c);
 for(const lang of ['ru','uz','en']){
  const html=render(lang),dict=c.window.I18N[lang],url='https://yatogo.ru/'+(lang==='ru'?'':'?lang='+lang);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('<html lang="'+lang+'">'));
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'));
  assert.ok(html.includes(dict['hero.h1']));
  assert.ok(!html.includes('hreflang='));
  assert.ok(!/<[a-z][^>]*data-i18n="[^"]+"[^>]*>\s*<\//.test(html),'No empty translated content');
  assert.ok(!/href="#"/.test(html));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const x of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(x[1]),'Missing anchor '+x[1]);
  const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
  const page=schemas.find(x=>x['@type']==='WebPage');assert.equal(page.url,url);assert.equal(page.inLanguage,lang);assert.equal(page.name,dict['meta.title']);
  assert.ok(!JSON.stringify(schemas).includes('AggregateRating'));
 }
});
test('query URLs return complete translated HTML without JS, private targets and missing paths return 404',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const [query,lang] of [['','ru'],['?lang=ru','ru'],['?lang=en','en'],['?lang=uz','uz'],['?lang=invalid','ru'],['?utm_source=test&lang=en','en']]){
   const response=await fetch(base+'/'+query);assert.equal(response.status,200);assert.ok((await response.text()).includes('<html lang="'+lang+'">'));
  }
  for(const route of ['/missing-page','/seo/en.html','/.git/config','/deploy/nginx-site.conf.example'])assert.equal((await fetch(base+route)).status,404);
  const redirect=await fetch(base+'/index.html?lang=uz',{redirect:'manual'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),'/?lang=uz');
 }finally{await new Promise(r=>server.close(r))}
});
