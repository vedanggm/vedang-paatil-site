const fs = require('fs');
const path = require('path');

// 1. Fix public/index.html
const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const beforeCount = (html.match(/_next\/image/g) || []).length;
console.log('index.html before count:', beforeCount);

html = html.replace(/\/_next\/image\?url=%2Fframe%2F([^&"']+)[^"']*/g, (match, file) => {
  return '/frame/' + decodeURIComponent(file);
});

const afterCount = (html.match(/_next\/image/g) || []).length;
console.log('index.html after count:', afterCount);
fs.writeFileSync(htmlPath, html, 'utf8');

// 2. Fix JS chunks: page-7d14a9c3e0b82f56.js & page-aeed7d60bb98637f.js
const chunks = [
  path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-7d14a9c3e0b82f56.js'),
  path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-aeed7d60bb98637f.js')
];

const targetPattern = '70119:(e,t,n)=>{"use strict";function r(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:640,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:70;return"/_next/image?url=".concat(encodeURIComponent(e),"&w=").concat(t,"&q=").concat(n)}n.d(t,{Y:()=>r})}';
const replacement = '70119:(e,t,n)=>{"use strict";function r(e){return e}n.d(t,{Y:()=>r})}';

chunks.forEach(chunkPath => {
  if (fs.existsSync(chunkPath)) {
    let code = fs.readFileSync(chunkPath, 'utf8');
    if (code.includes(targetPattern)) {
      code = code.replace(targetPattern, replacement);
      fs.writeFileSync(chunkPath, code, 'utf8');
      console.log('Successfully patched:', path.basename(chunkPath));
    } else {
      console.log('Pattern not found in:', path.basename(chunkPath));
    }
  }
});
