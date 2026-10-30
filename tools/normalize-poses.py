"""Deterministic sprite extraction and atlas packing; no painting or generation."""
from pathlib import Path
import argparse
from PIL import Image
import numpy as np
from scipy import ndimage

p = argparse.ArgumentParser()
p.add_argument('mode', choices=['seed', 'pack'])
p.add_argument('source')
p.add_argument('output')
p.add_argument('--index', type=int, default=0)
p.add_argument('--monster', action='store_true')
p.add_argument('--frames', type=int, default=8)
a = p.parse_args()
im = Image.open(a.source).convert('RGBA')
out = Path(a.output)
out.parent.mkdir(parents=True, exist_ok=True)
if a.mode == 'seed':
    width = im.width / 3
    height = im.height/(2 if a.monster else 1)
    col, row = a.index%3, a.index//3 if a.monster else 0
    im.crop((round(col*width), round(row*height), round((col+1)*width), round((row+1)*height))).save(out)
else:
    # Locate connected sprites rather than cutting a foot/staff at an approximate
    # generated grid boundary. Alpha mattes preserve edges and remove neighbours.
    data = np.array(im)
    labels, count = ndimage.label(data[:,:,3] > 100)
    sizes = np.bincount(labels.ravel())
    ids = np.argsort(sizes[1:])[-a.frames:]+1
    regions = ndimage.find_objects(labels)
    ids = sorted(ids, key=lambda i: ((regions[i-1][0].start+regions[i-1][0].stop)//2//525, regions[i-1][1].start))
    cells, boxes = [], []
    for ident in ids:
        y, x = regions[ident-1]
        box = (max(0,x.start-2), max(0,y.start-2), min(im.width,x.stop+2), min(im.height,y.stop+2))
        mask = ndimage.binary_dilation(labels==ident, iterations=2)
        isolated = data.copy()
        isolated[:,:,3] = np.where(mask, data[:,:,3], 0)
        cells.append(Image.fromarray(isolated).crop(box))
        boxes.append(box)
    # Pelvis/stance roots are reviewed against the sheet. A raised idle foot must
    # not drag the entire actor sideways just because only one sole is planted.
    roots = {
        'adventurer':[200,557,894,1290,209,555,991,1365],
        'knight':[170,555,897,1290,170,555,992,1360],
        'wizard':[180,550,930,1295,180,535,960,1360],
        'zombie':[300,812,1280,345,790,1280],
        'skeleton':[335,847,1320,400,840,1330],
        'spider':[280,792,1300,330,830,1300],
        'wraith':[230,742,1250,300,800,1250],
        'golem':[300,812,1300,340,800,1300],
        'necromancer':[290,802,1300,350,800,1300],
    }[out.stem]
    anchors = [root-box[0] for root,box in zip(roots,boxes)]
    scale = min(120/max(anchors), 120/max(cell.width-anchor for cell,anchor in zip(cells,anchors)), 232/max(cell.height for cell in cells))
    columns = a.frames//2
    atlas = Image.new('RGBA', (columns*256, 512))
    for i, cell in enumerate(cells):
        crop = cell
        anchor = anchors[i]
        crop = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.NEAREST)
        atlas.alpha_composite(crop, (i%columns*256+128-round(anchor*scale), i//columns*256+250-crop.height))
    atlas.save(out)
    print({'atlas': str(out), 'scale': scale, 'sourceBoxes': boxes})
