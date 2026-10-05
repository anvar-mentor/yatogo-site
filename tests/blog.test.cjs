'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('../scripts/preview.cjs');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pages=[
  ['blog/index.html','https://yatogo.ru/blog/'],
  ['blog/otkryt-ooo-v-uzbekistane/index.html','https://yatogo.ru/blog/otkryt-ooo-v-uzbekistane/']
];

test('blog pages have complete indexable metadata and valid schema',()=>{
  for(const [file,canonical] of pages){
    const html=read(file);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,file+' must have one H1');
    assert.ok(html.includes('<html lang="ru">'));
    assert.ok(html.includes('<meta name="robots" content="index,follow,max-image-preview:large">'));
    assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'));
    assert.ok(html.includes('<meta property="og:url" content="'+canonical+'">'));
    assert.ok(!/TODO|article-1|post-1/.test(html));
    const schemas=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
    assert.ok(schemas.length>0);
    assert.ok(JSON.stringify(schemas).includes('https://yatogo.ru/#organization'));
  }
});

test('article has visible breadcrumbs, matched FAQ schema, sources and CTA',()=>{
  const html=read('blog/otkryt-ooo-v-uzbekistane/index.html');
  assert.ok(html.includes('"@type":"BlogPosting"'));
  assert.ok(html.includes('"@type":"BreadcrumbList"'));
  assert.ok(html.includes('"@type":"FAQPage"'));
  assert.equal((html.match(/<details>/g)||[]).length,8);
  assert.equal((html.match(/"@type":"Question"/g)||[]).length,8);
  assert.ok(html.includes('https://lex.uz/docs/18793?twolang=1'));
  assert.ok(html.includes('https://my.gov.uz/ru/static/jshshir-for-foreigners'));
  assert.ok(html.includes('data-metrika-goal="cta_apply_click"'));
  assert.ok(html.includes('от 2 рабочих дней'));
  assert.ok(html.includes('Индивидуальный расчёт'));
});

test('sitemap and main pages expose the blog and current contacts',()=>{
  const sitemap=read('sitemap.xml');
  for(const [,url] of pages)assert.ok(sitemap.includes('<loc>'+url+'</loc>'));
  for(const file of ['index.html','seo/uz.html','seo/en.html']){
    const html=read(file);
    assert.ok(html.includes('href="/blog/"'));
    assert.ok(html.includes('https://t.me/infoyatogo'));
    assert.ok(html.includes('https://wa.me/998501113939'));
    assert.ok(html.includes('tel:+998501113939'));
    assert.ok(html.includes('info.yatogo@gmail.com'));
  }
});

test('preview serves clean blog URLs and keeps missing articles as 404',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const base='http://127.0.0.1:'+server.address().port;
    for(const route of ['/blog/','/blog/otkryt-ooo-v-uzbekistane/']){
      const response=await fetch(base+route);assert.equal(response.status,200,route);
      assert.ok((await response.text()).includes('<html lang="ru">'));
    }
    assert.equal((await fetch(base+'/blog/ne-sushchestvuet/')).status,404);
  }finally{await new Promise(resolve=>server.close(resolve))}
});
