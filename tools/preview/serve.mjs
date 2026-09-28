import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
http.createServer(async(req,res)=>{try {const url=new URL(req.url,'http://localhost');let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(root.endsWith(sep)?root:root+sep)&&path!==resolve(root)){res.writeHead(403);return res.end('Forbidden');}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Better Life: http://127.0.0.1:${port}`));
