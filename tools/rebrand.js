#!/usr/bin/env node
/**
 * Rebrand the louisraille.fr clone to VEDANG PAATIL.
 *
 * Order matters: specific, URL-shaped patterns run before generic name patterns,
 * otherwise "raillelouis@gmail.com" would be half-rewritten mid-way.
 * Both literal UTF-8 and JS-escaped (\xe9 / \xc9) forms are handled.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'mirror', 'vedangpaatil');
const TEXT_EXT = new Set(['.html', '.js', '.css', '.txt', '.json', '.xml', '.svg', '.mjs']);

const RULES = [
  // --- contact + socials (must run before generic name rules) ----------------
  ['raillelouis@gmail.com', 'vedangcorpo@gmail.com'],
  ['RAILLELOUIS@GMAIL.COM', 'VEDANGCORPO@GMAIL.COM'],
  ['github.com/Louis-CFM', 'github.com/vedanggm'],
  ['https://www.instagram.com/louis_rlee/', 'https://www.instagram.com/'],
  ['https://www.instagram.com/louis_rlee', 'https://www.instagram.com/'],
  ['https://www.linkedin.com/in/louis-raill%C3%A9/', 'https://www.linkedin.com/'],
  ['linkedin / louis-raill\\xe9', 'linkedin'],
  ['linkedin / louis-raillé', 'linkedin'],

  // --- the name, in every casing + escape form -------------------------------
  ['RAILL\\xc9', 'PAATIL'], // JS-escaped É, hero banner word
  ['Raill\\xe9', 'Paatil'], // JS-escaped é
  ['RAILLÉ', 'PAATIL'],
  ['Raillé', 'Paatil'],
  ['LOUIS', 'VEDANG'],
  ['Louis', 'Vedang'],
];

const walk = (dir, files = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, files);
    else if (TEXT_EXT.has(path.extname(e.name).toLowerCase())) files.push(fp);
  }
  return files;
};

const files = walk(ROOT);
const totals = new Map();
let changedFiles = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  for (const [from, to] of RULES) {
    if (!after.includes(from)) continue;
    const n = after.split(from).length - 1;
    after = after.split(from).join(to);
    totals.set(from, (totals.get(from) || 0) + n);
  }

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changedFiles++;
    console.log('  updated ' + path.relative(ROOT, file));
  }
}

console.log('\nedited files: ' + changedFiles + ' / ' + files.length);
console.log('\nreplacements applied:');
for (const [k, v] of [...totals.entries()].sort((a, b) => b[1] - a[1])) {
  console.log('  ' + String(v).padStart(3) + '  ' + k);
}
