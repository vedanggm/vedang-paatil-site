#!/usr/bin/env node
/**
 * Recursively discovers and downloads every asset referenced by the Next.js build
 * (runtime-loaded chunks, CSS, media) that a plain wget mirror misses.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = '/home/user/mirror/louisraille.fr';
const ORIGIN = 'https://louisraille.fr';

const seen = new Set();
const queue = [];
let downloaded = 0;
let failed = [];

function fetchBuf(urlPath) {
  return new Promise((resolve, reject) => {
    https
      .get(ORIGIN + urlPath, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mirror)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchBuf(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          if (res.statusCode === 200) resolve(Buffer.concat(chunks));
          else reject(new Error('HTTP ' + res.statusCode));
        });
      })
      .on('error', reject);
  });
}

function enqueue(urlPath) {
  const clean = urlPath.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return;
  if (seen.has(clean)) return;
  seen.add(clean);
  queue.push(clean);
}

function extractRefs(text) {
  const out = new Set();
  // absolute /_next and asset paths appearing anywhere in JS/CSS
  const patterns = [
    /"(\/_next\/[A-Za-z0-9_./-]+\.(?:js|css|woff2|woff|png|jpg|jpeg|gif|svg|mp4|webm|json))"/g,
    /'(\/_next\/[A-Za-z0-9_./-]+\.(?:js|css|woff2|woff|png|jpg|jpeg|gif|svg|mp4|webm|json))'/g,
    /(?:src|href)\s*[:=]\s*"([^"]+\.(?:js|css|mp4|webm|mp3|woff2|png|jpg|jpeg|gif|svg))"/g,
    // webpack css chunk name mapping: "static/css/<file>.css"
    /(static\/css\/[0-9a-f]+\.css)/g,
    // bare static chunk filenames referenced dynamically
    /(static\/chunks\/[A-Za-z0-9_./-]+\.js)/g,
    /(\/[A-Za-z0-9_-]+\/script\.js)/g,
    // plain asset dirs
    /"(\/(?:images|works|frame|da|gen|fonts|library|prompts|downloads)\/[^"]+\.(?:mp4|webm|mp3|wav|png|jpg|jpeg|gif|svg|woff2|zip|json|html|txt))"/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text))) {
      let p = m[1];
      if (p.startsWith('static/')) p = '/_next/' + p;
      out.add(p);
    }
  }
  return out;
}

(async () => {
  // Seed with everything already known to be requested by the live site
  const seeds = [
    '/_next/static/chunks/b536a0f1.4493c535fb7041a7.js',
    '/_next/static/chunks/bd904a5c.e882b45541361835.js',
    '/_next/static/chunks/8535.acf7138e23d108de.js',
    '/_next/static/chunks/9702.adab36c09352e4b7.js',
    '/_next/static/css/3d3197a07eeb2bab.css',
    '/_next/static/css/03e8f5accf9de01a.css',
    '/6e2563eabe7a1c7e/script.js',
    '/eafd9ba2cb378f0b/script.js',
  ];
  seeds.forEach(enqueue);

  // Seed by scanning every file already mirrored
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) walk(fp);
      else if (/\.(js|css|html)$/.test(e.name) && !/\.mp4$/.test(e.name)) {
        const txt = fs.readFileSync(fp, 'utf8');
        for (const r of extractRefs(txt)) {
          const local = path.join(ROOT, r);
          if (!fs.existsSync(local)) enqueue(r);
        }
      }
    }
  };
  walk(ROOT);

  let round = 0;
  while (queue.length && round < 12) {
    round++;
    const batch = queue.splice(0, queue.length);
    console.log(`--- round ${round}: ${batch.length} candidates`);
    for (const p of batch) {
      const local = path.join(ROOT, p);
      try {
        const buf = await fetchBuf(p);
        fs.mkdirSync(path.dirname(local), { recursive: true });
        fs.writeFileSync(local, buf);
        downloaded++;
        console.log('  ok ' + p + ' (' + buf.length + 'b)');
        if (/\.(js|css)$/.test(p)) {
          for (const r of extractRefs(buf.toString('utf8'))) {
            if (!fs.existsSync(path.join(ROOT, r))) {
              if (!seen.has(r)) {
                seen.add(r);
                queue.push(r);
              }
            }
          }
        }
      } catch (e) {
        failed.push(p + ' :: ' + e.message);
        console.log('  FAIL ' + p + ' :: ' + e.message);
      }
    }
  }

  console.log('\nDownloaded: ' + downloaded);
  console.log('Failed: ' + failed.length);
  failed.forEach((f) => console.log('  ' + f));
})();
