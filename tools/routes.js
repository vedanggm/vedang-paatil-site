const { chromium } = require('playwright-core');

const ROUTES = ['/', '/library', '/cgv', '/confidentialite', '/cookies', '/mentions-legales'];

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });

  for (const route of ROUTES) {
    const report = {};
    for (const [name, base] of [['live', 'https://louisraille.fr'], ['clone', 'http://localhost:3000']]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
      const page = await ctx.newPage();
      const bad = [];
      page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('_vercel')) bad.push(r.status() + ' ' + r.url().slice(0, 90)); });
      page.on('pageerror', (e) => bad.push('JS: ' + e.message.slice(0, 90)));
      let title = '(goto failed)';
      try {
        await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
        await page.waitForTimeout(7000);
        title = await page.title();
      } catch (e) { bad.push('GOTO: ' + e.message.slice(0, 80)); }
      const h = await page.evaluate(() => document.body.scrollHeight).catch(() => 0);
      const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').length).catch(() => 0);
      report[name] = { title, scrollHeight: h, textLen: txt, problems: [...new Set(bad)].slice(0, 6) };
      await ctx.close();
    }
    const ok = report.live.title === report.clone.title && Math.abs(report.live.scrollHeight - report.clone.scrollHeight) < 40;
    console.log(`${ok ? 'MATCH ' : 'DIFF  '} ${route}`);
    console.log(`   live : "${report.live.title}" h=${report.live.scrollHeight} txt=${report.live.textLen} probs=${report.live.problems.length}`);
    console.log(`   clone: "${report.clone.title}" h=${report.clone.scrollHeight} txt=${report.clone.textLen} probs=${report.clone.problems.length}`);
    if (report.clone.problems.length) console.log('   clone problems: ' + JSON.stringify(report.clone.problems));
  }
  await browser.close();
})();
