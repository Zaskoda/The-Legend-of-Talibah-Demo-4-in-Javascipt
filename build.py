#!/usr/bin/env python3
"""Build TALDEMO4.html: one self-contained file with every script and data
file inlined, so it runs straight from disk (file://).

    python3 build.py            -> dist/TALDEMO4.html

Data files are gzip-compressed and base64-encoded; the page unpacks them
with the browser's DecompressionStream."""
import base64, gzip, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()

# the data file list lives in src/data.js
data_js = open(os.path.join(HERE, 'src', 'data.js'), encoding='utf-8').read()
block = data_js.split('const DATA_FILES = [')[1].split('];')[0]
names = re.findall(r"'([^']+)'", block)

files = {}
for n in names:
    raw = open(os.path.join(HERE, 'data', n), 'rb').read()
    files[n] = base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode()

parts = ['<script>\nwindow.TALIBAH_FILES = {\n']
parts += ['%r: %r,\n' % (k, v) for k, v in files.items()]
parts.append('};\n</script>\n')

scripts = re.findall(r'<script src="([^"]+)"></script>', html.split('<!--SCRIPTS-->')[1].split('<!--/SCRIPTS-->')[0])
for s in scripts:
    code = open(os.path.join(HERE, s), encoding='utf-8').read()
    parts.append('<script>\n/* ---- %s ---- */\n%s\n</script>\n' % (s, code.replace('</script', '<\\/script')))

out = re.sub(r'<!--SCRIPTS-->.*<!--/SCRIPTS-->', lambda m: ''.join(parts), html, flags=re.S)
os.makedirs(os.path.join(HERE, 'dist'), exist_ok=True)
path = os.path.join(HERE, 'dist', 'TALDEMO4.html')
open(path, 'w', encoding='utf-8').write(out)
print('wrote', path, os.path.getsize(path), 'bytes,', len(files), 'data files,', len(scripts), 'scripts')
