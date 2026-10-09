const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'public', 'index.html'),
  path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-7d14a9c3e0b82f56.js'),
  path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-aeed7d60bb98637f.js')
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\/works\/Ignite[^"'\\]+\.mp4/g, '/works/ignite-ideas.mp4');
  // Also JS escaped version
  c = c.replace(/\/works\/Ignite[^"']+\.mp4/g, '/works/ignite-ideas.mp4');
  fs.writeFileSync(f, c, 'utf8');
  console.log(path.basename(f), 'still has /works/Ignite:', c.includes('/works/Ignite'));
});
