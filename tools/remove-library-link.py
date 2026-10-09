#!/usr/bin/env python3
"""
Remove the "library — build prompts" link from the footer contact block.

It exists in exactly two places and both must change together, or React will
report a hydration mismatch (#418) the way the hero banner did:

  index.html                                        server-rendered markup
  _next/static/chunks/app/page-aeed7d60bb98637f.js  client component tree

The /library page itself, and the "More builds in the library" pills on the
prompt demo pages, are separate and left untouched.
"""
import sys

HTML = '/home/user/mirror/vedangpaatil/index.html'
JS = '/home/user/mirror/vedangpaatil/_next/static/chunks/app/page-aeed7d60bb98637f.js'

HTML_TARGET = '<a href="/library" class="Contact_infoLink__N2s82">library \u2014 build prompts</a>'
JS_TARGET = ',(0,r.jsx)("a",{href:"/library",className:c().infoLink,children:"library \u2014 build prompts"})'

# ---------------------------------------------------------------- index.html
html = open(HTML, encoding='utf-8').read()
n = html.count(HTML_TARGET)
if n != 1:
    sys.exit('expected 1 html occurrence, found %d' % n)
html = html.replace(HTML_TARGET, '')
open(HTML, 'w', encoding='utf-8').write(html)
print('index.html                       : removed %d element' % n)

# ------------------------------------------------------------------ JS chunk
js = open(JS, encoding='utf-8').read()
m = js.count(JS_TARGET)
if m != 1:
    sys.exit('expected 1 js occurrence, found %d' % m)
js = js.replace(JS_TARGET, '')
open(JS, 'w', encoding='utf-8').write(js)
print('page-aeed7d60bb98637f.js        : removed %d render call' % m)

print('\nboth removed together \u2014 markup and component tree stay in sync')
