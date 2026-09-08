#!/usr/bin/env python3
"""Remove background from Apple iPhone images using connected-component flood fill.
Works because Apple images have transparent corners + uniform #F5F5F7 background."""
import time, sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

IMG_DIR = Path(__file__).parent

files = sorted(f for f in IMG_DIR.glob("*.png") if f.stem not in ("remove_bg", "remove_bg_v2") and not f.stem.endswith("_orig"))
total = len(files)
start = time.time()

for i, path in enumerate(files, 1):
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    h, w = arr.shape[:2]
    alpha = arr[:,:,3]
    rgb = arr[:,:,:3].astype(int)

    # Background candidates: transparent OR close to Apple's bg color #F5F5F7
    bg_color = np.array([245, 245, 247])
    diff = np.abs(rgb - bg_color).max(axis=2)
    candidate_bg = (alpha < 10) | ((diff < 22) & (alpha > 200))

    # Label connected components
    labeled, _ = ndimage.label(candidate_bg)

    # Components touching corners/edges = true background
    edge_pts = [(0,0), (0,w-1), (h-1,0), (h-1,w-1),
                (0,w//4), (0,w//2), (0,3*w//4),
                (h-1,w//4), (h-1,w//2), (h-1,3*w//4),
                (h//4,0), (h//2,0), (3*h//4,0),
                (h//4,w-1), (h//2,w-1), (3*h//4,w-1)]
    bg_labels = set(labeled[y,x] for y,x in edge_pts if labeled[y,x] != 0)

    bg_mask = np.isin(labeled, list(bg_labels))
    result = arr.copy()
    result[bg_mask, 3] = 0

    fg_pct = (~bg_mask).mean() * 100
    Image.fromarray(result).save(path, 'PNG')
    elapsed = time.time() - start
    eta = (elapsed / i) * (total - i)
    print(f"[{i}/{total}] {path.name} | fg={fg_pct:.1f}% | {elapsed:.0f}s dec, ETA {eta:.0f}s", flush=True)

print(f"\nConcluído! {total} imagens em {time.time()-start:.0f}s")
