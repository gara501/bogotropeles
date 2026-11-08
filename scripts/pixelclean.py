#!/usr/bin/env python3
"""Limpia una fila/sheet de sprites 'pixel art' generada por IA.

Pasos: alpha duro -> detectar frames -> cuantizar paleta compartida ->
reducir a pixel logico (moda por bloque) -> alinear pies -> exportar.

Uso: python3 pixelclean.py entrada.png salida_prefijo [--k 4] [--colors 28]
                           [--cell-w 0] [--cell-h 0]
"""
import argparse
import numpy as np
from PIL import Image


def find_frames(mask, min_w=20, merge_gap=12):
    cols = mask.any(0)
    segs, s = [], None
    for i, c in enumerate(cols):
        if c and s is None:
            s = i
        if not c and s is not None:
            segs.append([s, i - 1]); s = None
    if s is not None:
        segs.append([s, len(cols) - 1])
    merged = []
    for sg in segs:
        if merged and sg[0] - merged[-1][1] <= merge_gap:
            merged[-1][1] = sg[1]
        else:
            merged.append(sg)
    return [(a, b) for a, b in merged if b - a + 1 >= min_w]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--k', type=int, default=4, help='pixeles reales por pixel logico')
    ap.add_argument('--colors', type=int, default=28)
    ap.add_argument('--cell-w', type=int, default=0)
    ap.add_argument('--cell-h', type=int, default=0)
    ap.add_argument('--pad', type=int, default=2, help='margen en pixeles logicos')
    ap.add_argument('--scale', type=int, default=4, help='escala del PNG final')
    a = ap.parse_args()

    im = Image.open(a.src).convert('RGBA')
    arr = np.array(im)
    mask = arr[..., 3] >= 128                      # alpha duro: mata halos
    rgb = arr[..., :3].copy()
    rgb[~mask] = 0

    # paleta compartida por todos los frames
    flat = Image.fromarray(rgb[mask].reshape(-1, 1, 3), 'RGB')
    q = flat.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[:a.colors * 3]).reshape(-1, 3)
    idx = np.full(mask.shape, -1, dtype=np.int16)
    idx[mask] = np.array(q).reshape(-1)

    frames = find_frames(mask)
    print('frames:', frames)
    k = a.k
    tiles = []
    for (x0, x1) in frames:
        sub = mask[:, x0:x1 + 1]
        ys = np.where(sub.any(1))[0]
        y0, y1 = ys.min(), ys.max()
        # anclar el bloque al borde inferior (pies) para que la grilla no se desplace
        H = ((y1 - y0 + 1) + k - 1) // k * k
        W = ((x1 - x0 + 1) + k - 1) // k * k
        top = y1 + 1 - H
        crop = idx[max(top, 0):y1 + 1, x0:x0 + W]
        if crop.shape[0] < H:
            crop = np.vstack([np.full((H - crop.shape[0], crop.shape[1]), -1, np.int16), crop])
        if crop.shape[1] < W:
            crop = np.hstack([crop, np.full((crop.shape[0], W - crop.shape[1]), -1, np.int16)])
        h, w = H // k, W // k
        out = np.full((h, w), -1, np.int16)
        for by in range(h):
            for bx in range(w):
                blk = crop[by * k:(by + 1) * k, bx * k:(bx + 1) * k].ravel()
                opaque = blk[blk >= 0]
                if len(opaque) * 2 >= blk.size:    # >=50% opaco
                    out[by, bx] = np.bincount(opaque).argmax()
        tiles.append(out)

    cw = a.cell_w or max(t.shape[1] for t in tiles) + a.pad * 2
    ch = a.cell_h or max(t.shape[0] for t in tiles) + a.pad * 2
    sheet = np.full((ch, cw * len(tiles)), -1, np.int16)
    for i, t in enumerate(tiles):
        h, w = t.shape
        ox = i * cw + (cw - w) // 2
        oy = ch - a.pad - h                          # pies en la misma linea
        sheet[oy:oy + h, ox:ox + w] = t

    out = np.zeros((*sheet.shape, 4), np.uint8)
    ok = sheet >= 0
    out[ok, :3] = pal[sheet[ok]]
    out[ok, 3] = 255
    logical = Image.fromarray(out, 'RGBA')
    logical.save(f'{a.out}_logico.png')
    logical.resize((logical.width * a.scale, logical.height * a.scale), Image.NEAREST).save(f'{a.out}_x{a.scale}.png')
    print('celda logica', cw, 'x', ch, '| sheet', logical.size, '| colores usados', len(np.unique(sheet[ok])))


if __name__ == '__main__':
    main()
