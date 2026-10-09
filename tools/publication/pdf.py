"""Typeset the shared publication corpus into searchable, linked vector PDF."""
import json,re,os,html,hashlib
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor,Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Flowable,KeepTogether,Table,TableStyle,CondPageBreak
from reportlab.platypus.tableofcontents import TableOfContents
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
data=json.loads(Path('.cache/publication/corpus.json').read_text());OUT=Path('output/pdf/Better-Life.pdf')
pdfmetrics.registerFont(TTFont('Noto',str(Path('.cache/publication/NotoSansSC-Regular.ttf'))))
pdfmetrics.registerFont(TTFont('NotoBold',str(Path('.cache/publication/NotoSansSC-Bold.ttf'))))
pdfmetrics.registerFontFamily('Noto',normal='Noto',bold='NotoBold',italic='Noto',boldItalic='NotoBold')
INK=HexColor('#263e31');MUTED=HexColor('#667164');LINE=HexColor('#dce2d4');LIME=HexColor('#e7efce');PAPER=HexColor('#fbfaf5');GREEN=HexColor('#385841')
W,H=190*mm,260*mm;M=19*mm;CW=W-2*M
styles={
 'body':ParagraphStyle('body',fontName='Noto',fontSize=10.4,leading=17.5,textColor=INK,spaceAfter=8,wordWrap='CJK',allowWidows=0,allowOrphans=0),
 'note':ParagraphStyle('note',fontName='Noto',fontSize=9,leading=15,textColor=MUTED,spaceAfter=8,wordWrap='CJK',allowWidows=0,allowOrphans=0),
 'source':ParagraphStyle('source',fontName='Noto',fontSize=8.1,leading=12.5,textColor=MUTED,spaceAfter=6,wordWrap='CJK',splitLongWords=1),
 'title':ParagraphStyle('title',fontName='NotoBold',fontSize=14.5,leading=23,textColor=INK,spaceBefore=13,spaceAfter=12,wordWrap='CJK',keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='NotoBold',fontSize=15,leading=24,textColor=INK,spaceBefore=20,spaceAfter=12,wordWrap='CJK',keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='NotoBold',fontSize=12,leading=20,textColor=INK,spaceBefore=15,spaceAfter=8,wordWrap='CJK',keepWithNext=True),
 'label':ParagraphStyle('label',fontName='NotoBold',fontSize=8,leading=13,textColor=GREEN,spaceBefore=8,spaceAfter=5,keepWithNext=True),
 'lead':ParagraphStyle('lead',fontName='Noto',fontSize=11.2,leading=19,textColor=INK,spaceAfter=12,wordWrap='CJK',allowWidows=0,allowOrphans=0),
 'toc':ParagraphStyle('toc',fontName='Noto',fontSize=10.3,leading=18,textColor=INK,spaceBefore=5,spaceAfter=5,leftIndent=0,rightIndent=25,wordWrap='CJK'),
}
def rich(text):
 text=re.sub(r'<!--[\s\S]*?-->','',text).strip();held=[]
 def link(label,url):
  if not url.startswith(('http://','https://','mailto:','#')):url='https://github.com/JackyMe/how-to-live-better/blob/main/'+url.removeprefix('../')
  val='<link href="'+html.escape(url,quote=True)+'" color="#385841">'+html.escape(label)+'</link>';held.append(val);return f'ZZLINK{len(held)-1}ZZ'
 text=re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',lambda m:link(m[1],m[2]),text)
 text=re.sub(r'<(https?://[^>]+)>',lambda m:link(m[1],m[1]),text)
 text=re.sub(r'(?<![\w"=])(https?://[^\s<>]+)',lambda m:link(m[1],m[1]),text)
 text=html.escape(text).replace('⁻','<super>-</super>').replace('⁵','<super>5</super>');text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text);text=text.replace('`','')
 for i,val in enumerate(held):text=text.replace(f'ZZLINK{i}ZZ',val)
 return text

