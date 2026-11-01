import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('public'),port=Number(process.env.PORT||8781);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.py':'text/plain'};
http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/__qa/run-voices'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(new URL('./qa-run-voices.html',import.meta.url)));return;}
 if(url.pathname==='/__qa/mobile'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><meta charset="utf-8"><title>390px game QA</title><style>body{background:#0c151b;color:#edf2df;font:16px system-ui;padding:12px}iframe{display:block;width:390px;height:844px;border:2px solid #9be8c2}</style><h1>ตรวจหน้าเกมที่ความกว้าง 390px</h1><iframe title="เกมขนาดมือถือ" id="mobileGame" src="/"></iframe>');return;}
 if(url.pathname.startsWith('/api/')){
   const name=url.pathname.startsWith('/api/auth/')?'auth':url.pathname.slice(5);
   if(!['auth','player','ranking'].includes(name)){res.writeHead(404).end();return;}
   const {default:handler}=await import('../api/'+name+'.js');return await handler(req,res);
 }
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep))throw Error('invalid path');
 const info=await stat(file);if(!info.isFile())throw Error('not found');
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Game + real learner API at http://localhost:'+port));
