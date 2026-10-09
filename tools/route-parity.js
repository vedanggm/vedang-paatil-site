const { chromium } = require('playwright-core');
const ROUTES = ['/', '/library', '/cgv', '/confidentialite', '/cookies', '/mentions-legales'];

(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  console.log('route'.padEnd(20), 'orig(err/h)', 'rebrand(err/h)');
  for (const r of ROUTES) {
    const out = {};
    for (const [k, base] of [['orig','http://localhost:3001'],['new','http://localhost:3000']]) {
      const c = await b.newContext({viewport:{width:1440,height:900}});
      const p = await c.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0,90)));
      p.on('response', x => { if (x.status()>=400 && !x.url().includes('_vercel')) errs.push(x.status()+' '+x.url().slice(0,60)); });
      await p.goto(base + r, { waitUntil:'load', timeout:90000 });
      await p.waitForTimeout(6000);
      out[k] = { errs:[...new Set(errs)], h: await p.evaluate(()=>document.body.scrollHeight) };
      await c.close();
    }
    const ok = out.orig.errs.length === out.new.errs.length;
    console.log(
      (ok?'OK   ':'DIFF ') + r.padEnd(20),
      (out.orig.errs.length+'/'+out.orig.h).padEnd(12),
      (out.new.errs.length+'/'+out.new.h).padEnd(14),
      out.new.errs.length ? JSON.stringify(out.new.errs.slice(0,3)) : ''
    );
  }
  await b.close();
})();
