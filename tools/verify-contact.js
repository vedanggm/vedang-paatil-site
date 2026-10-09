const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage();
  await p.goto('http://localhost:3000/', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(9000);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2500);
  await p.screenshot({ path:'/home/user/verify/screenshots/rebrand-footer.png' });
  const info = await p.evaluate(() => {
    const pick = (sel) => [...document.querySelectorAll(sel)].map(e => e.textContent.trim() || e.getAttribute('href'));
    return {
      legal: pick('.Contact_legalText___Mnmv'),
      links: [...document.querySelectorAll('.Contact_infoLink__N2s82')].map(a => a.textContent.trim() + '  →  ' + a.getAttribute('href')),
      big: [...document.querySelectorAll('.Contact_bigLink__7Cn2K')].map(a => a.textContent.trim() + '  →  ' + a.getAttribute('href')),
      social: [...document.querySelectorAll('.Contact_socials__VJ80W a')].map(a => (a.getAttribute('aria-label')||'?') + '  →  ' + a.getAttribute('href')),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
