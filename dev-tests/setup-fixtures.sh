#!/bin/bash
# Regenerates every image and file the tests load. Run once after a workspace reset.
set -e
mkdir -p /home/claude/sprites
mkdir -p /home/claude/sprites && cd /home/claude/sprites && python3 - <<'PY'
from PIL import Image
def draw(name, rows, pal):
    h=len(rows); w=max(len(r) for r in rows)
    im=Image.new("RGBA",(w,h),(0,0,0,0)); px=im.load()
    for y,r in enumerate(rows):
        for x,ch in enumerate(r):
            if ch in pal: px[x,y]=pal[ch]
    im.save(name+".png"); print(name, w, "x", h)

draw("heart", [
"..KKK...KKK..",
".KRRRK.KRRRK.",
"KRPPRRKRRRRRK",
"KRPRRRRRRRRRK",
"KRRRRRRRRRRRK",
".KRRRRRRRRRK.",
"..KRRRRRRRK..",
"...KRRRRRK...",
"....KRRRK....",
".....KRK.....",
"......K......"],
{"K":(90,20,30,255),"R":(225,45,70,255),"P":(255,170,190,255)})

draw("star", [
".......K.......",
"......KYK......",
"......KYK......",
".....KYWYK.....",
"KKKKKKYYYKKKKKK",
"KYYYYYYYYYYYYYK",
".KYYYYYYYYYYYK.",
"..KYYYYYYYYYK..",
"...KYYYYYYYK...",
"..KYYYYOYYYYK..",
"..KYYYOKOYYYK..",
".KYYYOK.KOYYYK.",
".KYYOK...KOYYK.",
"KYYOK.....KOYYK",
"KKKK.......KKKK"],
{"K":(120,70,10,255),"Y":(255,214,50,255),"W":(255,250,200,255),"O":(240,150,40,255)})

draw("rocket", [
".....K.....",
"....KRK....",
"...KRRRK...",
"...KWWWK...",
"..KWWWWWK..",
"..KWKKKWK..",
"..KWKBBKWK.",
"..KWKBBKWK.",
"..KWWKKWWK.",
"..KWWWWWWK.",
".KKWWWWWWKK",
"KRKWWWWWWKRK",
"KRRKWWWWKRRK",
"KKK.KOOK.KKK",
".....OYO....",
"......Y....."],
{"K":(35,40,60,255),"R":(215,40,60,255),"W":(235,238,245,255),"B":(80,170,240,255),"O":(250,140,30,255),"Y":(255,225,60,255)})

draw("flower", [
"....KKK.KKK....",
"...KPPPKPPPK...",
"...KPPPKPPPK...",
"KKK.KPPKPPK.KKK",
"KPPKKKYYYKKKPPK",
"KPPPPKYYYKPPPPK",
".KPPPKYOYKPPPK.",
"KPPPPKYYYKPPPPK",
"KPPKKKYYYKKKPPK",
"KKK.KPPKPPK.KKK",
"...KPPPKPPPK...",
"...KPPPKPPPK...",
"....KKKGKKK....",
"...GG..G.......",
"..GLLG.G..GG...",
"...GG..G.GLLG..",
".......G..GG...",
".......G......."],
{"K":(110,30,90,255),"P":(240,120,190,255),"Y":(255,220,70,255),"O":(240,150,40,255),"G":(40,120,60,255),"L":(110,200,90,255)})

draw("cat", [
".KK........KK.",
"KOOK......KOOK",
"KOPOK....KOPOK",
"KOOOKKKKKKOOOK",
"KOOOOOOOOOOOOK",
"KOOOOOOOOOOOOK",
"KOOKKOOOOKKOOK",
"KOOKGOOOOKGOOK",
"KOOOOOOOOOOOOK",
"KWWOOOPPOOOWWK",
"KOOOOKOOKOOOOK",
".KOOOOKKOOOOK.",
"..KKKKKKKKKK.."],
{"K":(60,35,25,255),"O":(245,150,50,255),"P":(250,170,180,255),"G":(70,170,90,255),"W":(255,240,225,255)})
PY
cd /home/claude/sprites && python3 -c "
from PIL import Image
for n in ['star','cat']:
    im=Image.open(n+'.png'); im.resize((im.width*2,im.height*2),Image.NEAREST).save(n+'2x.png')
"
cd /home/claude && python3 - <<'PY'

