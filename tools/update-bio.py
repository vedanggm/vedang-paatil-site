#!/usr/bin/env python3
"""
Replace the About (Bio) paragraphs with the new copy.

The same three paragraphs live in three files, in two different escaping
schemes, and all of them must change together or React reports a hydration
mismatch (#418):

  index.html                                      HTML-escaped, <p> elements
  _next/static/chunks/app/page-7d14a9c3e0b82f56.js  JS-escaped, jsx children
  _next/static/chunks/app/page-aeed7d60bb98637f.js  same (kept for cached HTML)

The Bio section is the only place these <p class="Bio_para__tFgjk"> nodes occur.
"""
import re
import sys

HTML = '/home/user/mirror/vedangpaatil/index.html'
CHUNKS = [
    '/home/user/mirror/vedangpaatil/_next/static/chunks/app/page-7d14a9c3e0b82f56.js',
    '/home/user/mirror/vedangpaatil/_next/static/chunks/app/page-aeed7d60bb98637f.js',
]

# ---------------------------------------------------------------- new copy
# Light mechanical cleanup of the supplied text: collapsed double spaces,
# removed the space before "golf .", used the site's spaced em-dash style,
# and spelt the brand name TradingView.
PARAS = [
    "I'm 14, and I grew up in a generation where everything gets built from a "
    "screen. Played computer games at first, then the need to understand what "
    "was running underneath. I studied CS and programming, but most of what I "
    "know I taught myself: breaking things, rebuilding them, pushing every "
    "tool to its limit.",

    "I've always had two sides: design and code. Finance, TradingView, studying "
    "how the world's economy worked \u2014 that shaped me just as much as "
    "programming did. Today both merge in every project I touch: it has to "
    "work, and it has to look good.",

    "Outside dev, I've built knowledge across different domains \u2014 crypto, "
    "mining, golf. I like understanding systems at the root, not just the "
    "surface. What drives me is the intersection of hardware, software, and "
    "the people who use them. What I've learned, I want to put toward projects "
    "that actually matter.",
]

HTML_PARA = re.compile(r'(<p class="Bio_para__tFgjk">)(.*?)(</p>)', re.S)
JS_PARA = re.compile(r'(\{className:o\(\)\.para,children:")(.*?)("\})', re.S)


def apply(path, pattern, escape, label):
    src = open(path, encoding='utf-8').read()
    found = pattern.findall(src)
    if len(found) != 3:
        sys.exit(f'{label}: expected 3 paragraphs, found {len(found)}')

    out, n = [], 0
    for m in pattern.finditer(src):
        out.append(m.group(1))
        out.append(escape(PARAS[n]))
        out.append(m.group(3))
        n += 1

    new = pattern.sub(lambda m, it=iter(range(3)): m.group(1) + escape(PARAS[next(it)]) + m.group(3), src)
    open(path, 'w', encoding='utf-8').write(new)
    print(f'  {label:<48} replaced {n} paragraphs')


print('replacing About paragraphs:')
apply(HTML, HTML_PARA, lambda t: t.replace('&', '&amp;').replace("'", '&#x27;'), 'index.html')
for c in CHUNKS:
    apply(c, JS_PARA, lambda t: t.replace("'", "\\'"), c.split('/')[-1])
print('\ndone')
