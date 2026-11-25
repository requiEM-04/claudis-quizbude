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
    s2 = re.sub(r"(import\('\./[\w-]+\.js)(\?v=[^']*)?'\)", rf"\1?v={v}')", s2)
    if s2 != s: f.write_text(s2)
for seite in ('index.html', 'admin.html'):
    idx = root / seite
    if not idx.exists(): continue
    s = idx.read_text()
    s = re.sub(r'((?:href|src)="(?:css|js|vendor)/[\w-]+\.(?:css|js))(\?v=[^"]*)?"', rf'\1?v={v}"', s)
    idx.write_text(s)
# Die Seite fragt diese Datei regelmäßig ab und lädt bei einer neuen Version von selbst neu
(root / 'version.json').write_text('{"version": "%s"}\n' % v)
print('Version', v)