from PIL import Image, ImageDraw
im=Image.new('RGBA',(88,88),(0,0,0,0)); d=ImageDraw.Draw(im)
d.ellipse([2,2,85,85], fill=(60,110,220,255)); d.ellipse([22,22,65,65], fill=(250,210,60,255))
im.save('/tmp/big88.png'); print('88x88 test design')
PY
cd /home/claude && python3 - <<'PY'

from PIL import Image, ImageDraw
# gutterless sheet whose sprites are deliberately offset by 20,12 from origin
im=Image.new('RGB',(512,256),(20,20,30))
d=ImageDraw.Draw(im)
cols=[(220,60,60),(60,200,120),(70,120,230),(230,200,60),(210,80,200),(80,210,210),(200,130,60),(150,150,150)]
i=0
for r in range(2):
  for c in range(4):
    ox,oy=20+c*120, 12+r*120
    d.ellipse([ox+10,oy+10,ox+90,oy+90], fill=cols[i]); i+=1
im.save('/tmp/offsheet.png')
print('512x256 sheet, sprites on a 120px pitch offset by 20,12')

PY
cd /home/claude && python3 - <<'PY'

from PIL import Image, ImageDraw
# opaque sprite on a flat background, plus an interior hole of the same colour
im=Image.new('RGB',(40,40),(80,160,220))
d=ImageDraw.Draw(im)
d.ellipse([8,8,31,31], fill=(220,70,70))
d.ellipse([17,15,22,20], fill=(80,160,220))   # interior hole, same as background
im.save('/tmp/sprite_bg.png')
print('made 40x40: red disc on blue, with a blue eye hole')

PY
cd /home/claude && python3 - <<'PY'
import json
# an export from "another device": 2 designs (one this device will already have) + 3 color adjustments + progress
data = {"format":"beadboard-library","version":3,
  "designs":[{"id":"dSHARED","name":"Shared star","w":2,"h":2,"rle":"4:131"},
             {"id":"dNEW","name":"New heart","w":2,"h":1,"rle":"2:120"}],
  "calibration":{"G9":[150,120,90],"H2":[250,250,245],"A1":[240,230,200]},
  "checked":["G9","H2","A1","B4"]}
json.dump(data, open('/tmp/other-device.json','w'))
print('test export written')
PY
python3 - <<'PY'
from PIL import Image, ImageDraw
im=Image.new('RGB',(4032,3024)); d=ImageDraw.Draw(im)
for y in range(0,3024,8): d.rectangle([0,y,4032,y+8], fill=(80+y//24, 120+y//40, 200-y//30))
d.ellipse([1200,700,2900,2400], fill=(232,186,152)); d.ellipse([1600,1200,1750,1350], fill=(60,40,35)); d.ellipse([2350,1200,2500,1350], fill=(60,40,35))
im.save('/tmp/big.jpg', quality=88)
im=Image.new('RGB',(900,600)); d=ImageDraw.Draw(im)
for y in range(600): d.line([(0,y),(900,y)], fill=(int(120+100*y/600), int(170-60*y/600), 235))
d.ellipse([560,90,760,290], fill=(250,210,60)); d.polygon([(0,600),(0,420),(300,250),(620,600)], fill=(60,140,70)); d.polygon([(300,600),(700,330),(900,470),(900,600)], fill=(40,100,55))
im.save('/home/claude/refphoto.jpg', quality=92)
rows=["................","......KKKK......","....KKYYYYKK....","...KYYYYYYYYK...","..KYYKYYYYKYYK..","..KYYKYYYYKYYK..",".KYYYYYYYYYYYYK.",".KYRYYYYYYYYRYK.",".KYYYKYYYYKYYYK.",".KYYYYKKKKYYYYK.","..KYYYYYYYYYYK..","..KYYYYYYYYYYK..","...KYYYYYYYYK...","....KKYYYYKK....","......KKKK......","................"]
pal={'K':(30,30,30,255),'Y':(250,210,40,255),'R':(240,90,110,255),'.':(0,0,0,0)}
im=Image.new('RGBA',(16,16))
for y,r in enumerate(rows):
    for x,ch in enumerate(r): im.putpixel((x,y),pal[ch])
im.save('/home/claude/sprites/smiley.png')
PY
python3 -c "
from PIL import Image, ImageDraw
im=Image.new('RGB',(400,400),(40,90,200)); d=ImageDraw.Draw(im); d.rectangle([198,198,201,201], fill=(220,30,40)); im.save('/home/claude/detail.png')"
echo "fixtures ready"
