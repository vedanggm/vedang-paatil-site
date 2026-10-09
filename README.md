# VEDANG PAATIL — Portfolio Site

A rebranded 1:1 clone of a Next.js creative-developer portfolio, running fully offline.
Every asset is the real production build — fonts, WebGL model, video reels, and the
original CSS/GSAP animation code — with the identity strings swapped.

```bash
node server.js          # → http://localhost:3000
```

---

## What changed in the rebrand

| Item | Original | Now |
|---|---|---|
| Name (title, meta, body, footer) | Louis Raillé | **Vedang Paatil** |
| Hero banner | `LOUIS ✦ RAILLÉ` | **`VEDANG ✦ PAATIL`** |
| Email | raillelouis@gmail.com | **vedangcorpo@gmail.com** |
| Email (footer display) | RAILLELOUIS@GMAIL.COM | **VEDANGCORPO@GMAIL.COM** |
| GitHub | github.com/Louis-CFM | **github.com/vedanggm** |
| Instagram | instagram.com/louis_rlee | **instagram.com** |
| Header QR code | encoded his Instagram profile | **re-encoded to instagram.com** |
| Footer LinkedIn label | `linkedin / louis-raillé` | **`linkedin`** |

40 occurrences of `Louis`, 38 of `Raillé`, and every linked handle were rewritten across
13 files — HTML pages, the Next.js page/layout bundles, and the prompt demo pages — in both
literal UTF-8 and JS-escaped (`\xe9`) forms.

### Two problems worth knowing about

**1. The hero name was invisible to search-and-replace.** The banner renders each letter as its
own `<span>`, so `LOUIS` never appears as a contiguous string in the HTML. A literal replacement
silently missed it, leaving the server-rendered markup saying `LOUIS` while the client bundle said
`VEDANG` — which React flagged as hydration error #418. `tools/fix-banner-chars.py` rebuilds the
per-character markup properly. Caught by diffing the JS-disabled DOM against the hydrated DOM.

**2. The QR code had to be regenerated, not edited.** It encoded his Instagram URL, so it was
stale. The image was rebuilt at the original's exact geometry — 478×439 canvas, 49 modules
(version 8), 8 px/module, rounded-dot style, rounded finders — with **error correction H** so the
centred logo overlay is recoverable. The Instagram glyph itself was lifted pixel-for-pixel from the
original rather than redrawn. Verified with `zbarimg`:

```
$ zbarimg --quiet --raw images/qr-instagram.jpg
https://www.instagram.com/
```

It stays scannable at the same sizes the original was (decodes at 144 px+, not below) — an
identical scannability profile, not a regression.

---

## Verification

Rendered in headless Chromium and compared against the untouched original mirror:

| Route | Errors (orig → new) | Page height |
|---|---|---|
| `/` | 0 → 0 | 16 509 px |
| `/library` | 0 → 0 | 900 px |
| `/cgv` | 0 → 0 | 4 106 px |
| `/confidentialite` | 0 → 0 | 3 275 px |
| `/cookies` | 0 → 0 | 2 132 px |
| `/mentions-legales` | 0 → 0 | 1 745 px |

Layout, structure (4 WebGL canvases, 10 video reels, 8 sections) and animation code are untouched —
only the identity strings differ. Light mode, responsive breakpoints and the theme toggle all still
work.

Live link check:

```
https://www.instagram.com/     [Instagram]
https://github.com/vedanggm    [GitHub]
mailto:vedangcorpo@gmail.com   [Mail]
```

---

## Layout

```
mirror/vedangpaatil/        the rebranded site (68 MB, served at the root)
mirror/louisraille.fr/      the original mirror, kept for diffing
server.js                   static server: image-optimizer endpoint, HTTP Range, clean URLs
tools/
├── rebrand.js              ordered string replacement (specific → generic)
├── fix-banner-chars.py     rebuilds the per-character hero banner
├── make-qr-matrix.js       encodes the new URL as a version-8/EC-H matrix
├── make-qr.py              renders it in the original's style + lifts the logo
├── route-parity.js         per-route error/height comparison
├── hyd.js                  hydration-error check
└── assets/                 source QR kept for the logo lift
```

Rebuild the QR: `node tools/make-qr-matrix.js && python3 tools/make-qr.py`
Serve the original instead: `SITE_DIR=louisraille.fr node server.js`

---

## 100% clean — verified four ways

No trace of the original identity remains anywhere in the site. Checked by:

| Sweep | Method | Result |
|---|---|---|
| Text files | recursive case-insensitive grep | clean |
| **Images** | **Tesseract OCR over every .jpg/.png/.gif** | clean |
| **Archives** | extracted `ai-status-orb.zip`, grepped source | clean |
| Binaries | raw byte scan (videos, `.glb`, fonts) | clean |

### Places a text-only search would have missed

Three of them, each found by a different sweep:

**1. The hero banner** — each letter is its own `<span>`, so `LOUIS` never appears as a contiguous
string in the HTML. The literal replacement silently skipped it, leaving server-rendered markup
saying `LOUIS` while the client bundle said `VEDANG` — which React reported as **hydration error
#418**. `tools/fix-banner-chars.py` rebuilds the per-character markup.

**2. The preview screenshots** — the `ai-status-orb` library previews are static PNGs with the
name baked in as *pixels*: at `x57..130, y47..57`, colour `rgb(156,158,151)` on `rgb(12,13,13)`.
`tools/fix-orb-preview.py` clears that region with the sampled background and re-renders
**Vedang Paatil** in Inter at the matched size, baseline and left edge.

**3. The downloadable ZIP** — `ai-status-orb.zip` carries the name in its README plus a domain
comment in every source file. `tools/fix-zip.py` rewrites the contents and repacks the archive.

## Resolved in this pass

| Item | Now |
|---|---|
| `/library` back-link | `— VEDANGPAATIL.COM` |
| `/confidentialite` cookie notice | `vedangpaatil.com/cookies` |
| `robots.txt` sitemap | `vedangpaatil.com/sitemap.xml` |
| Book a call (×2) | `cal.com/vedangpaatil/decouverte` |
| Body text ("…by Vedang Paatil"), footer, prompt pages | all rebranded |

Structural parity is intact: **0 console errors on all six routes**, same page heights, same
WebGL/video counts. Small text-length deltas (e.g. `/` is 4394 vs 4406 chars) are just the new
name and domain being longer — expected, not breakage.

## Two placeholders to replace

1. **Book a call** → `cal.com/vedangpaatil/decouverte`. Swap in your real Cal.com link and I'll update it.
2. **LinkedIn** → points at `linkedin.com` itself, since no profile was given. Send the handle.
3. **`vedangpaatil.com`** is a placeholder domain I inferred. Tell me the real one and I'll swap it.

The site still contains the original photographer's imagery, video reels and `medusa.glb` wireframe
model — fine for local/personal use, but replace those assets before publishing publicly.
