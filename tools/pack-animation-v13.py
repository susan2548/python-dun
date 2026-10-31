"""Extract generated pose sheets, normalize scale once per actor, preserve alpha.

Only cropping/packing/nearest-neighbour normalization; no authored pixel edits.
Usage: python tools/pack-animation-v13.py ../asset-sources/sprite-sources-v13.json
"""
import json, sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image

root=Path(__file__).resolve().parents[1]
sources=json.loads(Path(sys.argv[1]).read_text())
out=root/'assets'/'animation-v13';out.mkdir(parents=True,exist_ok=True)
heroes=['adventurer','knight','wizard']
manifest={'version':13,'cell':256,'columns':4,'actors':{}}
for kind,path in sources.items():
    im=Image.open(path).convert('RGBA');data=np.array(im);alpha=data[:,:,3]
    count=16 if kind in heroes else 12
    labels,n=ndimage.label(alpha>180)
    sizes=np.bincount(labels.ravel());ids=np.argsort(sizes[1:])[-count:]+1
    regions=ndimage.find_objects(labels)
    # Each row has four major connected bodies; detached flecks are never rows.
    ids=sorted(ids,key=lambda i:(regions[i-1][0].start+regions[i-1][0].stop)/2)
    ordered=[]
    for row in range(count//4):ordered.extend(sorted(ids[row*4:row*4+4],key=lambda i:regions[i-1][1].start))
    cells=[];anchors=[];boxes=[]
    for ident in ordered:
        y,x=regions[ident-1]
        mask=ndimage.binary_dilation(labels==ident,iterations=2)
        isolated=data.copy();isolated[:,:,3]=np.where(mask,alpha,0)
        box=(max(0,x.start-2),max(0,y.start-2),min(im.width,x.stop+2),min(im.height,y.stop+2))
        crop=Image.fromarray(isolated).crop(box);a=np.array(crop)[:,:,3]
        foot=np.argwhere(a[max(0,a.shape[0]-15):]>180)
        anchor=(float(foot[:,1].min()+foot[:,1].max())/2) if len(foot) else crop.width/2
        cells.append(crop);anchors.append(anchor);boxes.append(box)
    # The generated spider release contains a baked web. Use the open-fang
    # contact pose instead; the runtime owns the timed web projectile.
    if kind=='spider':cells[10]=cells[6];anchors[10]=anchors[6]
    target={'spider':120,'golem':176,'skeleton':164,'wraith':165,'necromancer':172}.get(kind,174)
    # All poses share one scale. Root and weapon reach fit within 256 pixels.
    scale=min(target/cells[0].height,122/max(anchors),122/max(c.width-a for c,a in zip(cells,anchors)),236/max(c.height for c in cells))
    atlas=Image.new('RGBA',(1024,1280 if kind in heroes else 768))
    for i,(crop,anchor) in enumerate(zip(cells,anchors)):
        size=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
        small=crop.resize(size,Image.Resampling.NEAREST)
        atlas.alpha_composite(small,(i%4*256+128-round(anchor*scale),i//4*256+250-size[1]))
    if kind in heroes:
        old=Image.open(root/'assets'/'poses'/f'{kind}.png').convert('RGBA')
        old_idle=old.crop((0,0,256,256));old_height=old_idle.getbbox()[3]-old_idle.getbbox()[1]
        factor=cells[0].height*scale/old_height
        for p in range(2):
            cell=old.crop(((6+p)%4*256,256,(6+p)%4*256+256,512))
            bbox=cell.getbbox();piece=cell.crop(bbox);sz=(round(piece.width*factor),round(piece.height*factor))
            piece=piece.resize(sz,Image.Resampling.NEAREST);idx=16+p
            atlas.alpha_composite(piece,(idx%4*256+128-round((128-bbox[0])*factor),idx//4*256+250-round((250-bbox[1])*factor)))
    atlas.save(out/f'{kind}.png',optimize=True)
    manifest['actors'][kind]={'frames':count+(2 if kind in heroes else 0),'source':Path(path).name,'scale':round(scale,5),'boxes':boxes,'idleHeight':round(cells[0].height*scale),'file':f'{kind}.png'}
    print(kind,count,'idleHeight',round(cells[0].height*scale),'scale',round(scale,3))
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
