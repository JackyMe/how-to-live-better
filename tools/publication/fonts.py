"""Download the OFL font once, verify bytes, and instantiate reusable static faces."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import subprocess,hashlib,json
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'.cache/publication';folder.mkdir(parents=True,exist_ok=True)
config=json.loads((ROOT/'tools/publication/font-source.json').read_text());font=folder/'NotoSansSC.ttf'
if not font.exists():subprocess.run(['curl','-L','--fail','--retry','2',config['url'],'-o',str(font)],check=True)
if hashlib.sha256(font.read_bytes()).hexdigest()!=config['sha256']:raise RuntimeError('Font checksum changed: review font-source.json before updating.')
for name,weight in [('Regular',400),('Bold',600)]:
 out=folder/f'NotoSansSC-{name}.ttf'
 psname='NotoSansSC-'+name
 if not out.exists() or TTFont(out)['name'].getDebugName(6)!=psname:
  face=instantiateVariableFont(TTFont(font),{'wght':weight},inplace=True)
  for nameid,value in [(1,'Noto Sans SC'),(2,name),(3,psname),(4,'Noto Sans SC '+name),(6,psname)]:
   for platform,encoding,language in [(3,1,0x409),(1,0,0)]:face['name'].setName(value,nameid,platform,encoding,language)
  face.save(out)
print('Verified embedded Noto Sans SC fonts.')
