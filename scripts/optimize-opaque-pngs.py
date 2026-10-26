#!/usr/bin/env python3
"""Recompress fully opaque, large PNGs (backgrounds, intro/boss cards) to 256-colour PNG8 with libimagequant.

Same file names and format, so no code or test changes are needed. Sprites with transparency are skipped on purpose:
the game thresholds alpha and chroma-keys edges at runtime (src/data/spriteSheets.js), which palette alpha could disturb.
Originals are copied to backups/png-originals/ (git-ignored) before being replaced.

    pip install pillow imagequant numpy
    python scripts/optimize-opaque-pngs.py [--min-kb 250] [--min-psnr 32] [--dry-run]
"""
import argparse, io, math, os, shutil, sys
import imagequant, numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('andino/reference.png', 'andino/preview.png')  # dev-only reference art, not bundled


def psnr(a, b):
    a = np.asarray(a.convert('RGB'), dtype=float); b = np.asarray(b.convert('RGB'), dtype=float)
    mse = ((a - b) ** 2).mean()
    return 99.0 if mse == 0 else 10 * math.log10(255 * 255 / mse)


def is_opaque(im):
    if im.mode == 'RGBA': return im.getchannel('A').getextrema()[0] == 255
    return im.mode in ('RGB', 'L') or (im.mode == 'P' and 'transparency' not in im.info)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--min-kb', type=int, default=250)
    ap.add_argument('--min-psnr', type=float, default=32.0)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    saved = 0
    for base, _, files in os.walk(os.path.join(ROOT, 'src')):
        for name in sorted(files):
            path = os.path.join(base, name); rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
            if not name.endswith('.png') or rel.endswith(SKIP) or os.path.getsize(path) < args.min_kb * 1024: continue
            im = Image.open(path)
            if not is_opaque(im): continue
            im = im.convert('RGB')
            q = imagequant.quantize_pil_image(im.convert('RGBA'), dithering_level=0.8, max_colors=256, min_quality=0, max_quality=100)
            buf = io.BytesIO(); q.save(buf, 'PNG', optimize=True)
            before, after, score = os.path.getsize(path), buf.tell(), psnr(im, q)
            ok = after < before * 0.9 and score >= args.min_psnr
            print(f"{'OK  ' if ok else 'skip'} {rel}: {before/1e6:.2f} -> {after/1e6:.2f} MB, PSNR {score:.1f}")
            if not ok or args.dry_run: continue
            backup = os.path.join(ROOT, 'backups', 'png-originals', rel)
            if not os.path.exists(backup):
                os.makedirs(os.path.dirname(backup), exist_ok=True); shutil.copy2(path, backup)
            with open(path, 'wb') as f: f.write(buf.getvalue())
            saved += before - after
    print(f"saved {saved/1e6:.1f} MB")


if __name__ == '__main__':
    sys.exit(main())
