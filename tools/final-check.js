const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message.slice(0,110)));
  p.on('response',r=>{ if(r.status()>=400 && !r.url().includes('_vercel')) errs.push(r.status()+' '+r.url().slice(0,70)); });

  await p.goto('http://localhost:3000/', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(10000);

  const r = await p.evaluate(() => ({
    footerLinks: [...document.querySelectorAll('.Contact_infoLink__N2s82')].map(a => a.textContent.trim()),
    libraryLinks: [...document.querySelectorAll('a[href="/library"]')].length,
    phrase: document.body.innerText.includes('build prompts'),
    height: document.body.scrollHeight,
  }));
  console.log('footer LINKS column :', r.footerLinks);
  console.log('/library links      :', r.libraryLinks);
  console.log('"build prompts"     :', r.phrase);
  console.log('page height         :', r.height);
  console.log('console errors      :', errs.length ? errs : 'none');

  // light mode too, since the user's screenshot was light
  const t = await p.$('button[aria-label*="theme" i]');
  if (t) { await t.click(); await p.waitForTimeout(2000); }
  const light = await p.evaluate(() => ({ footer: [...document.querySelectorAll('.Contact_infoLink__N2s82')].map(a=>a.textContent.trim()), phrase: document.body.innerText.includes('build prompts') }));
  console.log('\nLIGHT MODE footer   :', light.footer);
  console.log('LIGHT MODE phrase   :', light.phrase);

  await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2200);
  await p.screenshot({path:'/home/user/verify/screenshots/final-light-footer.png'});
  await b.close();
})();
