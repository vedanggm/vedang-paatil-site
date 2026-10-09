const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  for (const [name,url] of [['original mirror','http://localhost:3001/'],['rebranded','http://localhost:3000/']]) {
    const c = await b.newContext({viewport:{width:1440,height:900}});
    const p = await c.newPage();
    const errs=[];
    p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
    await p.goto(url,{waitUntil:'load',timeout:90000});
    await p.waitForTimeout(9000);
    console.log(name.padEnd(16), 'React/hydration errors:', errs.filter(e=>/418|hydrat|Minified React/i.test(e)).length, errs.length?JSON.stringify(errs.slice(0,2)):'');
    await c.close();
  }
  await b.close();
})();
