#!/usr/bin/env python3
"""Remove background from all iPhone images using rembg AI."""
import os, time, io
from pathlib import Path
from rembg import remove, new_session
from PIL import Image

IMG_DIR = Path(__file__).parent
session = new_session("u2net")

files = sorted(f for f in IMG_DIR.glob("*.png") if f.name != "remove_bg.py")
total = len(files)
start = time.time()

for i, path in enumerate(files, 1):
    out = path.with_stem(path.stem)  # overwrite in place
    with open(path, "rb") as f:
        data = f.read()
    result = remove(data, session=session)
    img = Image.open(io.BytesIO(result))
    img.save(path, "PNG")
    elapsed = time.time() - start
    eta = (elapsed / i) * (total - i)
    print(f"[{i}/{total}] {path.name} — {elapsed:.0f}s decorridos, ETA {eta:.0f}s", flush=True)

print(f"\nConcluído! {total} imagens processadas em {time.time()-start:.0f}s")
