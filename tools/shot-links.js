const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage();
  await p.goto('http://localhost:3000/', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(10000);
  // the LINKS column sits near the bottom of the page, top-right of the contact block
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1900));
  await p.waitForTimeout(2500);
  const box = await p.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'Links');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('Links label box:', box);
  if (box) {
    await p.screenshot({ path:'/home/user/verify/screenshots/links-column-now.png',
      clip:{ x: Math.max(0, box.x - 320), y: Math.max(0, box.y - 24), width: 520, height: 130 } });
    console.log('cropped saved');
  }
  await b.close();
})();
