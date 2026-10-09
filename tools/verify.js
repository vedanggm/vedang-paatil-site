const { chromium } = require('playwright-core');
const fs = require('fs');

const TARGETS = [
  { name: 'live', url: 'https://louisraille.fr/' },
  { name: 'clone', url: 'http://localhost:3000/' },
];

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const results = {};

  for (const t of TARGETS) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];

    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
    page.on('requestfailed', (r) => failed.push(r.url().slice(0, 120) + ' :: ' + (r.failure()?.errorText || '')));

    try {
      await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
    } catch (e) {
      console.log(t.name + ' goto error: ' + e.message);
    }
    await page.waitForTimeout(9000); // let preloader / animations settle

    const info = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      lang: document.documentElement.lang,
      canvases: document.querySelectorAll('canvas').length,
      imgs: document.querySelectorAll('img').length,
      videos: document.querySelectorAll('video').length,
      sections: document.querySelectorAll('section').length,
      bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
      scrollHeight: document.body.scrollHeight,
      fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 800).map((e) => getComputedStyle(e).fontFamily))].slice(0, 8),
      hasCanvasPixels: [...document.querySelectorAll('canvas')].map((c) => {
        try { return c.width + 'x' + c.height; } catch { return 'err'; }
      }),
    }));

    await page.screenshot({ path: `/home/user/verify/${t.name}-viewport.png` });

    // full page (long) screenshot
    try {
      await page.screenshot({ path: `/home/user/verify/${t.name}-full.png`, fullPage: true });
    } catch (e) {
      console.log(t.name + ' fullpage screenshot failed: ' + e.message);
    }

    results[t.name] = { info, errors: errors.slice(0, 25), failed: failed.slice(0, 25) };
    await ctx.close();
  }

  fs.mkdirSync('/home/user/verify', { recursive: true });
  fs.writeFileSync('/home/user/verify/report.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
