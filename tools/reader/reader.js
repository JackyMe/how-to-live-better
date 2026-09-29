/* A bounded reader: chapter shelf, one entry at a time, explicit navigation history. */
const reader={ready:false,items:[],active:null,key:'',pending:'',hash:'',shelfPage:0,memory:{}};
function readerMatches(card,terms){const e=card.e;return (!onlySaved||saved.has(card.el.id))&&DIMS.every(d=>!state[d].size||state[d].has(e[d]))&&(!state.dispute||e.dispute)&&(!state.todo||e.todo)&&terms.every(t=>e.hay.includes(t));}
function clearReaderFilters(){onlySaved=false;state.q='';for(const d of DIMS)state[d].clear();state.dispute=false;state.todo=false;}
function readerRoute(){readUrl();onlySaved=new URLSearchParams(location.search).get('saved')==='1';const id=location.hash.slice(1);reader.routeGuide=id.startsWith('guide-');reader.hash=reader.routeGuide?id:'';reader.pending=ITEMS.has(id.slice(2))&&id.startsWith('e-')?id:'';if(/^sec-\d+$/.test(id)&&SECS.has(id.slice(4))){clearReaderFilters();state.sec.add(id.slice(4));}if(id.startsWith('guide-'))revealCompanion();}
function prepareReader(){if(!reader.pending)return;const card=CARDS.find(c=>c.el.id===reader.pending);const terms=state.q.toLowerCase().split(/\s+/).filter(Boolean);if(card&&(!readerMatches(card,terms)||(!state.q&&!DIMS.some(d=>state[d].size)&&!onlySaved))){clearReaderFilters();state.sec.add(card.e.sec);}}
function readerFocus(entry=false){const target=document.getElementById(entry&&reader.active?'entry-navigation':'reader-workspace');target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
function openReaderChapter(n){history.pushState({reader:true},'',location.href);clearReaderFilters();if(SECS.has(n))state.sec.add(n);reader.pending='';reader.hash='';document.getElementById('chapter-index').open=false;apply();readerFocus();}
function openReaderItem(id){if(!CARDS.some(c=>c.el.id===id))return;history.pushState({reader:true},'',location.href);reader.pending=id;reader.hash='';document.getElementById('chapter-index').open=false;document.getElementById('companions').open=false;apply();readerFocus(true);}
function readerStep(delta){const i=reader.items.indexOf(reader.active),next=reader.items[i+delta];if(next)openReaderItem(next.el.id);}
function initReader(){
  document.getElementById('chapter-prev').textContent='上一章';document.getElementById('chapter-next').textContent='下一章';
  document.getElementById('empty').setAttribute('role','status');
  reader.ready=true;history.scrollRestoration='manual';try{const m=JSON.parse(localStorage.getItem('better-life-cursors')||'{}');if(m&&typeof m==='object'&&!Array.isArray(m))reader.memory=m;}catch{}
  const doc=document.querySelector('.doc');doc.id='reader-workspace';doc.tabIndex=-1;
  const options=document.createElement('section');options.id='reader-options-panel';options.hidden=true;options.setAttribute('aria-label','阅读偏好与筛选');
  options.append(document.querySelector('.doc-head .stat'),document.querySelector('.reading-switches'),document.querySelector('.reading-help'));
  document.querySelector('.doc-head').after(options);
  const optionsButton=document.createElement('button');optionsButton.id='reader-options';optionsButton.textContent='阅读设置';optionsButton.setAttribute('aria-controls',options.id);optionsButton.setAttribute('aria-expanded','false');document.querySelector('.reader-title').appendChild(optionsButton);
  optionsButton.onclick=()=>{options.hidden=!options.hidden;optionsButton.setAttribute('aria-expanded',String(!options.hidden));};
  document.querySelector('a[href="#method"]').addEventListener('click',()=>{options.hidden=false;optionsButton.setAttribute('aria-expanded','true');});
  const shelf=document.createElement('section');shelf.id='chapter-shelf';shelf.innerHTML='<div class="shelf-heading"><div><span>THE CHAPTER LIBRARY</span><h3>选一章，从一件事开始。</h3></div><button id="shelf-search">查找章节 ↗</button></div><div class="shelf-grid"></div><div class="shelf-pager"><button id="shelf-prev" aria-label="上一页章节">←</button><span id="shelf-page"></span><button id="shelf-next" aria-label="下一页章节">→</button></div>';document.querySelector('.reading-tools').before(shelf);
  const top=document.createElement('div');top.id='entry-navigation';top.innerHTML='<div><span class="entry-eyebrow">FOCUS READING</span><strong id="entry-position" aria-live="polite"></strong></div><div class="entry-actions"><button id="entry-list">本章目录 ☷</button><button id="entry-prev" aria-label="上一条">←</button><button id="entry-next" aria-label="下一条">→</button></div>';document.getElementById('list').before(top);
  const bottom=document.createElement('nav');bottom.id='entry-footer';bottom.setAttribute('aria-label','正文翻页');bottom.innerHTML='<button id="entry-prev-bottom"><small>上一条</small><span></span></button><button id="entry-next-bottom"><small>下一条</small><span></span></button><button id="finish-chapter" hidden><small>本章已读到最后一条</small><span>选择下一章 ↗</span></button>';document.getElementById('list').after(bottom);bottom.after(document.getElementById('companions'));
  const tools=document.querySelector('.chapter-controls');const launcher=document.createElement('button');launcher.id='reader-chapter';launcher.setAttribute('aria-haspopup','dialog');launcher.innerHTML='<small>切换章节</small><span></span><b aria-hidden="true">⌄</b>';tools.querySelector('label').hidden=true;document.getElementById('chapter-select').hidden=true;tools.prepend(launcher);
  for(const b of BLOCKS){const intro=document.createElement('details');intro.className='chapter-overview';intro.innerHTML='<summary>本章导读与阅读提醒</summary><div></div>';const body=intro.querySelector('div');b.el.querySelectorAll(':scope>.intro,:scope>.chapter-quote').forEach(p=>body.appendChild(p));b.el.appendChild(intro);}
  document.getElementById('entry-prev').onclick=()=>readerStep(-1);document.getElementById('entry-prev-bottom').onclick=()=>readerStep(-1);document.getElementById('entry-next').onclick=()=>readerStep(1);document.getElementById('entry-next-bottom').onclick=()=>readerStep(1);
  document.getElementById('entry-list').onclick=()=>{const index=document.getElementById('chapter-index');index.open=!index.open;document.getElementById('entry-list').setAttribute('aria-expanded',String(index.open));if(index.open){index.querySelector('summary').focus({preventScroll:true});index.scrollIntoView({block:'nearest',behavior:'instant'});}};
  document.getElementById('finish-chapter').onclick=()=>{const n=reader.active?.e.sec,keys=[...SECS.keys()],next=keys[keys.indexOf(n)+1];openReaderChapter(next||'');};
  shelf.addEventListener('click',e=>{const b=e.target.closest('[data-open-chapter]');if(b)openReaderChapter(b.dataset.openChapter);});
  document.getElementById('shelf-prev').onclick=()=>{reader.shelfPage--;renderShelf();};document.getElementById('shelf-next').onclick=()=>{reader.shelfPage++;renderShelf();};
  document.querySelector('.doc-head .reader-note').textContent='一次读一条，按需看证据。目录随时可跳转，各章会记住上次读到的位置。';
  window.addEventListener('popstate',()=>{readerRoute();apply();readerFocus();});
  window.addEventListener('hashchange',()=>{readerRoute();apply();if(reader.hash.startsWith('guide-')){document.getElementById(reader.hash)?.scrollIntoView();}else readerFocus();});
  document.addEventListener('click',e=>{const a=e.target.closest('.guide-related a,.guide-permalink');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;e.preventDefault();if(url.hash.startsWith('#sec-'))openReaderChapter(url.hash.slice(5));else{history.pushState({reader:true},'',url.href);readerRoute();apply();document.getElementById(reader.hash)?.scrollIntoView();}});
  document.getElementById('list').addEventListener('click',e=>{const a=e.target.closest('a.anchor');if(a){e.preventDefault();openReaderItem(a.hash.slice(1));}});
}
function renderShelf(){const chapters=[...SECS.values()],pages=Math.ceil(chapters.length/8);reader.shelfPage=Math.max(0,Math.min(reader.shelfPage,pages-1));document.querySelector('.shelf-grid').innerHTML=chapters.slice(reader.shelfPage*8,reader.shelfPage*8+8).map(s=>'<button data-open-chapter="'+s.n+'"><span>'+s.n.padStart(2,'0')+'</span><strong>'+esc(s.title)+'</strong><small>'+s.entries.length+' 条建议 ↗</small></button>').join('');document.getElementById('shelf-page').textContent=(reader.shelfPage+1)+' / '+pages;document.getElementById('shelf-prev').disabled=reader.shelfPage===0;document.getElementById('shelf-next').disabled=reader.shelfPage===pages-1;}
function updateReader(){
  if(!reader.ready)return;
  const key=JSON.stringify([state.q,...DIMS.map(d=>[...state[d]]),state.dispute,state.todo,onlySaved]);
  const directory=!state.q&&!DIMS.some(d=>state[d].size)&&!state.dispute&&!state.todo&&!onlySaved;
  const changed=reader.key!==key;reader.key=key;if(changed&&!reader.routeGuide&&reader.hash.startsWith('guide-'))reader.hash='';reader.routeGuide=false;
  reader.items=CARDS.filter(c=>!c.el.hidden);
  const memoryKey=state.sec.size===1?'chapter-'+[...state.sec][0]:key;
  const preferred=reader.pending||(!changed?reader.active?.el.id:null)||reader.memory[memoryKey];
  reader.active=directory?null:reader.items.find(c=>c.el.id===preferred)||reader.items[0]||null;reader.pending='';
  if(changed){document.querySelectorAll('.chapter-overview').forEach(d=>d.open=false);document.getElementById('chapter-index').open=false;if(!reader.hash.startsWith('guide-')&&!state.q)document.getElementById('companions').open=false;}
  for(const card of CARDS)card.el.hidden=card!==reader.active;
  for(const block of BLOCKS)block.el.hidden=block.n!==reader.active?.e.sec;
  if(reader.active){const c=reader.active;renderCard(c,CUR_TERMS,CUR_KEY);reader.memory[memoryKey]=c.el.id;if(state.sec.size===1){try{const data=Object.fromEntries(Object.entries(reader.memory).filter(([k])=>k.startsWith('chapter-')));localStorage.setItem('better-life-cursors',JSON.stringify(data));}catch{}}}
  reader.hash=directory?'':reader.hash.startsWith('guide-')?reader.hash:reader.active?.el.id||'';
  document.getElementById('chapter-shelf').hidden=!directory;if(directory)renderShelf();
  document.getElementById('reader-workspace').classList.toggle('shelf-mode',directory);
  document.getElementById('entry-list').setAttribute('aria-expanded',String(document.getElementById('chapter-index').open));const progress=document.getElementById('reading-progress');const position=reader.active?reader.items.indexOf(reader.active)+1:0;progress.style.width=(reader.items.length?position/reader.items.length*100:0)+'%';progress.setAttribute('aria-label','当前条目位置');progress.setAttribute('role','progressbar');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(reader.items.length||1));progress.setAttribute('aria-valuenow',String(position));
  document.getElementById('entry-navigation').hidden=!reader.active;document.getElementById('entry-footer').hidden=!reader.active;
  if(directory){document.getElementById('reading-title').textContent='章节书架';document.getElementById('companions').hidden=true;}
  if(reader.active){const i=reader.items.indexOf(reader.active),len=reader.items.length;document.getElementById('entry-position').textContent='第 '+(i+1)+' / '+len+' 条'+(state.sec.size===1?' · 本章':' · 筛选结果');document.getElementById('entry-prev').disabled=i===0;document.getElementById('entry-next').disabled=i===len-1;const prev=document.getElementById('entry-prev-bottom'),next=document.getElementById('entry-next-bottom');prev.disabled=i===0;prev.querySelector('span').textContent=reader.items[i-1]?.e.title||'已是第一条';next.hidden=i===len-1;next.querySelector('span').textContent=reader.items[i+1]?.e.title||'';document.getElementById('finish-chapter').hidden=i!==len-1||state.sec.size!==1;}
}
function syncReaderIndex(){
  const index=document.getElementById('chapter-index');index.hidden=!reader.active;
  const nav=index.querySelector('nav');nav.replaceChildren();document.getElementById('index-count').textContent=reader.items.length+' 条';
  for(const c of reader.items){const a=document.createElement('a');a.href='#'+c.el.id;a.textContent=(state.sec.size===1?c.e.n:c.e.sec+'.'+c.e.n)+'. '+c.e.title;if(c===reader.active)a.setAttribute('aria-current','true');nav.appendChild(a);}
  document.getElementById('reader-chapter').querySelector('span').textContent=state.sec.size===1?SECS.get([...state.sec][0])?.title||'选择章节':state.sec.size?'主题阅读':'选择章节';
}
