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
    infoLinks: [...document.querySelectorAll('.Contact_infoLink__N2s82')].map(a => a.textContent.trim() + '  →  ' + a.getAttribute('href')),
    anyLibraryLink: [...document.querySelectorAll('a[href="/library"]')].map(a => a.textContent.trim()),
    bodyHasPhrase: document.body.innerText.includes('build prompts'),
    height: document.body.scrollHeight,
  }));
  console.log('footer links now:');
  r.infoLinks.forEach(l => console.log('   ' + l));
  console.log('\nany /library links left :', r.anyLibraryLink.length ? r.anyLibraryLink : 'none');
  console.log('"build prompts" in page :', r.bodyHasPhrase);
  console.log('page height             :', r.height);
  console.log('errors                  :', errs.length ? errs : 'none');

  // scroll to footer for a screenshot
  await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2500);
  await p.screenshot({path:'/home/user/verify/screenshots/footer-no-library.png'});
  await b.close();
})();
