#!/usr/bin/env node
/**
 * Static server for the louisraille.fr 1:1 clone.
 *
 * Implements the few dynamic behaviours the original Next.js app used:
 *   - /_next/image?url=..&w=..&q=..  → Next.js image optimizer endpoint
 *   - HTTP Range requests (206)      → required by <video> playback
 *   - clean-URL → .html resolution   → /library, /cgv, /prompts/...
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// The site folder sits next to this script in the download, and under mirror/
// inside the original workspace. Find whichever exists.
function findRoot() {
  const candidates = [
    process.env.SITE_DIR && path.join(__dirname, process.env.SITE_DIR),
    path.join(__dirname, 'public'),
    path.join(__dirname, 'site'),
    path.join(__dirname, 'mirror', 'vedangpaatil'),
    path.join(__dirname, 'mirror', 'louisraille.fr'),
    __dirname,
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) return c;
  }
  return path.join(__dirname, 'public');
}
const ROOT = findRoot();
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.zip': 'application/zip',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
};

const mime = (p) => TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream';

function resolveFile(urlPath) {
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(ROOT, safe);
  if (!base.startsWith(ROOT)) return null;

  const candidates = [
    base,
    base + '.html',
    path.join(base, 'index.html'),
    base + '/index.html',
  ];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* next */
    }
  }
  return null;
}

// Code and markup must always revalidate: this site is edited in place, and a
// stale cached JS chunk will happily re-render components we have removed.
const NO_STORE = new Set(['.html', '.js', '.mjs', '.css', '.json']);
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

function sendFile(req, res, file, status = 200) {
  const stat = fs.statSync(file);
  const type = mime(file);
  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges': 'bytes',
    ...(NO_STORE.has(ext) ? NO_STORE_HEADERS : { 'Cache-Control': 'public, max-age=3600' }),
  };

  // Range support — lets <video>/<audio> seek and stream properly
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      let start = m[1] === '' ? null : parseInt(m[1], 10);
      let end = m[2] === '' ? null : parseInt(m[2], 10);
      if (start === null && end !== null) {
        start = Math.max(stat.size - end, 0);
        end = stat.size - 1;
      } else {
        if (start === null) start = 0;
        if (end === null || end >= stat.size) end = stat.size - 1;
      }
      if (start > end || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      headers['Content-Length'] = end - start + 1;
      res.writeHead(206, headers);
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
  }

  headers['Content-Length'] = stat.size;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  let parsed;
  try {
    parsed = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  const pathname = decodeURIComponent(parsed.pathname);

  // --- Next.js image optimizer endpoint -------------------------------------
  if (pathname === '/_next/image') {
    const src = parsed.searchParams.get('url');
    if (!src) {
      res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Missing url');
      return;
    }
    const file = resolveFile(decodeURIComponent(src));
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Image not found: ' + src);
      return;
    }
    // Serve the original bytes: identical pixels, no dependency on sharp/libvips.
    return sendFile(req, res, file);
  }

  // --- Everything else: static ----------------------------------------------
  const file = resolveFile(pathname);
  if (file) return sendFile(req, res, file);

  // Missing asset → transparent pixel for images, plain text otherwise
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(pathname)) {
    const px = path.join(ROOT, 'images', 'asset-star.svg');
    if (fs.existsSync(px)) return sendFile(req, res, px);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — ' + pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Clone server → http://${HOST}:${PORT}`);
  console.log(`Serving    → ${ROOT}`);
});
