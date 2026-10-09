const fs = require('fs');
const path = require('path');

// 1. Rename the corrupted video file
const worksDir = path.join(__dirname, '..', 'public', 'works');
const videoFiles = fs.readdirSync(worksDir);
const corruptedVideo = videoFiles.find(f => f.startsWith('Ignite') && f.endsWith('.mp4'));

if (corruptedVideo) {
  const oldPath = path.join(worksDir, corruptedVideo);
  const newPath = path.join(worksDir, 'ignite-ideas.mp4');
  fs.renameSync(oldPath, newPath);
  console.log('Renamed', corruptedVideo, '-> ignite-ideas.mp4');

  // Update references in index.html, page-7d14a9c3e0b82f56.js, page-aeed7d60bb98637f.js
  const filesToUpdate = [
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-7d14a9c3e0b82f56.js'),
    path.join(__dirname, '..', 'public', '_next', 'static', 'chunks', 'app', 'page-aeed7d60bb98637f.js')
  ];

  filesToUpdate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/\/works\/Ignite[^"'\s\)]+\.mp4/g, '/works/ignite-ideas.mp4');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated video reference in', path.basename(filePath));
    }
  });
}

// 2. Cache-bust chunk 9702 to 9702.cf810e9a.js
const chunksDir = path.join(__dirname, '..', 'public', '_next', 'static', 'chunks');
const oldChunk = path.join(chunksDir, '9702.adab36c09352e4b7.js');
const newChunk = path.join(chunksDir, '9702.cf810e9a.js');

if (fs.existsSync(oldChunk)) {
  fs.copyFileSync(oldChunk, newChunk);
  console.log('Created cache-busted chunk:', '9702.cf810e9a.js');
}

// 3. Update webpack runtime chunk map
const webpackFile = path.join(chunksDir, 'webpack-95c6825be7c498a2.js');
const webpackFixed = path.join(chunksDir, 'webpack-fixed.js');

if (fs.existsSync(webpackFile)) {
  let wpCode = fs.readFileSync(webpackFile, 'utf8');
  wpCode = wpCode.replace('9702:"adab36c09352e4b7"', '9702:"cf810e9a"');
  fs.writeFileSync(webpackFixed, wpCode, 'utf8');
  // keep original as well for safety
  fs.writeFileSync(webpackFile, wpCode, 'utf8');
  console.log('Updated webpack chunk map with new 9702 hash');
}

// 4. Update index.html to load webpack-fixed.js
const htmlFile = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace('webpack-95c6825be7c498a2.js', 'webpack-fixed.js');
fs.writeFileSync(htmlFile, html, 'utf8');
console.log('Updated index.html to load webpack-fixed.js');

console.log('Done!');
