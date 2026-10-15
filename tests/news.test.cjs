'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),items=require('../content/news.cjs');
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
test('every news item has a real cover on its page, card and social preview',()=>{
 for(const a of items){const file=path.join(root,a.cover.slice(1));assert.ok(fs.existsSync(file));assert.ok(a.coverAlt&&a.coverCredit&&a.coverRights);const b=fs.readFileSync(file);assert.equal(b.toString('ascii',1,4),'PNG');assert.equal(b.readUInt32BE(16),1200);assert.equal(b.readUInt32BE(20),675);
  const html=read('news/'+a.slug+'/index.html'),index=read('news/index.html'),home=read('index.html');
  for(const text of [html,index,home])assert.ok(text.includes('src="'+a.cover+'"'));
  for(const p of ['og:image','twitter:image'])assert.ok(html.includes('content="https://yatogo.ru'+a.cover+'"'));
  assert.ok(html.includes(a.coverCredit));assert.ok(html.includes('alt="'+a.coverAlt+'"'));
 }
});
test('news metadata, source, dates and sitemap agree with the visible content',()=>{
 for(const a of items){const html=read('news/'+a.slug+'/index.html');assert.equal((html.match(/<h1\b/g)||[]).length,1);const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1])['@graph'];const article=graph.find(x=>x['@type']==='NewsArticle');assert.equal(article.headline,a.title);assert.equal(article.datePublished,a.published);assert.equal(article.citation,a.source);assert.ok(html.includes(a.eventText));assert.ok(html.includes(a.status));assert.ok(read('sitemap.xml').includes('<loc>https://yatogo.ru/news/'+a.slug+'/</loc>'));assert.ok(html.includes('href="'+a.source+'"'));}
 assert.ok(read('sitemap.xml').includes('<loc>https://yatogo.ru/news/</loc>'));
});
test('generators preserve news and render reproducible pages and translated navigation',()=>{
 const files=['index.html','seo/en.html','seo/uz.html','news/index.html',...items.map(a=>'news/'+a.slug+'/index.html'),'sitemap.xml'];const before=files.map(read);require('../scripts/build-news.cjs').build();require('../scripts/build-seo.cjs').build();assert.deepEqual(files.map(read),before);
 for(const f of ['index.html','seo/en.html','seo/uz.html']){const html=read(f);assert.ok(html.indexOf('id="plans"')<html.indexOf('id="news"'));assert.ok(html.indexOf('id="news"')<html.indexOf('id="reviews"'));assert.ok(html.includes('class="nav-group"'));assert.ok(html.includes('href="/news/"'));assert.ok(!html.includes('news.firstTitle'));}
});
