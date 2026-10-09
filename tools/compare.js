const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const fs = require('fs');

const OUT = '/home/user/verify';
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { name: 'live', url: 'https://louisraille.fr/' },
  { name: 'clone', url: 'http://localhost:3000/' },
];

// Scroll stops used for section-by-section comparison
const STOPS = [0, 0.12, 0.3, 0.5, 0.7, 0.88];

async function capture(t) {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  await page.goto(t.url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(10000);

  // Structure snapshot
  const dom = await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')];
    const boxes = els.map((e) => {
      const r = e.getBoundingClientRect();
      return {
        tag: e.tagName,
        cls: (typeof e.className === 'string' ? e.className : '').slice(0, 90),
        x: Math.round(r.x),
        y: Math.round(r.y + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    const text = document.body.innerText.replace(/\s+/g, ' ').trim();
    return { count: els.length, boxes, text, html: document.body.innerHTML.length };
  });

  // Full-page screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${t.name}-full.png`, fullPage: true });

  // Section screenshots
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < STOPS.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.floor(H * STOPS[i]));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${t.name}-stop${i}.png` });
  }

  await browser.close();
  return { dom, height: H };
}

function diffPNG(a, b) {
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) {
    return { mismatch: `size ${A.width}x${A.height} vs ${B.width}x${B.height}` };
  }
  let diff = 0;
  const total = A.width * A.height;
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    const d =
      Math.abs(A.data[p] - B.data[p]) +
      Math.abs(A.data[p + 1] - B.data[p + 1]) +
      Math.abs(A.data[p + 2] - B.data[p + 2]);
    if (d > 24) diff++; // tolerate minor AA / timing noise
  }
  return { width: A.width, height: A.height, pctDiff: ((diff / total) * 100).toFixed(2) };
}

(async () => {
  const res = {};
  for (const t of TARGETS) {
    console.error('capturing ' + t.name + ' …');
    res[t.name] = await capture(t);
    console.error('  done, dom elements: ' + res[t.name].dom.count + ', height ' + res[t.name].height);
  }

  const report = { dom: {}, pixels: {} };
  report.dom.liveCount = res.live.dom.count;
  report.dom.cloneCount = res.clone.dom.count;
  report.dom.liveHeight = res.live.height;
  report.dom.cloneHeight = res.clone.height;
  report.dom.liveText = res.live.dom.text.slice(0, 300);
  report.dom.cloneText = res.clone.dom.text.slice(0, 300);
  report.dom.textIdentical = res.live.dom.text === res.clone.dom.text;

  // element-by-element structural match (same order, tag, class, geometry)
  let matched = 0;
  let geomMismatch = 0;
  let classMismatch = 0;
  const n = Math.min(res.live.dom.boxes.length, res.clone.dom.boxes.length);
  for (let i = 0; i < n; i++) {
    const a = res.live.dom.boxes[i];
    const b = res.clone.dom.boxes[i];
    if (a.tag === b.tag) matched++;
    if (a.cls !== b.cls) classMismatch++;
    if (Math.abs(a.x - b.x) > 2 || Math.abs(a.w - b.w) > 2 || Math.abs(a.h - b.h) > 2) geomMismatch++;
  }
  report.dom.sameTagSamePosition = `${matched}/${n}`;
  report.dom.classMismatch = classMismatch;
  report.dom.geometryMismatch = geomMismatch;

  report.pixels.full = diffPNG(`${OUT}/live-full.png`, `${OUT}/clone-full.png`);
  for (let i = 0; i < STOPS.length; i++) {
    report.pixels['stop' + i] = diffPNG(`${OUT}/live-stop${i}.png`, `${OUT}/clone-stop${i}.png`);
  }

  fs.writeFileSync(`${OUT}/comparison.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
