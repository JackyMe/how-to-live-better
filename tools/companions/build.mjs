// Keep the site and its offline edition self-contained; edit content/human-system.json.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>readFileSync(root+p,'utf8');
const data=JSON.parse(read('content/human-system.json'));
const ids=new Set();
for(const g of data.guides){
 if(ids.has(g.id)||!g.chapters.length||g.chapters.some(n=>!/^([1-9]|[12]\d|3[0-2])$/.test(n)))throw Error('Invalid guide '+g.id);
 ids.add(g.id);if(g.art){
   g.illustration=read('assets/illustrations/'+g.art+'.svg').replace('<svg ', '<svg class="guide-art-wide" ')+read('assets/illustrations/'+g.art+'-mobile.svg').replace('<svg ', '<svg class="guide-art-mobile" ');
 }
}
let html=read('index.html');
const replace=(tag,value)=>{const re=new RegExp('/\\* '+tag+' BEGIN \\*/[\\s\\S]*?/\\* '+tag+' END \\*/');if(!re.test(html))throw Error('Missing '+tag);html=html.replace(re,()=>`/* ${tag} BEGIN */\n${value}\n/* ${tag} END */`);};
replace('COMPANION STYLE',read('tools/companions/panel.css'));
replace('RESPONSIVE STYLE',read('assets/responsive.css'));
replace('EXPERIENCE STYLE',read('assets/experience.css'));
replace('EXPERIENCE SCRIPT',read('tools/experience/interface.js'));
replace('COMPANION SCRIPT','const COMPANIONS = '+JSON.stringify(data).replace(/</g,'\\u003c')+';\n'+read('tools/companions/panel.js'));
writeFileSync(root+'index.html',html);
console.log('Embedded '+data.guides.length+' guides and '+data.guides.filter(g=>g.art).length+' original diagrams.');
