from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageChops
root=Path('scrollcraft/builds/showroom/verification')
for prefix in ['desktop','phone','compact','reduced']:
    files=sorted(root.glob(prefix+'-*.png'))
    if not files: continue
    tiles=[]
    for f in files:
        im=Image.open(f).convert('RGB');im.thumbnail((280,400));tile=Image.new('RGB',(300,430),'#d7d7d7');tile.paste(im,((300-im.width)//2,20));ImageDraw.Draw(tile).text((10,411),f.name,fill='black');tiles.append(tile)
    sheet=Image.new('RGB',(300*4,430*((len(tiles)+3)//4)),'#d7d7d7')
    for i,t in enumerate(tiles):sheet.paste(t,((i%4)*300,(i//4)*430))
    sheet.save(root/(prefix+'-sheet.jpg'))
a=Image.open(root/'silver.png').convert('RGB');b=Image.open(root/'red-side.png').convert('RGB');print('Car state pixel difference bounding box:',ImageChops.difference(a,b).getbbox())
