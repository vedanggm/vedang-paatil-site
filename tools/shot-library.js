const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:1000}});
  const p = await c.newPage();
  await p.goto('http://localhost:3000/library', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(8000);
  await p.screenshot({ path:'/home/user/verify/screenshots/library-rebranded.png' });
  console.log('screenshot saved');
  await b.close();
})();
