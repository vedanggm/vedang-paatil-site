const { chromium } = require('playwright-core');
const ROUTES = ['/', '/library', '/cgv', '/confidentialite', '/cookies', '/mentions-legales'];
const PAIRS = [['live original','https://louisraille.fr'], ['rebranded','http://localhost:3000']];

(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  console.log('route'.padEnd(20), 'live: err/h/txt'.padEnd(22), 'rebranded: err/h/txt');
  for (const r of ROUTES) {
    const out = {};
    for (const [k, base] of PAIRS) {
      const c = await b.newContext({viewport:{width:1440,height:900}, ignoreHTTPSErrors:true});
      const p = await c.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0,80)));
      p.on('response', x => { if (x.status()>=400 && !x.url().includes('_vercel')) errs.push(x.status()+' '+x.url().slice(0,50)); });
      try {
        await p.goto(base + r, { waitUntil:'load', timeout:90000 });
        await p.waitForTimeout(7000);
        out[k] = { e:[...new Set(errs)].length,
                   h: await p.evaluate(()=>document.body.scrollHeight),
                   t: await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').length) };
      } catch(e) { out[k] = { e:1, h:0, t:0, err:e.message.slice(0,60) }; }
      await c.close();
    }
    const same = out['live original'].h === out['rebranded'].h && out['live original'].t === out['rebranded'].t;
    console.log(
      (same?'MATCH ':'DIFF  ') + r.padEnd(20),
      `${out['live original'].e}/${out['live original'].h}/${out['live original'].t}`.padEnd(22),
      `${out['rebranded'].e}/${out['rebranded'].h}/${out['rebranded'].t}`
    );
  }
  await b.close();
})();
