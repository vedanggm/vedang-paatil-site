#!/usr/bin/env python3
"""
Fix the hero banner in index.html.

The banner renders each letter as its own <span>, so the words "LOUIS" and
"RAILLÉ" never appear as contiguous strings in the HTML — the literal text
replacement in rebrand.js could not see them. That left the server-rendered
markup spelling the old name while the client bundle spelled the new one,
which React reports as a hydration mismatch (#418).

This rebuilds the bannerInner block with the new words, preserving the exact
class names and DOM shape the site's CSS and GSAP timeline expect.
"""
import re
import sys

PATH = '/home/user/mirror/vedangpaatil/index.html'
WORDS = ['VEDANG', 'PAATIL']

html = open(PATH, encoding='utf-8').read()

START = '<div class="Hero_bannerInner__cuPgy">'
i = html.find(START)
if i == -1:
    sys.exit('bannerInner not found')

# walk forward counting <div ...> / </div> to find the matching close tag
j = i + len(START)
depth = 1
for m in re.finditer(r'<(/?)div\b', html[j:]):
    depth += -1 if m.group(1) else 1
    if depth == 0:
        end = j + m.start()
        break
else:
    sys.exit('unbalanced div')

old_inner = html[i + len(START):end]
print('old inner length:', len(old_inner), '| chars:', ''.join(re.findall(r'__(?:ieoau|Oz4i3)">([^<])<', old_inner)))


def word(txt):
    chars = ''.join(
        '<span class="Hero_bannerCharWrap__elUw9">'
        '<span class="Hero_bannerChar__ieoau">' + c + '</span></span>'
        for c in txt
    )
    return '<span class="Hero_bannerWord__EIkLj">' + chars + '</span>'


new_inner = (
    word(WORDS[0])
    + '<span class="Hero_bannerSep__Oz4i3">\u2726</span>'
    + word(WORDS[1])
)

html = html[:i + len(START)] + new_inner + html[end:]
open(PATH, 'w', encoding='utf-8').write(html)
print('new inner length:', len(new_inner), '| chars:', WORDS[0] + '\u2726' + WORDS[1])
print('written', PATH)
