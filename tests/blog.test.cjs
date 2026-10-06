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
  ['blog/otkryt-ooo-v-uzbekistane/index.html','https://yatogo.ru/blog/otkryt-ooo-v-uzbekistane/'],
  ...require('../content/blog-articles.cjs').map(a=>['blog/'+a.slug+'/index.html','https://yatogo.ru/blog/'+a.slug+'/'])
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
  for(const [file] of pages.slice(1)){
    const html=read(file);
    assert.ok(html.includes('"@type":"BlogPosting"'),file);
    assert.ok(html.includes('"@type":"BreadcrumbList"'),file);
    assert.ok(html.includes('"@type":"FAQPage"'),file);
    const visible=(html.match(/<details>/g)||[]).length;
    assert.ok(visible>=6,file);
    assert.equal((html.match(/"@type":"Question"/g)||[]).length,visible,file);
    assert.ok(html.includes('data-metrika-goal="cta_apply_click"'),file);
    assert.ok(html.includes('от 2 рабочих дней'),file);
    assert.ok(html.includes('Официальные источники'),file);
  }
});

test('sitemap and main pages expose the blog and current contacts',()=>{
  const sitemap=read('sitemap.xml');
  for(const [,url] of pages)assert.ok(sitemap.includes('<loc>'+url+'</loc>'));
  for(const file of ['index.html','seo/uz.html','seo/en.html']){
    const html=read(file);
    assert.ok(html.includes('href="/blog/"'));
    assert.ok(html.includes('https://t.me/anwaryul'));
    assert.ok(html.includes('https://wa.me/998501113939'));
    assert.ok(html.includes('tel:+998501113939'));
    assert.ok(html.includes('info.yatogo@gmail.com'));
  }
});

test('all blog links resolve and publication dates are staggered',()=>{
  const expected=['2026-10-05','2026-10-01','2026-09-27','2026-09-23','2026-09-19','2026-09-15','2026-09-11','2026-09-07','2026-09-03','2026-08-30'];
  const dates=[];
  for(const [file] of pages.slice(1)){
    const html=read(file);
    const published=html.match(/property="article:published_time" content="([^"]+)"/);
    assert.ok(published,file+' needs published date');dates.push(published[1]);
    for(const match of html.matchAll(/href="(\/blog\/[^"#?]+\/)"/g)){
      const target=path.join(root,match[1].replace(/^\//,''),'index.html');
      assert.ok(fs.existsSync(target),file+' broken link '+match[1]);
    }
  }
  assert.deepEqual(dates.sort().reverse(),expected);
  assert.equal((read('blog/index.html').match(/class="article-card"/g)||[]).length,10);
});

test('preview serves clean blog URLs and keeps missing articles as 404',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const base='http://127.0.0.1:'+server.address().port;
    for(const route of pages.map(([,url])=>new URL(url).pathname)){
      const response=await fetch(base+route);assert.equal(response.status,200,route);
      assert.ok((await response.text()).includes('<html lang="ru">'));
    }
    assert.equal((await fetch(base+'/blog/ne-sushchestvuet/')).status,404);
  }finally{await new Promise(resolve=>server.close(resolve))}
});
