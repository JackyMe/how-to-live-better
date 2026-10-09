// The designed PDF shares its corpus and build with the standalone reader.
// See docs/本地阅读版生成指南.md. The optional legacy output path is still supported.
import '../publication/run.mjs';
import {copyFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
if(process.argv[2]){const out=resolve(process.argv[2]);mkdirSync(dirname(out),{recursive:true});copyFileSync('output/pdf/Better-Life.pdf',out);console.log('PDF copied to '+out);}
