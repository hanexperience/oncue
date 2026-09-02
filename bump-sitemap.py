#!/usr/bin/env python3
"""Run this ON LAUNCH DAY, after the new pages are actually live.
Sets <lastmod> to today for the pages the v2 restyle touched.
Nothing else in sitemap.xml is altered."""
import re, datetime, sys
TOUCHED = ['https://beetsandco.com.au/',
           'https://beetsandco.com.au/blog/',
           'https://beetsandco.com.au/crowncon/',
           'https://beetsandco.com.au/walk-in-ready.html']
TOUCHED += ['https://beetsandco.com.au/blog/'+n for n in [
    'marketing-for-tradies.html','digital-marketing-agency-frankston.html',
    'web-design-bayside-melbourne-tradies.html','local-seo-melbourne-trade-businesses.html',
    'branding-bayside-trade-businesses.html','google-reviews-melbourne-trade-business.html',
    'marketing-automation-melbourne-trade-businesses.html','seo-for-plumbers-melbourne.html',
    'seo-for-electricians-melbourne.html','content-marketing-for-local-seo.html',
    'instagram-grid-maker-free.html']]
today = datetime.date.today().isoformat()
s = open('sitemap.xml', encoding='utf-8').read()
n = 0
for url in TOUCHED:
    pat = re.compile(r'(<loc>'+re.escape(url)+r'</loc>\s*<lastmod>)[^<]*(</lastmod>)')
    s, k = pat.subn(r'\g<1>'+today+r'\g<2>', s)
    n += k
open('sitemap.xml','w',encoding='utf-8').write(s)
print('updated %d <lastmod> entries to %s' % (n, today))
