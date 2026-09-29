/* Regenerate static content and language responses. Node.js, no dependencies. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const context = { window: {} };
for (const file of ['site.config.js', 'assets/js/i18n.js', 'assets/js/reviews.js']) {
  vm.runInNewContext(read(file), context, { filename: file, timeout: 1000 });
}
const { I18N, SITE_CONFIG: config, REVIEWS: reviews } = context.window;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matrixSource = read('assets/js/app.js').match(/var MATRIX = (\[[\s\S]*?\n  \]);/);
if (!matrixSource) throw new Error('Cannot find plan matrix');
const matrix = vm.runInNewContext(matrixSource[1], {}, { timeout: 1000 });
let template = read('index.html');
// Keep cache versions deterministic across Windows and Linux checkouts.
template = template.replace(/((?:src|href)=")((?:assets\/[^"?]+|site\.config\.js))\?v=[^"]+/g, (_, start, file) => {
  const content = /\.(js|css)$/.test(file) ? read(file) : fs.readFileSync(path.join(root, file));
  return start + file + '?v=' + crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
});
function attribute(tag, name, value) {
  const re = new RegExp('\\s'+name+'="[^"]*"');
  const attr = ' '+name+'="'+escape(value)+'"';
  return re.test(tag) ? tag.replace(re, attr) : tag.replace(/>$/, attr+'>');
}
function render(lang) {
  const dict = I18N[lang];
  const t = key => { if (!(key in dict)) throw new Error(lang+': missing '+key); return dict[key]; };
  let html = template;
  const rows = matrix.map(row => '<tr><th scope="row" class="row-label" data-i18n="'+row[0]+'"></th>'+row.slice(1).map(on => '<td class="is-center"><span class="mark mark--'+(on?'yes':'no')+'" role="img" data-i18n-attr="aria-label:compare.'+(on?'yes':'no')+'"><svg aria-hidden="true"><use href="#i-'+(on?'check':'cross')+'"></use></svg></span></td>').join('')+'</tr>').join('\n');
  html = html.replace(/(<table id="compareTable">[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/, '$1\n'+rows+'\n$2');
  html = html.replace(/(<([a-z][a-z0-9]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (_, start, tag, key, end) => start+(key==='hero.badge'?t(key):escape(t(key)))+end);
  html = html.replace(/<[a-z][^>]*\bdata-i18n-attr="([^"]+)"[^>]*>/g, (tag, pairs) => {
    for (const pair of pairs.split(',')) {const [name, key] = pair.split(':'); tag = attribute(tag, name.trim(), t(key.trim()));}
    return tag;
  });
  html = html.replace(/<html lang="[^"]+">/, '<html lang="'+lang+'">');
  html = html.replace(/(<span id="langCurrent">)[^<]+/, '$1'+lang.toUpperCase());
  html = html.replace(/<a [^>]*data-lang="(ru|uz|en)"[^>]*>/g, (tag, code) => attribute(tag, 'aria-current', String(code===lang)));
  for (const [key, value] of Object.entries({'data-tg-handle':'@'+config.telegram,'data-phone':config.phoneDisplay,'data-email':config.email,'data-address':config[{ru:'addressRu',uz:'addressUz',en:'addressEn'}[lang]]})) {
    html = html.replace(new RegExp('(<[a-z]+[^>]*\\b'+key+'[^>]*>)[^<]*(</[a-z]+>)','g'), (_,start,end)=>start+escape(value)+end);
  }
  for (const [key, value] of Object.entries({'data-tg-link':'https://t.me/'+config.telegram,'data-wa-link':'https://wa.me/'+config.whatsapp,'data-mail-link':'mailto:'+config.email,'data-phone-link':'tel:+'+String(config.phoneDisplay).replace(/\D/g,''),'data-privacy-link':'/privacy/?lang='+lang})) {
    html=html.replace(new RegExp('<a [^>]*\\b'+key+'[^>]*>','g'), tag=>attribute(tag,'href',value));
  }
  const canonical = 'https://yatogo.ru/'+(lang==='ru'?'':'?lang='+lang);
  html=html.replace(/<link rel="canonical"[^>]*>/, tag=>attribute(tag,'href',canonical));
  html=html.replace(/<meta property="og:url"[^>]*>/, tag=>attribute(tag,'content',canonical));
  html=html.replace(/(<script type="application\/ld\+json" id="page-schema">)[\s\S]*?(<\/script>)/, (_,start,end)=>start+JSON.stringify({'@context':'https://schema.org','@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:t('meta.title'),description:t('meta.desc'),inLanguage:lang,isPartOf:{'@id':'https://yatogo.ru/#website'},about:{'@id':'https://yatogo.ru/#organization'}}).replace(/</g,'\\u003c')+end);
  const colors=['#0B7A5B','#1F6FB2','#7A4FB5','#B5613A','#2E8C8C','#5B6B7A','#A34A6B'];
  let rowIndex=0;
  html=html.replace(/(<div class="marquee__track">)[\s\S]*?(<\/div>\s*<\/div>)/g, (_,start,end)=>{
    const first=rowIndex++*Math.ceil(reviews.length/2);
    const cards=reviews.slice(first,first+Math.ceil(reviews.length/2)).map((rv,i)=>{
      const stars=Array.from({length:5},(_,k)=>'<svg class="'+(k<rv.s?'':'off')+'" aria-hidden="true"><use href="#i-star"></use></svg>').join('');
      const initials=rv.n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
      return '<figure class="review"><div class="review__stars" role="img" aria-label="'+rv.s+'/5">'+stars+'</div><blockquote class="review__text">'+escape(rv.t[lang])+'</blockquote><figcaption class="review__author"><span class="review__avatar" style="background:'+colors[(first+i)%colors.length]+'" aria-hidden="true">'+escape(initials)+'</span><span><span class="review__name">'+escape(rv.n)+'</span><br><span class="review__role">'+escape(rv.r[lang])+'</span></span></figcaption></figure>';
    }).join('\n');return start+'\n'+cards+'\n'+cards.replace(/<figure class="review">/g,'<figure class="review" aria-hidden="true">')+'\n'+end;
  });
  // Private render targets are served internally by nginx; public URLs stay ?lang=.
  return html;
}
function build() {
  fs.mkdirSync(path.join(root,'seo'),{recursive:true});
  for(const lang of ['ru','uz','en']) fs.writeFileSync(path.join(root,lang==='ru'?'index.html':'seo/'+lang+'.html'),render(lang));
}
if(require.main===module){build();console.log('Generated RU /, UZ ?lang=uz and EN ?lang=en HTML.');}
module.exports={render,build};
