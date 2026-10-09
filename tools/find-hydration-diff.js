const { chromium } = require('playwright-core');

(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});

  // 1) server-rendered DOM (JS disabled)
  const c1 = await b.newContext({ viewport:{width:1440,height:900}, javaScriptEnabled:false });
  const p1 = await c1.newPage();
  await p1.goto('http://localhost:3000/', { waitUntil:'load', timeout:90000 });
  const ssr = await p1.evaluate(() => [...document.querySelectorAll('body *')].map(e => e.textContent.trim()).filter(Boolean));
  await c1.close();

  // 2) hydrated DOM (JS on)
  const c2 = await b.newContext({ viewport:{width:1440,height:900} });
  const p2 = await c2.newPage();
  await p2.goto('http://localhost:3000/', { waitUntil:'load', timeout:90000 });
  await p2.waitForTimeout(9000);
  const hyd = await p2.evaluate(() => [...document.querySelectorAll('body *')].map(e => e.textContent.trim()).filter(Boolean));

  // 3) compare length-normalised text tokens containing a brand string
  const brandish = (s) => /(vedang|paatil|gmail|github|instagram|cal\.com|linkedin|louis|raill)/i.test(s);
  const A = ssr.filter(brandish), B = hyd.filter(brandish);
  console.log('SSR brand strings:', A.length, ' hydrated brand strings:', B.length);
  const onlySSR = A.filter(x => !B.includes(x));
  const onlyHyd = B.filter(x => !A.includes(x));
  console.log('\n--- in SSR DOM but NOT in hydrated DOM ---');
  [...new Set(onlySSR)].slice(0,15).forEach(s => console.log('  ' + JSON.stringify(s.slice(0,110))));
  console.log('\n--- in hydrated DOM but NOT in SSR DOM ---');
  [...new Set(onlyHyd)].slice(0,15).forEach(s => console.log('  ' + JSON.stringify(s.slice(0,110))));

  await c2.close();
  await b.close();
})();
