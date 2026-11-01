import {readdir,mkdir,copyFile,cp} from 'node:fs/promises';
import {build} from 'esbuild';
// Publish only runtime assets. Source, account server code and .env never enter
// the static directory; Vercel packages api/ and server/ separately as Functions.
await mkdir('public/vendor',{recursive:true});
for(const name of await readdir('.'))if(name==='index.html'||name==='question-validator.py'||(/\.(js|css)$/.test(name)&&!name.endsWith('.test.js')))await copyFile(name,'public/'+name);
await copyFile('python-worker.mjs','public/python-worker.mjs');
await cp('assets','public/assets',{recursive:true});
await build({entryPoints:['tools/auth-vendor.mjs'],outfile:'public/vendor/neon-auth.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
console.log('Built game and auth client. Server files and secrets are excluded.');
