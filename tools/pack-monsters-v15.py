"""Crop/normalize approved full animation sheets with a shared per-actor scale.
No painting, recoloring or synthetic poses. ImageGen owns sprite artwork.
"""
import json,sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];out=root/'assets'/'animation-v15';out.mkdir(exist_ok=True)
sources=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'));manifest={'cell':256,'columns':4,'actors':{}}
preview=Image.new('RGB',(12*128, len(sources)*150),'#112129');pd=ImageDraw.Draw(preview)
for row,(kind,path) in enumerate(sources.items()):
 im=Image.open(path).convert('RGBA');data=np.array(im);alpha=data[:,:,3];labels,n=ndimage.label(alpha>160)
 sizes=np.bincount(labels.ravel());ids=list(np.argsort(sizes[1:])[-12:]+1);regions=ndimage.find_objects(labels)
 ids.sort(key=lambda i:(regions[i-1][0].start+regions[i-1][0].stop)/2)
 ordered=[]
 for r in range(3):ordered.extend(sorted(ids[r*4:r*4+4],key=lambda i:regions[i-1][1].start))
 if min(sizes[ids])<1200:raise ValueError(f'{kind}: merged or missing sprite body, smallest {min(sizes[ids])}')
 cells=[];boxes=[];anchors=[]
 for ident in ordered:
  y,x=regions[ident-1];box=(max(0,x.start-2),max(0,y.start-2),min(im.width,x.stop+2),min(im.height,y.stop+2))
  isolated=data.copy();mask=ndimage.binary_dilation(labels==ident,iterations=2);isolated[:,:,3]=np.where(mask,alpha,0)
  crop=Image.fromarray(isolated).crop(box)
  # Align grounded bodies from their lowest physical contact band. Flying actors
  # use the main chassis, not a different wing-tip extent on each frame.
  a=np.array(crop)[:,:,3];foot=np.argwhere(a[max(0,a.shape[0]-12):]>160)
  anchor=(float(foot[:,1].min()+foot[:,1].max())/2) if len(foot) else crop.width/2
  if kind in ('bat','sentinel'):anchor=crop.width*.52
  cells.append(crop);boxes.append(box);anchors.append(anchor)
 target={'slime':112,'mimic':125,'scarab':108,'bat':145,'icewolf':145,'sentinel':156}[kind]
 scale=min(target/cells[0].height,121/max(anchors),121/max(c.width-a for c,a in zip(cells,anchors)),234/max(c.height for c in cells))
 atlas=Image.new('RGBA',(1024,768))
 for i,(crop,anchor) in enumerate(zip(cells,anchors)):
  size=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)));small=crop.resize(size,Image.Resampling.NEAREST)
  atlas.alpha_composite(small,(i%4*256+128-round(anchor*scale),i//4*256+250-size[1]))
  thumb=atlas.crop((i%4*256,i//4*256,(i%4+1)*256,(i//4+1)*256)).resize((128,128),Image.Resampling.NEAREST)
  preview.paste(thumb,(i*128,row*150+20),thumb)
 atlas.save(out/(kind+'.png'),optimize=True)
 # Map portraits are the shipped idle frame, not a different stock character.
 portrait=atlas.crop((0,0,256,256));portrait.save(out/(kind+'-portrait.png'),optimize=True)
 pd.text((3,row*150+2),kind,fill='#ebd4a1')
 manifest['actors'][kind]={'file':kind+'.png','frames':12,'source':Path(path).name,'scale':round(scale,5),'boxes':boxes,'idleHeight':round(cells[0].height*scale)}
 print(kind,'frames',12,'idle height',round(cells[0].height*scale),'body pixels',list(map(int,sizes[ordered])))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
preview.save(root.parent/'asset-sources'/'monsters-v115-preview.jpg')
