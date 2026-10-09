const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.chrome-temp');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + userDataDir,
  '--disable-gpu',
  '--window-size=1440,900',
  'http://localhost:3000'
]);

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(2000);
  let targets = [];
  for (let i = 0; i < 10; i++) {
    try {
      targets = await getJson('http://127.0.0.1:9222/json');
      if (targets.length > 0) break;
    } catch (e) {
      await sleep(500);
    }
  }

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    chrome.kill();
    return;
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      cb(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('Connected to Chrome DevTools Protocol');
  await sleep(4000); // Wait for page to render

  // Evaluate DOM for .card elements
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('[class*="card"]');
      const results = [];
      cards.forEach((c, idx) => {
        results.push({
          idx,
          className: c.className,
          bg: window.getComputedStyle(c).backgroundImage,
          rect: { w: c.clientWidth, h: c.clientHeight }
        });
      });
      return {
        cardCount: cards.length,
        cards: results.slice(0, 5),
        title: document.title,
        bodyHeight: document.body.scrollHeight
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM Evaluation Result:');
  console.log(JSON.stringify(evalResult.result ? evalResult.result.value : evalResult, null, 2));

  // Scroll down to #work section
  await send('Runtime.evaluate', {
    expression: `(() => {
      const work = document.getElementById('work');
      if (work) work.scrollIntoView();
    })()`
  });

  await sleep(2000);

  const evalAfterScroll = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('[class*="card"]');
      const results = [];
      cards.forEach((c, idx) => {
        results.push({
          idx,
          bg: window.getComputedStyle(c).backgroundImage,
          inlineStyle: c.getAttribute('style')
        });
      });
      return {
        cardCount: cards.length,
        cards: results.slice(0, 5)
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM After Scroll Result:');
  console.log(JSON.stringify(evalAfterScroll.result ? evalAfterScroll.result.value : evalAfterScroll, null, 2));

  // Capture screenshot
  const screenshot = await send('Page.captureScreenshot');
  if (screenshot && screenshot.data) {
    const buf = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync(path.join(__dirname, '..', 'work-carousel.png'), buf);
    console.log('Saved screenshot to work-carousel.png');
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
