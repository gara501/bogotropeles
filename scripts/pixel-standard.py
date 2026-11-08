"""Street Bogotá · pixel-art standard for every character sheet outside the main beat 'em up.

Reference look = the main gameplay sprites: crisp pixels of ~2 screen px, a limited palette taken from each
character's main sheet, hard alpha. For each sheet we know its frame layout and on-screen scale, so the block size
(source px per art pixel) is chosen to give the same on-screen pixel in every mode:

    block = round(TARGET_SCREEN_PX / display_scale)

Frames are processed one by one with the grid anchored on the foot baseline, so anchors, frame sizes and feet stay
exactly where the game expects them. Originals are copied once to backups/pixel-standard/ (re-running starts from the
backup, so the script is idempotent).

    python scripts/pixel-standard.py            # all modes
    python scripts/pixel-standard.py aura       # only one family (aura, monserrate, cycling)
    python scripts/pixel-standard.py --preview  # writes output/pixel-standard-preview.png, touches nothing
"""
from pathlib import Path
import shutil, sys, json, hashlib
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / 'backups/pixel-standard'
TARGET_SCREEN_PX = 2.0
HEROES = ['office', 'student', 'teleperforman', 'gymbro', 'magolita']
MAIN_SHEET = {k: ROOT / f'src/data/players/player_{i+1}.png' for i, k in enumerate(HEROES)}
PALETTE_SIZE = {'hero': 48, 'cast': 40}

def block_for(scale):
    return max(1, round(TARGET_SCREEN_PX / scale))

def sheets():
    """(family, path, frame layout, display scale, palette owner)"""
    out = []
    aura = ROOT / 'src/scenes/aura/game'
    for k in HEROES:
        for move in ['idle', 'six-seven', 'boat-paddle-dance', 'mewing', 'chen-chupas', 'sigma-finish']:
            out.append(('aura', aura / f'players-v2/{k}-{move}.png', dict(w=256, h=512, baseline=450), 184 / 280, k))
        out.append(('aura', aura / f'players-v2/{k}-walk.png', dict(w=224, h=256, baseline=240), 184 / 184, k))
    for name in ['gordo-idle-taunt', 'gordo-crowd-hype', 'gordo-defeat']:
        out.append(('aura', aura / f'cast-v2/{name}.png', dict(w=256, h=512, baseline=450), 190 / 280, None))
    out.append(('aura', aura / 'cast-v2/crowd.png', dict(w=192, h=256, baseline=240), 115 / 200, None))
    mon = ROOT / 'src/scenes/monserrate/game'
    for k in HEROES:
        out.append(('monserrate', mon / f'{k}.png', dict(w=192, h=256, baseline=240), 152 / 208, k))
    for i in range(8):
        out.append(('monserrate', mon / f'hiker-{i}.png', dict(w=192, h=256, baseline=240), 152 / 208, None))
    out.append(('monserrate', mon / 'vendors.png', dict(w=192, h=256, baseline=240), 152 / 208, None))
    for i, k in enumerate(HEROES):
        # cycling sheets are cut by transparency at runtime (rows [4,4]); one global grid keeps every pose intact
        out.append(('cycling', ROOT / f'src/data/cycling/player_{i+1}.png', None, None, k))
    return [s for s in out if s[1].exists()]

_main = {}
def main_palette(owner, n=64):
    if owner not in _main:
        a = np.array(Image.open(MAIN_SHEET[owner]).convert('RGBA'))
        px = a[a[:, :, 3] > 200][:, :3]
        q = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8)).quantize(n, method=Image.Quantize.MEDIANCUT)
        _main[owner] = np.array(q.getpalette()[:n * 3], dtype=np.int32).reshape(-1, 3)
    return _main[owner]

def palette(owner, src):
    """The sheet's own limited palette; for heroes, every colour close to one in the main gameplay sheet is
    replaced by it, so jackets, skin and hair share the exact tones of the main game without hue jumps."""
    a = np.array(src)
    px = a[a[:, :, 3] > 200][:, :3]
    n = PALETTE_SIZE['hero' if owner else 'cast']
    q = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8)).quantize(n, method=Image.Quantize.MEDIANCUT)
    pal = np.array(q.getpalette()[:n * 3], dtype=np.int32).reshape(-1, 3)
    if owner:
        ref = main_palette(owner)
        d = np.sqrt(((pal[:, None, :] - ref[None, :, :]) ** 2).sum(2))
        near = d.min(1) < 26
        pal[near] = ref[d.argmin(1)[near]]
    return pal

