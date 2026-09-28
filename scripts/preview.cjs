'use strict';
// Local preview of the proposed nginx query-language routing; no production writes.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
function createServer(directory=root){
 return http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  let pathname;
  try{pathname=decodeURIComponent(url.pathname)}catch{res.writeHead(400).end();return}
  if(pathname==='/index.html'){res.writeHead(301,{Location:'/'+url.search}).end();return}
  if(pathname.startsWith('/seo/')||pathname.startsWith('/scripts/')||pathname.startsWith('/tests/')||pathname.startsWith('/deploy/')||pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(404).end('Not found');return}
  const lang=url.searchParams.get('lang');
  const file=pathname==='/'?(lang==='uz'||lang==='en'?'seo/'+lang+'.html':'index.html'):pathname.slice(1);
  const target=path.resolve(directory,file);
  if(!target.startsWith(path.resolve(directory)+path.sep)){res.writeHead(404).end();return}
  fs.readFile(target,(error,data)=>{
   if(error){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return}
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  });
 });
}
if(require.main===module)createServer().listen(8765,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8765/'));
module.exports={createServer};
