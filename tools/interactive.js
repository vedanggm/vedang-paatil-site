const { chromium } = require('playwright-core');

async function probe(browser, name, base, viewport, label) {
  const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('_vercel')) errs.push(r.status() + ' ' + r.url().slice(0, 80)); });
  await page.goto(base, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(8000);

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  // click the theme (moon/sun) toggle — 2nd button in the theme cell
  let afterToggle = null;
  try {
    const btn = await page.$('button[aria-label*="theme" i], button[aria-label*="mode" i], header button');
    const buttons = await page.$$('button');
    // theme toggle is typically the button containing an svg moon/sun near the nav
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const t = btns.find((b) => /theme|mode|dark|light/i.test(b.getAttribute('aria-label') || b.title || ''));
      if (t) { t.click(); return t.getAttribute('aria-label') || t.title || 'unnamed'; }
      return null;
    });
    if (clicked) {
      await page.waitForTimeout(1500);
      afterToggle = { label: clicked, bg: await page.evaluate(() => getComputedStyle(document.body).backgroundColor) };
    }
  } catch (e) { afterToggle = { error: e.message.slice(0, 80) }; }

  // mobile menu
  let menu = null;
  if (viewport.width < 900) {
    menu = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /menu|burger|nav/i.test(x.getAttribute('aria-label') || ''));
      return b ? (b.getAttribute('aria-label') || 'menu-btn') : null;
    });
  }

  await page.screenshot({ path: `/home/user/verify/${label}-${name}.png` });
  await ctx.close();
  return { bg, afterToggle, hasMenuBtn: menu, errs: [...new Set(errs)].slice(0, 5) };
}

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const cases = [
    ['desktop-1440', { width: 1440, height: 900 }],
    ['mobile-390', { width: 390, height: 844 }],
    ['tablet-834', { width: 834, height: 1112 }],
  ];
  for (const [label, vp] of cases) {
    const live = await probe(browser, 'live', 'https://louisraille.fr/', vp, label);
    const clone = await probe(browser, 'clone', 'http://localhost:3000/', vp, label);
    console.log(`\n### ${label}`);
    console.log('  bg       live=' + live.bg + '  clone=' + clone.bg + (live.bg === clone.bg ? '  MATCH' : '  DIFF'));
    console.log('  theme    live=' + JSON.stringify(live.afterToggle) + '\n           clone=' + JSON.stringify(clone.afterToggle));
    console.log('  menuBtn  live=' + live.hasMenuBtn + ' clone=' + clone.hasMenuBtn);
    console.log('  errors   live=' + live.errs.length + ' clone=' + clone.errs.length + (clone.errs.length ? ' ' + JSON.stringify(clone.errs) : ''));
  }
  await browser.close();
})();
