#!/usr/bin/env python3
"""
Replace the byline baked into the ai-status-orb preview screenshots.

The previews are static screenshots of the demo page, so the old name is
pixels, not text. This clears the byline area with the surrounding background
colour and re-renders "Vedang Paatil" in Inter at the same size, colour,
baseline and left edge as the original.

Measured from the source:
  text region   x 55..141, baseline y ~57, cap height ~11px
  glyph colour  ~rgb(156,158,151)
  background    ~rgb(12,13,13)
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np

FONT = '/tmp/inter/extras/otf/Inter-Regular.otf'
TARGETS = [f'/home/user/mirror/vedangpaatil/library/ai-status-orb/preview-{i}.png' for i in range(1, 6)]

# region to clear + draw into (generous, keeps clear of the orb and the corner art)
BOX = (44, 34, 200, 74)
LEFT, BASELINE = 57, 57
TEXT = 'Vedang Paatil'


def measure_font(size):
    """Return (width, ascent, descent) for the text at a given px size."""
    f = ImageFont.truetype(FONT, size)
    l, t, r, b = f.getbbox(TEXT)
    return f, (r - l), t, b, l


def fit_size(target_w):
    """Find the point size whose rendered width best matches the original."""
    best = None
    for size in range(8, 26):
        f, w, t, b, l = measure_font(size)
        if best is None or abs(w - target_w) < abs(best[1] - target_w):
            best = (size, w, f, t, b, l)
    return best


before = Image.open('mirror/louisraille.fr/library/ai-status-orb/preview-1.png').convert('RGB')
bb = np.array(before)
reg = bb[40:65, 50:145].mean(axis=2)
ys, xs = np.nonzero(reg > 90)
orig_x0, orig_x1 = 50 + xs.min(), 50 + xs.max()
orig_w = orig_x1 - orig_x0 + 1
print(f'original byline width: {orig_w}px  (x {orig_x0}..{orig_x1})')

size, w, font, t, b, l = fit_size(orig_w)
print(f'chosen Inter size: {size}px -> width {w}px (target {orig_w}px), bbox top {t} bottom {b}')

for path in TARGETS:
    im = Image.open(path).convert('RGB')
    a = np.array(im)

    # background colour sampled from just outside the text box on both sides
    bg = np.concatenate([
        a[BOX[1]:BOX[3], BOX[0] - 12:BOX[0]].reshape(-1, 3),
        a[BOX[1]:BOX[3], BOX[2]:BOX[2] + 12].reshape(-1, 3),
        a[BOX[1] - 6:BOX[1], BOX[0]:BOX[2]].reshape(-1, 3),
    ]).mean(axis=0).round().astype(int)
    colour = tuple(int(c) for c in bg)
    print(f'  {path.split("/")[-1]}: bg={colour}')

    ImageDraw.Draw(im).rectangle(BOX, fill=colour)

    d = ImageDraw.Draw(im)
    # anchor 'ls' = left edge at the baseline, so every preview lines up identically
    d.text((LEFT, BASELINE), TEXT, font=font, fill=(156, 158, 151), anchor='ls')

    im.save(path)
print('done — 5 previews retouched')
