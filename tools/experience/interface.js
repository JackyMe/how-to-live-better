/* Chapter navigator and motion: no external dependencies, including offline builds. */
let chapterNavigator;
function syncChapterLauncher(){
  const n=state.sec.size===1?[...state.sec][0]:'';
  const button=document.getElementById('hero-chapter');button.value=n;
  button.querySelector('.chapter-launch-title').textContent=n?SECS.get(n).title:'找到此刻需要的答案';
  button.querySelector('.chapter-launch-note').textContent=n?'正在阅读第 '+n+' 章 · 点击切换':'32 个章节 · 按主题探索';
}
function initExperience(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const animate=(el,frames,options={})=>{if(!reduced.matches&&el) return el.animate(frames,{duration:320,easing:'cubic-bezier(.22,1,.36,1)',...options});};
  const dialog=document.createElement('dialog');dialog.id='chapter-navigator';dialog.setAttribute('aria-labelledby','navigator-title');
  dialog.innerHTML='<div class="navigator-head"><div><span class="navigator-eyebrow">YOUR NEXT CHAPTER</span><h2 id="navigator-title">从此刻的需要开始。</h2></div><button class="navigator-close" aria-label="关闭章节导航">×</button></div><label class="navigator-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input id="chapter-query" type="search" placeholder="搜索章节名称或编号" aria-label="搜索章节" autocomplete="off"></label><div class="navigator-topics" role="group" aria-label="按主题筛选"></div><div class="navigator-status" aria-live="polite"></div><div class="navigator-grid"></div><p class="navigator-empty" hidden>暂时没有匹配章节，试试其他关键词。</p><div class="navigator-foot"><span>选择一章，直接开始阅读</span><button class="navigator-all">浏览全部章节 <span aria-hidden="true">↗</span></button></div>';
  document.body.appendChild(dialog);chapterNavigator=dialog;
  const groups=[['全部',null],['健康与状态',['1','2','3','13','16','17','20','22','24','27','28']],['时间与成长',['4','19','23','30','31','32']],['财务与风险',['5','6','7','8','9','11','12','14','26']],['关系与生活',['10','15','18','21','25','29']]];
  const grid=dialog.querySelector('.navigator-grid'),query=dialog.querySelector('input');let category=0;let opener;
  for(const [i,[name]] of groups.entries()){const b=document.createElement('button');b.textContent=name;b.dataset.category=i;b.setAttribute('aria-pressed',String(i===0));dialog.querySelector('.navigator-topics').appendChild(b);}
  for(const [n,s] of SECS){const b=document.createElement('button');b.className='navigator-chapter';b.dataset.chapter=n;b.innerHTML='<span class="navigator-number">'+n.padStart(2,'0')+'</span><span><strong>'+esc(s.title)+'</strong><small>'+s.entries.length+' 条建议</small></span><span class="navigator-arrow" aria-hidden="true">↗</span>';grid.appendChild(b);}
  const render=()=>{let count=0;const terms=query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);for(const b of grid.children){const s=SECS.get(b.dataset.chapter);b.hidden=!!(groups[category][1]&&!groups[category][1].includes(s.n))||!terms.every(t=>(s.n+' '+s.title).toLowerCase().includes(t));b.setAttribute('aria-current',String(state.sec.size===1&&state.sec.has(s.n)));if(!b.hidden)count++;}dialog.querySelector('.navigator-status').textContent=count+' 个章节';dialog.querySelector('.navigator-empty').hidden=count>0;grid.scrollTop=0;};
  const open=()=>{if(dialog.open)return;opener=document.activeElement;category=0;query.value='';dialog.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='0')));render();dialog.showModal();dialog.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest',behavior:'instant'});document.documentElement.classList.add('navigator-open');document.getElementById('hero-chapter').setAttribute('aria-expanded','true');(innerWidth>640?query:dialog.querySelector('.navigator-close')).focus({preventScroll:true});animate(dialog,[{opacity:0,transform:innerWidth<=640?'translateY(36px)':'translateY(16px) scale(.97)'},{opacity:1,transform:'none'}],{duration:420});};
  let closing=null;
  const close=()=>{
    if(closing)return closing;
    const finish=()=>{dialog.close();dialog.classList.remove('is-closing');document.documentElement.classList.remove('navigator-open');document.getElementById('hero-chapter').setAttribute('aria-expanded','false');opener?.focus({preventScroll:true});};
    if(reduced.matches||!dialog.open){finish();return Promise.resolve();}
    dialog.classList.add('is-closing');
    const motion=animate(dialog,[{opacity:1,transform:'none'},{opacity:0,transform:innerWidth<=640?'translateY(24px)':'translateY(8px) scale(.985)'}],{duration:180,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    closing=motion.finished.catch(()=>{}).then(()=>{finish();motion.cancel();}).finally(()=>{closing=null;});return closing;
  };
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const id of ['hero-chapter','reader-chapter','shelf-search'])document.getElementById(id).addEventListener('click',open);
  dialog.querySelector('.navigator-close').addEventListener('click',close);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{if(!dialog.open){document.documentElement.classList.remove('navigator-open');document.getElementById('hero-chapter').setAttribute('aria-expanded','false');}});
  query.addEventListener('input',render);
  dialog.querySelector('.navigator-topics').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=+b.dataset.category;dialog.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();animate(grid,[{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'none'}]);});
  const choose=async n=>{if(closing)return;await close();openReaderChapter(n);};
  grid.addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)choose(b.dataset.chapter);});
  dialog.querySelector('.navigator-all').addEventListener('click',()=>choose(''));
  query.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();grid.querySelector('button:not([hidden])')?.focus();}if(e.key==='Enter'){const results=[...grid.children].filter(b=>!b.hidden);if(results.length===1){e.preventDefault();choose(results[0].dataset.chapter);}}});
  // Native dialog traps focus and Escape closes it. Do not run global shortcuts inside it.
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  const reveal=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;animate(entry.target,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:650});reveal.unobserve(entry.target);}},{threshold:.15});
  document.querySelectorAll('.path-card,.library-heading').forEach(el=>{if(el.getBoundingClientRect().top>=innerHeight)reveal.observe(el);});
  const disclosures=new WeakMap();
  document.addEventListener('click',e=>{
    const summary=e.target.closest('summary');if(!summary||reduced.matches||e.target.closest('a,button,input'))return;
    const details=summary.parentElement;if(!details.matches('.src,.companion-guide,#companions,#chapter-index,.guide-sources,.reading-help,.gloss'))return;
    e.preventDefault();const previous=disclosures.get(details);const expand=previous?!previous.expand:!details.open;
    const start=details.getBoundingClientRect().height;previous?.animation.cancel();details.style.height='';details.style.overflow='';details.open=expand;
    const end=details.getBoundingClientRect().height;details.open=true;details.style.height=start+'px';details.style.overflow='hidden';
    const animation=animate(details,[{height:start+'px'},{height:end+'px'}],{duration:expand?280:200});
    const pending={animation,expand};disclosures.set(details,pending);
    animation.finished.catch(()=>{}).then(()=>{if(disclosures.get(details)!==pending)return;details.open=expand;details.style.height='';details.style.overflow='';disclosures.delete(details);});
  });
  document.addEventListener('click',e=>{const b=e.target.closest('[data-save]');if(b)animate(b,[{transform:'scale(1)'},{transform:'scale(1.23)',offset:.45},{transform:'scale(1)'}],{duration:360});});
  const art=document.querySelector('.hero-art');let frame=0;
  art.addEventListener('pointermove',e=>{if(reduced.matches||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=art.getBoundingClientRect();art.style.setProperty('--tilt-x',((e.clientY-r.top)/r.height-.5)*-5+'deg');art.style.setProperty('--tilt-y',((e.clientX-r.left)/r.width-.5)*5+'deg');});});
  art.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);art.style.setProperty('--tilt-x','0deg');art.style.setProperty('--tilt-y','0deg');});
  let artVisible=true;const pauseArt=()=>{art.querySelector('.sculpture').style.animationPlayState=artVisible&&!document.hidden?'running':'paused';};new IntersectionObserver(entries=>{artVisible=entries[0].isIntersecting;pauseArt();}).observe(art);document.addEventListener('visibilitychange',pauseArt);
  reduced.addEventListener('change',()=>{if(reduced.matches){document.getAnimations().forEach(a=>a.cancel());art.style.setProperty('--tilt-x','0deg');art.style.setProperty('--tilt-y','0deg');}});
}
let lastMotionKey='';
function animateReadingChange(){
  const key=location.search+'|'+document.documentElement.classList.contains('brief-reading');
  if(key===lastMotionKey)return;lastMotionKey=key;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  CARDS.filter(c=>!c.el.hidden).slice(0,5).forEach((c,i)=>{c.el.getAnimations().forEach(a=>a.cancel());c.el.animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:300,delay:i*28,easing:'cubic-bezier(.22,1,.36,1)'});});
}
