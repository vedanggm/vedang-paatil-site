const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  for (const [n,u] of [['live','https://louisraille.fr/'],['clone','http://localhost:3000/']]) {
    const c = await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
    const p = await c.newPage();
    await p.goto(u,{waitUntil:'load',timeout:90000});
    await p.waitForTimeout(8000);
    await p.evaluate(()=>{const t=[...document.querySelectorAll('button')].find(x=>/toggle theme/i.test(x.getAttribute('aria-label')||''));if(t)t.click();});
    await p.waitForTimeout(2500);
    const info = await p.evaluate(()=>{const cs=getComputedStyle(document.documentElement);return {cls:document.documentElement.className.slice(0,60),bg:cs.backgroundColor,color:cs.color,bodyBg:getComputedStyle(document.body).backgroundColor};});
    console.log(n, JSON.stringify(info));
    await p.screenshot({path:`/home/user/verify/${n}-light.png`});
    await c.close();
  }
  await b.close();
})();
