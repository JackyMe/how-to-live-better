/* One corpus feeds the standalone reader and the typeset PDF. */
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');process.chdir(root);
(async()=>{
 const {marked}=await import(pathToFileURL(require.resolve('marked')).href);
 const sync=JSON.parse(fs.readFileSync('content/upstream-sync.json','utf8'));
 const raw=p=>fs.readFileSync(p,'utf8');
 const sourceUrl=p=>'https://github.com/JackyMe/how-to-live-better/blob/main/'+p;
 const html=md=>marked.parse(md.replace(/<!--[^]*?-->/g,'').replace(/^\[← 回总目录\].*\n/m,'')).replace(/href="((?:\.\.\/)?(?:book|docs)\/[^"#]+\.md)(?:#[^"]*)?"/g,(_,p)=>'href="'+sourceUrl(p.replace('../',''))+'" target="_blank" rel="noopener"');
 const chapters=fs.readdirSync('book').filter(f=>f.endsWith('.md')).sort().map(f=>{
  const md=raw('book/'+f),parts=md.split(/^### (\d+)\. (.+)$/m),header=parts[0],m=header.match(/^# (\d+)\. (.+)$/m);
  const intro=header.replace(/^\[← 回总目录\].*\n/m,'').replace(/^# .+\n/m,'').trim();
  const entries=[];for(let i=1;i<parts.length;i+=3){const fields={};for(const match of parts[i+2].matchAll(/^- ([^：\n]+)：(.*)$/gm))fields[match[1]]=match[2].trim();const tags=Object.fromEntries([...(parts[i+2].match(/<!-- 成本标签: (.*?) -->/)?.[1]||'').matchAll(/(\S+?)=(\S+)/g)].map(m=>[m[1],m[2]]));entries.push({id:'e-'+m[1]+'-'+parts[i],n:+parts[i],title:parts[i+1],fields,tags,html:html(parts[i+2])});}
  return{id:'chapter-'+m[1],n:+m[1],title:m[2],intro,introHtml:html(intro),entries,path:'book/'+f};
 });
 const essays=sync.longReads.map(x=>({id:'essay-'+path.basename(x.path,'.md'),title:raw(x.path).match(/^# (.+)$/m)?.[1]||x.title,md:raw(x.path),html:html(raw(x.path)),path:x.path}));
 const companions=JSON.parse(raw('content/human-system.json'));
 const guides=companions.guides.map(g=>{let md='# '+g.title+'\n\n'+g.deck+'\n\n'+g.steps.map(([a,b])=>'## '+a+'\n\n'+b).join('\n\n')+'\n\n## 边界与争议\n\n'+g.boundary+'\n\n## 出处\n\n[主题来源]('+g.source+')\n\n'+g.refs.map(r=>'['+r.title+']('+r.url+')').join('\n\n');return{id:'guide-'+g.id,title:g.title,md,html:html(md),art:g.art?raw('assets/illustrations/'+g.art+'.svg'):'',path:'docs/人体系统专题.md'};});
 const corpus={version:sync.checked,commit:sync.commit,chapters,essays,guides,entries:chapters.reduce((a,s)=>a+s.entries.length,0)};
 fs.mkdirSync('.cache/publication',{recursive:true});fs.mkdirSync('output/html',{recursive:true});fs.mkdirSync('output/pdf',{recursive:true});
 fs.writeFileSync('.cache/publication/corpus.json',JSON.stringify(corpus));
 let out=raw('tools/publication/reader.html').replace('/* PUBLICATION_DATA */','const BOOK='+JSON.stringify(corpus).replace(/</g,'\\u003c')+';');
 fs.writeFileSync('output/html/Better-Life.html',out);
 console.log('Standalone HTML:',corpus.chapters.length,'chapters /',corpus.entries,'entries /',essays.length,'essays /',guides.length,'guides');
})().catch(e=>{console.error(e);process.exitCode=1});
