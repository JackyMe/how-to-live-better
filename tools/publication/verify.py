"""Content, link, font, geometry and reproducible visual proofs for the edition."""
from pathlib import Path
import fitz,json,re,unicodedata,hashlib,html
ROOT=Path(__file__).resolve().parents[2]
corpus=json.loads((ROOT/'.cache/publication/corpus.json').read_text());doc=fitz.open(ROOT/'output/pdf/Better-Life.pdf')
proof=ROOT/'.cache/publication/proof';proof.mkdir(exist_ok=True)
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',html.unescape(s)))
def plain(s):
 s=re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',r'\1',s);s=re.sub(r'<(https?://[^>]+)>',r'\1',s);return s.replace('**','').replace('`','').replace('⁻','-').replace('⁵','5')
text=''.join(p.get_text() for p in doc);normalized=norm(text);missing=[]
for c in corpus['chapters']:
 for e in c['entries']:
  for key,value in [('标题',e['title']),*e['fields'].items()]:
   if norm(plain(value)) not in normalized:missing.append((e['id'],key))
# Some text can cross page furniture. Strip running headings/folios before checking again.
body=''
for p in doc:
 body+=p.get_text(clip=fitz.Rect(0,34,p.rect.width,p.rect.height-36))
normalbody=norm(body)
entries={e['id']:e for c in corpus['chapters'] for e in c['entries']}
remaining=[]
for id,key in missing:
 value=entries[id]['title'] if key=='标题' else entries[id]['fields'][key]
 if norm(plain(value)) not in normalbody:remaining.append((id,key))
missing=remaining
assert not missing,('Missing PDF text',missing[:20])
extra_missing=[]
for item in corpus['essays']+corpus['guides']:
 for line in item['md'].splitlines():
  line=line.strip()
  if not line or line.startswith('[←') or line.startswith('<!--') or re.match(r'^[| :\-]+$',line):continue
  line=re.sub(r'^#+\s*|^[-*]\s+|^>\s*','',line)
  cells=line.strip('|').split('|') if line.startswith('|') else [line]
  for cell in cells:
   value=norm(plain(cell))
   if value and value not in normalized and value not in normalbody:extra_missing.append((item['id'],cell[:90]))
assert not extra_missing,('Missing extended reading text',extra_missing[:20])
expected=corpus['entries']+len(corpus['chapters'])+len(corpus['essays'])+len(corpus['guides']);assert len(doc.get_toc())==expected
bounds=[];empty=[];links=0;embedded=set()
for i,p in enumerate(doc):
 words=p.get_text('words')
 if len(words)<4:empty.append(i+1)
 for x0,y0,x1,y1,t,*_ in words:
  if x0<-.5 or y0<-.5 or x1>p.rect.width+.5 or y1>p.rect.height+.5:bounds.append((i+1,t))
 for l in p.get_links():
  if l['kind']==fitz.LINK_GOTO:assert 0<=l['page']<len(doc)
  links+=1
 for f in p.get_fonts():
  if 'Noto' in f[3]:assert len(doc.extract_font(f[0])[3])>0;embedded.add(f[3])
assert not bounds,bounds[:10];assert not empty,empty;assert embedded
m=json.loads((ROOT/'.cache/publication/pdf-map.json').read_text());samples={1,2,3,4,5,len(doc)}
for k in ['chapter-1','e-1-1','chapter-3','chapter-13','chapter-33','chapter-34','essay-家庭应急装备清单','essay-换工作、换城市之前','guide-sleep','guide-learning','guide-longevity']:
 if k in m:samples.update([m[k],min(m[k]+1,len(doc))])
for n in sorted(samples):doc[n-1].get_pixmap(matrix=fitz.Matrix(1.4,1.4)).save(proof/f'page-{n:03}.png')
manifest=json.loads((ROOT/'output/版本信息.json').read_text())
for p,expected in manifest['files'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==expected['sha256']
report={'pages':len(doc),'entriesChecked':corpus['entries'],'fieldsChecked':['标题','成本','说人话','收益','证据等级','来源','备注'],'outlineEntries':len(doc.get_toc()),'links':links,'embeddedChineseFonts':sorted(embedded),'outOfBounds':bounds,'emptyPages':empty,'visualSamplePages':sorted(samples)}
(proof/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
