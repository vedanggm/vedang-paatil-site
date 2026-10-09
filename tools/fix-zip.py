#!/usr/bin/env python3
"""
Rebrand the downloadable ai-status-orb.zip.

The library page offers this build as a download, and its source files, README
and demo page all carry the original name and domain. Rewrites them in place
and repacks the archive with the same layout.

Run from the workspace root.
"""
import os
import shutil
import subprocess
import zipfile

WORK = '/tmp/zipcheck'
ZIP = '/home/user/mirror/vedangpaatil/downloads/ai-status-orb.zip'

RULES = [
    ('raillelouis@gmail.com', 'vedangcorpo@gmail.com'),
    ('RAILLELOUIS@GMAIL.COM', 'VEDANGCORPO@GMAIL.COM'),
    ('github.com/Louis-CFM', 'github.com/vedanggm'),
    ('www.instagram.com/louis_rlee', 'www.instagram.com'),
    ('cal.com/louis-raille/decouverte', 'cal.com/vedangpaatil/decouverte'),
    ('louisraille.fr', 'vedangpaatil.com'),
    ('Louis Raillé', 'Vedang Paatil'),
    ('Raillé', 'Paatil'),
    ('LOUIS', 'VEDANG'),
    ('Louis', 'Vedang'),
]

# fresh extract
if os.path.isdir(WORK):
    shutil.rmtree(WORK)
os.makedirs(WORK)
with zipfile.ZipFile(ZIP) as z:
    names = z.namelist()
    z.extractall(WORK)
print('extracted %d entries' % len(names))

changed = []
for dirpath, _dirs, filenames in os.walk(WORK):
    for fn in filenames:
        path = os.path.join(dirpath, fn)
        try:
            before = open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        after = before
        for src, dst in RULES:
            after = after.replace(src, dst)
        if after != before:
            open(path, 'w', encoding='utf-8').write(after)
            changed.append(os.path.relpath(path, WORK))

print('rebranded inside zip:')
for c in changed:
    print('  ' + c)

# repack, preserving the original entry order and names
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in names:
        full = os.path.join(WORK, name)
        if os.path.isdir(full):
            continue
        z.write(full, name)
print('\nrepacked %s (%d entries)' % (ZIP, len(names)))
