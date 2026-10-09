const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const c = await b.newContext({viewport:{width:1440,height:900}});
  const p = await c.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message.slice(0,90)));
  p.on('response',r=>{ if(r.status()>=400 && !r.url().includes('_vercel')) errs.push(r.status()+' '+r.url().slice(0,70)); });
  await p.goto('http://localhost:3000/', {waitUntil:'load', timeout:90000});
  await p.waitForTimeout(10000);
  const info = await p.evaluate(() => ({
    title: document.title,
    banner: (document.querySelector('.Hero_bannerInner__cuPgy')?.textContent || '').trim(),
    canvases: document.querySelectorAll('canvas').length,
    videos: document.querySelectorAll('video').length,
    footer: (document.body.innerText.match(/©[^\n]{0,55}/)||[''])[0],
  }));
  console.log('title    :', info.title);
  console.log('banner   :', info.banner);
  console.log('structure:', info.canvases, 'canvases,', info.videos, 'videos');
  console.log('footer   :', info.footer);
  console.log('errors   :', errs.length ? errs : 'none');
  await p.screenshot({path:'/home/user/verify/screenshots/live-preview.png'});
  await b.close();
})();
