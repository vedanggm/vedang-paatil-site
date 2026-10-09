const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const bad = [];
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(r.status() + ' ' + r.url());
  });
  page.on('requestfailed', (r) => bad.push('FAILED ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  page.on('pageerror', (e) => bad.push('JSERROR ' + e.message + ' | stack: ' + String(e.stack).split('\n').slice(0, 3).join(' <- ')));

  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(10000);

  console.log('=== problem requests ===');
  const seen = new Set();
  for (const b of bad) {
    if (seen.has(b)) continue;
    seen.add(b);
    console.log(b);
  }
  await browser.close();
})();
