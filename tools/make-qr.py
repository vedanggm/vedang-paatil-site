#!/usr/bin/env python3
"""
Regenerate the header QR to point at the new Instagram URL, matching the
original's geometry and visual style exactly.

Measured from the source image:
  canvas    478 x 439
  QR block  392 x 392 at (43, 29)
  module    8 px  -> 49 modules  (version 8)
  style     rounded dots (0.88 module), merging on adjacency; rounded finders
  halo      logo footprint cleared to radius ~71.5 px (8.9 modules)
  logo      Instagram glyph, 119x119 rounded square (corner r~34),
            centre (239, 225), max radius 70.2 px
"""
import json
from PIL import Image, ImageDraw, ImageFilter

SRC = '/home/user/tools/assets/logo-source-qr.jpg'
OUT = '/home/user/mirror/vedangpaatil/images/qr-instagram.jpg'

CW, CH = 478, 439
OX, OY = 43, 29
M, V = 8, 49
BLOCK = M * V

CX, CY = 239.0, 225.0
R_HALO = 71.5
R_LIFT = 74.0          # scan radius when extracting the logo
DOT = 0.88
SS = 6
R_OUTER, R_HOLE, R_CENTER = 15, 10, 9

spec = json.load(open('/home/user/tools/qr-matrix.json'))
matrix, size = spec['matrix'], spec['size']
assert size == V, size

# ---------------------------------------------------------------- render dots
W, H = CW * SS, CH * SS
img = Image.new('L', (W, H), 255)
d = ImageDraw.Draw(img)


def rr(x0, y0, x1, y1, radius, fill):
    d.rounded_rectangle([x0 * SS, y0 * SS, x1 * SS, y1 * SS], radius=radius * SS, fill=fill)


is_finder = [[False] * V for _ in range(V)]
for r0, c0 in [(0, 0), (0, V - 7), (V - 7, 0)]:
    for r in range(r0, r0 + 7):
        for c in range(c0, c0 + 7):
            is_finder[r][c] = True

rad = DOT * M / 2
for r in range(V):
    for c in range(V):
        if is_finder[r][c] or not matrix[r][c]:
            continue
        ccx = OX + (c + 0.5) * M
        ccy = OY + (r + 0.5) * M
        d.ellipse([(ccx - rad) * SS, (ccy - rad) * SS, (ccx + rad) * SS, (ccy + rad) * SS], fill=0)

for r0, c0 in [(0, 0), (0, V - 7), (V - 7, 0)]:
    x, y = OX + c0 * M, OY + r0 * M
    rr(x, y, x + 7 * M, y + 7 * M, R_OUTER, 0)
    rr(x + M, y + M, x + 6 * M, y + 6 * M, R_HOLE, 255)
    rr(x + 2 * M, y + 2 * M, x + 5 * M, y + 5 * M, R_CENTER, 0)

img = img.resize((CW, CH), Image.LANCZOS).convert('RGB')

# ------------------------------------------------- clear the logo footprint
halo = Image.new('L', (CW, CH), 0)
ImageDraw.Draw(halo).ellipse([CX - R_HALO, CY - R_HALO, CX + R_HALO, CY + R_HALO], fill=255)
img.paste(Image.new('RGB', (CW, CH), (255, 255, 255)), (0, 0), halo)

# ------------------------------------------------------- extract the logo art
# Lift only the glyph: dark pixels near the centre that are NOT grid-aligned dots,
# so no fragment of the old code's data leaks into the new image.
src = Image.open(SRC).convert('L')
sp = src.load()
sw, sh = src.size

# detected data-dot centres of the ORIGINAL, on the 8px grid
dot_centres = []
for r in range(V):
    for c in range(V):
        x = OX + (c + 0.5) * M
        y = OY + (r + 0.5) * M
        xi, yi = int(x), int(y)
        if not (0 <= xi < sw and 0 <= yi < sh):
            continue
        if sp[xi, yi] >= 128:
            continue
        diag = 3.4
        corners = [sp[int(x - diag), int(y - diag)], sp[int(x + diag), int(y - diag)],
                   sp[int(x - diag), int(y + diag)], sp[int(x + diag), int(y + diag)]]
        if all(v >= 140 for v in corners):
            dot_centres.append((x, y))

logo_mask = Image.new('L', (CW, CH), 0)
lm = logo_mask.load()
for y in range(CH):
    for x in range(CW):
        if sp[x, y] >= 128:
            continue
        dist_c = ((x - CX) ** 2 + (y - CY) ** 2) ** 0.5
        if dist_c > R_LIFT:
            continue
        if any((x - dx) ** 2 + (y - dy) ** 2 <= 4.2 ** 2 for dx, dy in dot_centres):
            continue
        lm[x, y] = 255

logo_mask = logo_mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
img.paste(src.convert('RGB'), (0, 0), logo_mask)

img.save(OUT, 'JPEG', quality=88, subsampling=0)
print('written', OUT, img.size, '| dots excluded from lift:', len(dot_centres))