def P(text,style='body'):return Paragraph(rich(text),styles[style])
class Rule(Flowable):
 def __init__(self):Flowable.__init__(self);self.height=16
 def draw(self):self.canv.setStrokeColor(LINE);self.canv.setLineWidth(.6);self.canv.line(0,8,CW,8)
class Cover(Flowable):
 def __init__(self):Flowable.__init__(self);self.width=CW;self.height=H-100
 def draw(self):
  c=self.canv;c.saveState();c.setFillColor(INK);c.rect(-M,-50,W,H,fill=1,stroke=0);c.setFillColor(LIME);c.setFont('Helvetica',11);c.drawString(0,self.height-20,'BETTER LIFE / THE PERSONAL EDITION');
  for text,y in [('人生很贵。',self.height-100),('把力气花在',self.height-153),('值得的事。',self.height-206)]:c.setFont('NotoBold',32);c.drawString(0,y,text)
  c.setFillColor(HexColor('#b6c4a6'));c.setFont('Noto',10);c.drawString(0,self.height-245,'高性价比人生指南 · 完整本地阅读版')
  cx=CW*.65;cy=165
  for radius in [78,110,140]:c.setStrokeColor(HexColor('#50674d'));c.setLineWidth(.6);c.circle(cx,cy,radius,fill=0,stroke=1)
  for i,col in enumerate(['#647f5c','#91a978','#bfd197','#e7efce']):
   y=cy-80+i*42;half=105-i*22;c.setFillColor(HexColor(col));p=c.beginPath();p.moveTo(cx-half,y);p.lineTo(cx,y+half*.44);p.lineTo(cx+half,y);p.lineTo(cx,y-half*.44);p.close();c.drawPath(p,fill=1,stroke=0)
  c.setFillColor(LIME);c.circle(cx,cy+94,20,fill=1,stroke=0);c.setFont('Noto',9);c.drawString(0,10,f"{len(data['chapters'])} 个章节 / {data['entries']} 条建议 / {len(data['essays'])} 篇场景长文 / {len(data['guides'])} 篇专题导读");c.setFont('Helvetica',8);c.drawString(0,-9,'JACKYME  /  '+data['version']+'  /  '+data['commit'][:7]);c.restoreState()
class ChapterOpening(Flowable):
 def __init__(self,number,title,label,key,quote=''):
  Flowable.__init__(self);self.number=number;self.title=title;self.label=label;self.key=key;self.quote=quote;self.width=CW;self.height=430
 def draw(self):
  c=self.canv;c.setFillColor(MUTED);c.setFont('Helvetica',9);c.drawString(0,414,self.label);c.setStrokeColor(LINE);c.line(0,397,CW,397);c.setFont('Helvetica',100);c.setFillColor(HexColor('#c6d2b5'));c.drawString(-4,279,self.number)
  para=Paragraph(html.escape(self.title),ParagraphStyle('opening',fontName='NotoBold',fontSize=29,leading=43,textColor=INK,wordWrap='CJK'));_,hh=para.wrap(CW-15,200);para.drawOn(c,0,238-hh)
  if self.quote:
   q=P(self.quote,'lead');_,qh=q.wrap(CW-35,120);c.setFillColor(LIME);c.roundRect(0,35,CW,qh+30,9,fill=1,stroke=0);q.drawOn(c,17,50)
  c.setFillColor(MUTED);c.setFont('Noto',9);c.drawString(0,8,'无需一次做完。读到有用的一条，就从那里开始。')
