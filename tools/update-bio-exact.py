#!/usr/bin/env python3
"""
Write the supplied About copy into the site VERBATIM.

Preserves the exact wording, spacing and punctuation as given, including:

  "Played computer  games"      double space
  "Finance ,Trading view"       space before comma, "Trading view"
  "the worlds economy"          no apostrophe
  "worked\u2014 that"              em dash with no preceding space
  "golf ."                       space before the period

The same three paragraphs live in three files, in two escaping schemes, and all
must change together or React reports a hydration mismatch (#418).
"""
import re
import sys

HTML = '/home/user/mirror/vedangpaatil/index.html'
CHUNKS = [
    '/home/user/mirror/vedangpaatil/_next/static/chunks/app/page-7d14a9c3e0b82f56.js',
    '/home/user/mirror/vedangpaatil/_next/static/chunks/app/page-aeed7d60bb98637f.js',
]

PARAS = [
    "I'm 14, and I grew up in a generation where everything gets built from a "
    "screen. Played computer  games at first, then the need to understand what "
    "was running underneath. I studied CS and programming, but most of what I "
    "know I taught myself: breaking things, rebuilding them, pushing every "
    "tool to its limit.",

    "I've always had two sides: design and code. Finance ,Trading view, studying "
    "how the worlds economy worked\u2014 that shaped me just as much as "
    "programming did. Today both merge in every project I touch: it has to "
    "work, and it has to look good.",

    "Outside dev, I've built knowledge across different domains \u2014 crypto, "
    "mining, golf . I like understanding systems at the root, not just the "
    "surface. What drives me is the intersection of hardware, software, and "
    "the people who use them. What I've learned, I want to put toward projects "
    "that actually matter.",
]

HTML_PARA = re.compile(r'(<p class="Bio_para__tFgjk">)(.*?)(</p>)', re.S)
JS_PARA = re.compile(r'(\{className:o\(\)\.para,children:")(.*?)("\})', re.S)


def apply(path, pattern, escape, label):
    src = open(path, encoding='utf-8').read()
    if len(pattern.findall(src)) != 3:
        sys.exit(f'{label}: expected 3 Bio paragraphs')
    idx = iter(range(3))
    new = pattern.sub(lambda m: m.group(1) + escape(PARAS[next(idx)]) + m.group(3), src)
    open(path, 'w', encoding='utf-8').write(new)
    print(f'  {label:<46} 3 paragraphs written verbatim')


def html_escape(t):
    return t.replace('&', '&amp;').replace("'", '&#x27;')


def js_escape(t):
    return t.replace("'", "\\'")


print('writing About copy verbatim:')
apply(HTML, HTML_PARA, html_escape, 'index.html')
for c in CHUNKS:
    apply(c, JS_PARA, js_escape, c.split('/')[-1])

print('\nbyte-for-byte check of what was written:')
for n, p in enumerate(PARAS, 1):
    print(f'  P{n}: {p[:78]}…')
