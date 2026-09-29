function buildCompanions(){
  const panel=document.createElement('details');panel.id='companions';
  panel.innerHTML='<summary><span><small>深入一点 · 人体系统专题</small><strong id="companion-label"></strong></span><span aria-hidden="true">＋</span></summary><div class="companion-body"><p class="companion-note">本站原创导读，按当前章节与关键词推荐。不计入 552 条建议，也不沿用其证据评级。</p><div id="companion-guides"></div><details class="companion-library"><summary>原文目录与收录说明</summary><p>来源：zijie0 / HumanSystemOptimization。原仓库未声明转载许可，因此保留原文入口，独立编写导读与插图；未复制正文或原图。核对日期：'+COMPANIONS.reviewed+'。</p><ul>'+COMPANIONS.articles.map(a=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(a.url)+'">'+esc(a.title)+' ↗</a><small>'+esc(a.status)+'</small></li>').join('')+'</ul></details></div>';
  document.getElementById('list').before(panel);
  for(const g of COMPANIONS.guides){
    const item=document.createElement('details');item.className='companion-guide';item.id='guide-'+g.id;
    item.innerHTML='<summary><span>'+esc(g.title)+'</span><small>阅读导读 ↓</small></summary><div class="guide-content"><p class="guide-deck">'+esc(g.deck)+'</p>'+(g.illustration?'<figure>'+g.illustration+'<figcaption>本站原创示意图 · '+(g.id==='sleep'?'并非生理测量曲线':g.id==='longevity'?'研究阶段不能直接推导个人疗效':'学习流程建议')+'</figcaption></figure>':'')+'<ol>'+g.steps.map(([title,body])=>'<li><h4>'+esc(title)+'</h4><p>'+esc(body)+'</p></li>').join('')+'</ol><aside><strong>边界与争议</strong><p>'+esc(g.boundary)+'</p></aside><div class="guide-related">相关章节：'+g.chapters.map(n=>'<a href="?sec='+n+'#sec-'+n+'">'+n+'. '+esc(SECS.get(n)?.title||'')+'</a>').join(' · ')+'</div><details class="guide-sources"><summary>出处与进一步阅读</summary><ul><li><a href="'+esc(g.source)+'" target="_blank" rel="noopener noreferrer">主题来源 · HumanSystemOptimization ↗</a></li>'+g.refs.map(r=>'<li><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+' ↗</a></li>').join('')+'</ul></details><a class="guide-permalink" href="?sec='+g.chapters[0]+'#guide-'+g.id+'">本专题固定链接 ↗</a></div>';
    document.getElementById('companion-guides').appendChild(item);
  }
}
function filterCompanions(terms){
  let count=0;
  // Cost/grade/saved filters apply to evidence entries, not editorial guides.
  const eligible=!onlySaved&&!['ratio','lens','grade','money','time','will'].some(d=>state[d].size)&&!state.dispute&&!state.todo;
  for(const g of COMPANIONS.guides){
    const hay=[g.title,g.topic,g.deck,g.boundary,...g.steps.flat()].join(' ').toLowerCase();
    const show=eligible&&(!state.sec.size||g.chapters.some(n=>state.sec.has(n)))&&terms.every(t=>hay.includes(t));
    document.getElementById('guide-'+g.id).hidden=!show;if(show)count++;
  }
  const panel=document.getElementById('companions');panel.hidden=!count;
  document.getElementById('companion-label').textContent=count+' 篇'+(state.sec.size?'相关':'')+'导读 · 展开阅读';
  if(terms.length&&count)panel.open=true;
  return count;
}
function revealCompanion(){
  const g=COMPANIONS.guides.find(g=>location.hash==='#guide-'+g.id);if(!g)return;
  onlySaved=false;state.q='';for(const d of DIMS)state[d].clear();state.sec.add(g.chapters[0]);state.dispute=false;state.todo=false;
  document.getElementById('companions').open=true;document.getElementById('guide-'+g.id).open=true;
}