class ElegantTOC(TableOfContents):
 def wrap(self,availWidth,availHeight):
  rows=[]
  for level,text,page,key in self._lastEntries or [(0,'目录正在生成',0,None)]:
   label=html.escape(text);number=str(page)
   if key:label=f'<link href="#{key}">{label}</link>';number=f'<link href="#{key}">{number}</link>'
   rows.append([Paragraph(label,styles['toc']),Paragraph(number,ParagraphStyle('tocpage',parent=styles['toc'],alignment=2,rightIndent=0,leftIndent=0,wordWrap=None))])
  self._table=Table(rows,colWidths=[availWidth-38,38],rowHeights=30,style=TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LINEBELOW',(0,0),(-1,-1),.35,LINE),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))
  self.width,self.height=self._table.wrapOn(self.canv,availWidth,availHeight);return self.width,self.height

class BookDoc(BaseDocTemplate):
 def __init__(self,*a,**kw):
  super().__init__(*a,**kw);self.running='阅读指南';self.destinations={};self.addPageTemplates(PageTemplate('Book',[Frame(M,45,CW,H-96,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.background,onPageEnd=self.page))
 def beforeDocument(self):self.running='阅读指南';self.destinations={}
 def background(self,c,doc):
  c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 def page(self,c,doc):
  if doc.page==1:return
  c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(M,H-32,W-M,H-32);c.setFillColor(MUTED);c.setFont('Helvetica',7);c.drawString(M,H-24,'BETTER LIFE');c.setFont('Noto',7);c.drawRightString(W-M,H-24,self.running[:35]);c.setFont('Helvetica',8);c.drawRightString(W-M,25,str(doc.page));c.setFont('Noto',7);c.drawString(M,25,'个人阅读版 · '+data['version'])
 def afterFlowable(self,f):
  if isinstance(f,ChapterOpening):
   self.running=f.title;self.canv.bookmarkPage(f.key);self.canv.addOutlineEntry(f.title,f.key,0,False);self.notify('TOCEntry',(0,f.number+'  '+f.title,self.page,f.key));self.destinations[f.key]=self.page
  elif hasattr(f,'entryKey'):
   self.canv.bookmarkPage(f.entryKey);self.canv.addOutlineEntry(f.entryTitle,f.entryKey,1,False);self.destinations[f.entryKey]=self.page

def markdown(md):
 out=[];md=re.sub(r'^\[← 回总目录\].*\n','',md);buf=[];table=[]
 def flush():
  if buf:out.append(P(' '.join(buf)));buf.clear()
 def flush_table():
  if not table:return
  rows=[r for r in table if not re.match(r'^\|?[\s:|-]+\|?$',r)]
  rawcells=[[x.strip() for x in r.strip().strip('|').split('|')] for r in rows];n=max(map(len,rawcells));rawcells=[r+['']*(n-len(r)) for r in rawcells]
  weights=[max(5,min(50,max(len(re.sub(r'\[[^]]+\]\([^)]*\)','链接',r[i])) for r in rawcells))) for i in range(n)]
  widths=[CW*w/sum(weights) for w in weights]
  cells=[[Paragraph(rich(x),ParagraphStyle('cell',parent=styles['note'],fontName='NotoBold' if ri==0 else 'Noto',fontSize=9,leading=14,textColor=INK)) for x in r] for ri,r in enumerate(rawcells)]
  t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),LIME),('GRID',(0,0),(-1,-1),.3,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),6)]));out.extend([t,Spacer(1,12)]);table.clear()
 for line in md.splitlines():
  line=line.strip()
  if line.startswith('<!--') or re.match(r'^# ',line):continue
  if line.startswith('|'):flush();table.append(line);continue
  flush_table()
  if not line:flush();continue
  if line.startswith('##'):flush();out.append(P(re.sub(r'^#+\s*','',line),'h2' if line.startswith('## ') else 'h3'))
  elif re.match(r'^[-*] |^\d+[.)] ',line):flush();out.append(P(re.sub(r'^[-*] ','• ',line)))
  elif line.startswith('>'):flush();out.append(P(line.lstrip('> '),'lead'))
  elif line=='---':flush();out.append(Rule())
  else:buf.append(line)
 flush();flush_table();return out
