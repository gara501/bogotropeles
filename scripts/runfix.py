#!/usr/bin/env python3
"""Retoque del ciclo de correr generado por Pixelab (9 frames de 128x128 en tira)."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC, OUT = sys.argv[1], sys.argv[2]
NO_CLOSE = '--no-close' in sys.argv          # no agregar el frame de cierre (copia del 5)
HEAD_CX = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--head-cx=')), None)  # centrar por la cabeza
COLORS = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--colors=')), 28)
OUTLINE = (20, 16, 28)
CX = 72        # centro objetivo del torso
CELL = 128

sheet = np.array(Image.open(SRC).convert('RGBA'))
n = sheet.shape[1] // CELL
frames = [sheet[:, i * CELL:(i + 1) * CELL].copy() for i in range(n)]

# 10o frame: transicion de cierre = frame 5 (misma silueta que la transicion 4->6)
if not NO_CLOSE: frames.append(frames[4].copy())

# 1) alfa duro + quitar motas aisladas
for f in frames:
    m = f[..., 3] >= 128
    lab, k = ndi.label(m, structure=np.ones((3, 3)))
    if k > 1:
        sizes = ndi.sum(m, lab, range(1, k + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 25])
        m = m & keep
    f[..., 3] = np.where(m, 255, 0)
    f[~m, :3] = 0

# 2) paleta unica para todos los frames
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f in frames])
q = Image.fromarray(allpx.reshape(-1, 1, 3).astype(np.uint8), 'RGB').quantize(
    colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
pal = np.array(q.getpalette()[:COLORS * 3]).reshape(-1, 3)
for f in frames:
    m = f[..., 3] > 0
    px = f[m][:, :3].astype(int)
    d = ((px[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
    f[m, :3] = pal[d.argmin(1)]

# 3) contorno exterior uniforme de 1px
def lum(p): return 0.3 * p[..., 0] + 0.59 * p[..., 1] + 0.11 * p[..., 2]
for f in frames:
    m = f[..., 3] > 0
    er = ndi.binary_erosion(m, structure=ndi.generate_binary_structure(2, 1))
    border = m & ~er
    dark = lum(f[border][:, :3].astype(float)) < 60
    if dark.mean() < 0.7:               # contorno ausente/debil -> lo agrego por fuera
        ring = ndi.binary_dilation(m, structure=ndi.generate_binary_structure(2, 1)) & ~m
        f[ring, :3] = OUTLINE
        f[ring, 3] = 255
    else:                               # ya tiene contorno: unificar su color
        f[border & (lum(f[..., :3].astype(float)) < 60), :3] = OUTLINE

# 4) centrar el torso (mitad superior) en CX, conservando la altura vertical
def torso_cx(f):
    m = f[..., 3] > 0
    ys = np.where(m.any(1))[0]
    top, bot = ys.min(), ys.max()
    if HEAD_CX is not None:
        xs = np.where(m[top:top + 22].any(0))[0]
        return (xs.min() + xs.max()) / 2
    up = m[top:top + (bot - top) // 2]
    xs = np.where(up.any(0))[0]
    return (xs.min() + xs.max()) / 2

fixed = []
for f in frames:
    dx = int(round((HEAD_CX if HEAD_CX is not None else CX) - torso_cx(f)))
    g = np.zeros_like(f)
    if dx >= 0: g[:, dx:] = f[:, :CELL - dx]
    else: g[:, :CELL + dx] = f[:, -dx:]
    fixed.append(g)

strip = np.concatenate(fixed, axis=1)
Image.fromarray(strip).save(f'{OUT}_x1.png')
Image.fromarray(strip).resize((strip.shape[1] * 4, strip.shape[0] * 4), Image.NEAREST).save(f'{OUT}_x4.png')

# GIF de prueba
imgs = []
for g in fixed:
    bg = Image.new('RGBA', (CELL, CELL), (150, 150, 150, 255))
    bg.alpha_composite(Image.fromarray(g))
    imgs.append(bg.resize((CELL * 3, CELL * 3), Image.NEAREST).convert('P', palette=Image.ADAPTIVE))
imgs[0].save(f'{OUT}_preview.gif', save_all=True, append_images=imgs[1:], duration=70, loop=0)
print('frames', len(fixed), 'colores', len(np.unique(strip[strip[..., 3] > 0][:, :3], axis=0)))
