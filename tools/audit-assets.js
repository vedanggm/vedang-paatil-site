const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) res.push(full);
  });
  return res;
}

const files = walk('public');
const imgRegex = /["'(=]\s*(\/(?:images|frame|da|gen|works|fonts|3D)\/[^"'()\s]+)/g;
const missing = new Set();
const found = new Set();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = imgRegex.exec(content)) !== null) {
    let clean = m[1].replace(/&amp;/g, '&').split('?')[0];
    const diskPath = path.join('public', clean.replace(/^\//, ''));
    if (fs.existsSync(diskPath)) {
      found.add(clean);
    } else {
      missing.add(clean + ' (referenced in ' + path.basename(f) + ')');
    }
  }
});

console.log('Total found assets:', found.size);
console.log('Missing assets:', Array.from(missing));