def lock(img, b, pal, baseline=None):
    """Snap an RGBA image to a b×b art-pixel grid (anchored so a block ends on the baseline) and a palette."""
    a = np.array(img.convert('RGBA')).astype(np.float64)
    H, W = a.shape[:2]
    oy = (baseline % b) if baseline else 0
    pad_top = (b - oy) % b
    Hp = ((pad_top + H + b - 1) // b) * b
    Wp = ((W + b - 1) // b) * b
    big = np.zeros((Hp, Wp, 4))
    big[pad_top:pad_top + H, :W] = a
    alpha = big[:, :, 3:4] / 255
    blocks = lambda arr: arr.reshape(Hp // b, b, Wp // b, b, -1)
    cover = blocks(alpha).mean((1, 3))[:, :, 0]
    rgb = blocks(big[:, :, :3] * alpha).sum((1, 3)) / np.maximum(blocks(alpha).sum((1, 3)), 1e-6)
    solid = cover >= .4
    if baseline:  # the block row standing on the floor keeps any foot pixel, so feet stay planted
        row = (pad_top + baseline) // b - 1
        if 0 <= row < solid.shape[0]:
            solid[row] |= cover[row] > 0
    d = ((rgb[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(3)
    snapped = pal[d.argmin(2)]
    out = np.zeros((Hp // b, Wp // b, 4), np.uint8)
    out[:, :, :3] = snapped
    out[:, :, 3] = solid * 255
    up = np.repeat(np.repeat(out, b, 0), b, 1)[pad_top:pad_top + H, :W]
    return Image.fromarray(up, 'RGBA')

def cycling_scale(path):
    # CyclingStage: setScale(138 / referenceHeight); referenceHeight = height of the first pose row
    a = np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 0
    busy = a.sum(1) >= 3
    runs, start = [], None
    for y, on in enumerate(list(busy) + [False]):
        if on and start is None: start = y
        if not on and start is not None:
            if y - start >= 40: runs.append((start, y))
            start = None
    top, bottom = runs[0]
    if len(runs) < 2:  # the two pose rows touch: split the band in half
        bottom = top + (bottom - top) / 2
    return 138 / (bottom - top)

MANIFEST = BACKUP / 'manifest.json'
_hash = lambda p: hashlib.sha1(Path(p).read_bytes()).hexdigest()
_cache = {}
def _manifest():
    if 'm' not in _cache:
        _cache['m'] = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    return _cache['m']

def process(family, path, layout, scale, owner):
    rel = path.relative_to(ROOT)
    backup = BACKUP / rel
    done = _manifest().get(str(rel))
    # new art dropped in place (its hash is not the one we wrote): it becomes the new source
    if not backup.exists() or (done and _hash(path) != done):
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, backup)
    src = Image.open(backup).convert('RGBA')
    pal = palette(owner, src)
    if layout is None:
        scale = cycling_scale(backup)
        b = block_for(scale)
        result = lock(src, b, pal)
    else:
        b = block_for(scale)
        result = Image.new('RGBA', src.size, (0, 0, 0, 0))
        for top in range(0, src.height, layout['h']):
            for left in range(0, src.width, layout['w']):
                cell = src.crop((left, top, left + layout['w'], top + layout['h']))
                result.paste(lock(cell, b, pal, layout['baseline']), (left, top))
    return rel, b, scale, src, result

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    preview = '--preview' in sys.argv
    todo = [s for s in sheets() if not args or s[0] in args]
    shots = []
    for job in todo:
        rel, b, scale, before, after = process(*job)
        print(f'{rel}: block {b}px · {b * scale:.2f} screen px per art pixel')
        if preview:
            shots.append((before, after))
        else:
            after.save(ROOT / rel, optimize=True)
            _manifest()[str(rel)] = _hash(ROOT / rel)
    if not preview:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(_manifest(), indent=1))
    if preview and shots:
        tiles = [(bf.crop(bf.getbbox()), af.crop(af.getbbox())) for bf, af in shots[:6]]
        W = sum(t[0].width for t in tiles) + 10 * len(tiles); H = max(t[0].height for t in tiles) * 2 + 20
        sheet = Image.new('RGBA', (W, H), (60, 62, 72, 255)); x = 0
        for bf, af in tiles:
            sheet.paste(bf, (x, 0), bf); sheet.paste(af, (x, H // 2 + 10), af); x += bf.width + 10
        (ROOT / 'output').mkdir(exist_ok=True); sheet.save(ROOT / 'output/pixel-standard-preview.png')

if __name__ == '__main__':
    main()
