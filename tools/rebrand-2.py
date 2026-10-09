#!/usr/bin/env python3
"""
Second pass: remove the last traces of the original identity.

Left over after pass 1:
  https://cal.com/louis-raille/decouverte   the "Book a call" buttons
  louisraille.fr                            /library back-link, /cookies
                                            body text, robots.txt sitemap
"""
import os

ROOT = '/home/user/mirror/vedangpaatil'
TEXT_EXT = {'.html', '.js', '.css', '.txt', '.json', '.xml', '.svg', '.mjs'}

RULES = [
    ('cal.com/louis-raille/decouverte', 'cal.com/vedangpaatil/decouverte'),
    ('louisraille.fr', 'vedangpaatil.com'),
]

files = []
for dirpath, _dirnames, filenames in os.walk(ROOT):
    for fn in filenames:
        if os.path.splitext(fn)[1].lower() in TEXT_EXT:
            files.append(os.path.join(dirpath, fn))

total = {}
changed = 0
for path in files:
    try:
        before = open(path, encoding='utf-8').read()
    except (UnicodeDecodeError, OSError):
        continue
    after = before
    for src, dst in RULES:
        n = after.count(src)
        if n:
            after = after.replace(src, dst)
            total[src] = total.get(src, 0) + n
    if after != before:
        open(path, 'w', encoding='utf-8').write(after)
        changed += 1
        print('  updated ' + os.path.relpath(path, ROOT))

print('\nfiles edited: ' + str(changed))
for k, v in sorted(total.items(), key=lambda x: -x[1]):
    print('  %3d  %s' % (v, k))
