const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:1200}});
  const p = await c.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message.slice(0,110)));
  p.on('response',r=>{ if(r.status()>=400 && !r.url().includes('_vercel')) errs.push(r.status()+' '+r.url().slice(0,70)); });

  await p.goto('http://localhost:3000/', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(10000);

  const bio = await p.evaluate(() => {
    const ps = [...document.querySelectorAll('.Bio_para__tFgjk')];
    return { count: ps.length, paras: ps.map(e => e.textContent.trim()) };
  });
  console.log('\nBio paragraphs rendered:', bio.count);
  bio.paras.forEach((t,i) => console.log(`\n  P${i+1}: ${t}`));
  console.log('\nconsole errors:', errs.length ? errs : 'none');

  // screenshot the About section
  const sec = await p.$('section.Bio_bio__z_uIC, section[class*="Bio_bio"]');
  if (sec) {
    await sec.scrollIntoViewIfNeeded();
    await p.waitForTimeout(2000);
    await sec.screenshot({ path:'/home/user/verify/screenshots/about-replaced.png' });
    console.log('About section screenshot saved');
  }
  await b.close();
})();