story=[Cover(),PageBreak()]
story += [P('先选一件事，再慢慢变好。','h2'),P('这本书不是一份必须完成的任务清单。它把生活中常见的选择拆成成本、收益、证据和边界，帮你找到此刻值得做的一件事。','lead'),Rule()]
for a,b in [('01 / 按问题找章节','目录可点击，PDF 书签可以展开到每一条建议。手机上也可以直接搜索关键词。'),('02 / 先看「说人话」','先理解能做什么，再读成本、收益和备注。不要把相关性当成因果，也不要把人群平均值当成个人保证。'),('03 / 保留出处与边界','来源链接可点击。A、B、C 沿用原作者的评级，并不表示本站重新核实了每项结论。'),('04 / 按自己的节奏','正文之后收录 9 篇场景长文和 7 篇本站原创专题导读。短期用不上，也可以先放着。')]:story.extend([P(a,'h3'),P(b)])
story.extend([Spacer(1,20),P('版本与来源','h3'),P(f"正文同步：{data['version']} · {data['commit']}",'source'),P('原作：[eternity4719 / HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本站重新设计排版、阅读体验，并保留原创编辑寄语。人体系统专题为独立编写的导读，没有复制其上游正文或图片。','note'),P('字体：Noto Sans SC / SIL Open Font License。PDF 内嵌字形，正文为可搜索、可选择的文字；插画为矢量绘制。','note'),PageBreak(),P('目录 / CONTENTS','h2'),P('点击章节标题或页码，直接到达。PDF 书签还能展开每条建议。','note')])
toc=ElegantTOC();toc.levelStyles=[styles['toc']];toc.dotsMinLevel=0;story.extend([toc,PageBreak()])
for c in data['chapters']:
 quote=re.search(r'^本章提醒：(.*)$',c['intro'],re.M);q=quote[1] if quote else ''
 story.extend([ChapterOpening(str(c['n']).zfill(2),c['title'],'PART ONE / THE CHAPTERS',c['id'],q),PageBreak()])
 intro=re.sub(r'^本章提醒：.*$','',c['intro'],flags=re.M).strip();story.extend([P('这一章，先了解什么','h3'),*markdown(intro),Rule()])
 for e in c['entries']:
  title=P(str(e['n']).zfill(2)+' / '+e['title'],'title');title.entryKey=e['id'];title.entryTitle=f"{e['n']}. {e['title']}"
  story.extend([CondPageBreak(115),title])
  tags=e['tags'];meta=f"证据 {e['fields'].get('证据等级','')}   /   钱 {tags.get('钱','')}   /   时间 {tags.get('时间','')}   /   毅力 {tags.get('毅力','')}"
  story.extend([P(meta,'label'),P('说人话','label'),P(e['fields'].get('说人话',''),'lead')])
  for key,sty in [('成本','body'),('收益','body'),('备注','note'),('来源','source')]:
   if e['fields'].get(key):story.extend([P(key,'label'),P(e['fields'][key],sty)])
  story.append(Rule())
 story.append(PageBreak())
for typ,items,label in [('E',data['essays'],'PART TWO / LIFE CHECKLISTS'),('G',data['guides'],'PART THREE / HUMAN SYSTEM')]:
 for i,item in enumerate(items):
  story.extend([ChapterOpening(typ+str(i+1).zfill(2),item['title'],label,item['id']),PageBreak(),*markdown(item['md']),PageBreak()])
# Avoid an empty trailing page.
if isinstance(story[-1],PageBreak):story.pop()
doc=BookDoc(str(OUT),pagesize=(W,H),title='Better Life · 高性价比人生指南',author='eternity4719 / JackyMe',subject='完整本地阅读版 · '+data['version'],pageCompression=1)
doc.multiBuild(story,maxPasses=4)
Path('.cache/publication/pdf-map.json').write_text(json.dumps(doc.destinations,ensure_ascii=False,indent=2))
print('PDF created:',OUT,'pages:',doc.page,'bytes:',OUT.stat().st_size)
