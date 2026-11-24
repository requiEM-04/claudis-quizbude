#!/usr/bin/env python3
"""Setzt die Version und hängt ?v=<version> an alle eigenen Imports, damit Browser nichts Altes cachen.
Aufruf: python3 werkzeuge/release.py 0.1.1"""
import re, sys, pathlib
v = sys.argv[1]
root = pathlib.Path(__file__).resolve().parent.parent
cfg = root / 'js/config.js'
cfg.write_text(re.sub(r"VERSION = '[^']*'", f"VERSION = '{v}'", cfg.read_text()))
for f in (root / 'js').glob('*.js'):
    s = f.read_text()
    s2 = re.sub(r"(from '\./[\w-]+\.js)(\?v=[^']*)?'", rf"\1?v={v}'", s)
    if s2 != s: f.write_text(s2)
idx = root / 'index.html'
s = idx.read_text()
s = re.sub(r'(href="css/stil\.css)(\?v=[^"]*)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="js/app\.js)(\?v=[^"]*)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="vendor/supabase\.js)(\?v=[^"]*)?"', rf'\1?v={v}"', s)
idx.write_text(s)
print('Version', v)
