const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('JS: ' + e.message.slice(0, 100)));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('_vercel')) errs.push(r.status() + ' ' + r.url().slice(0, 90));
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(10000);

  const data = await page.evaluate(() => {
    const link = (sel) => [...document.querySelectorAll(sel)].map((a) => ({
      href: a.getAttribute('href'),
      label: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 40),
    }));
    return {
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content,
      allLinks: link('a[href^="mailto:"], a[href*="github.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="cal.com"]'),
      banner: document.body.innerText.replace(/\s+/g, ' ').match(/VEDANG[^A-Za-z]{0,6}PAATIL/) || null,
      copyright: (document.body.innerText.match(/©[^\n]{0,60}/) || [null])[0],
      qrSrc: document.querySelector('img[alt*="QR" i]')?.getAttribute('src') || null,
      scrollHeight: document.body.scrollHeight,
      canvases: document.querySelectorAll('canvas').length,
      videos: document.querySelectorAll('video').length,
    };
  });

  console.log('title      :', data.title);
  console.log('desc       :', data.desc);
  console.log('banner     :', data.banner && data.banner[0]);
  console.log('copyright  :', data.copyright);
  console.log('qr src     :', data.qrSrc);
  console.log('structure  : ' + data.canvases + ' canvases, ' + data.videos + ' videos, h=' + data.scrollHeight);
  console.log('errors     :', errs.length ? errs : 'none');
  console.log('\nlinks:');
  const seen = new Set();
  for (const l of data.allLinks) {
    const k = l.href + '|' + l.label;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log('   ' + (l.href || '').padEnd(42) + '  [' + l.label + ']');
  }

  await page.screenshot({ path: '/home/user/verify/screenshots/rebrand-hero.png' });
  await browser.close();
})();
