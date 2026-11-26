"""Assemble multi.html from the original game's CSS + src/multi-body.html."""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
orig = (root / 'original/index.html').read_text(encoding='utf-8')
start = orig.index('<style>\n/* Layout')
css = orig[start:orig.index('</style>', start)]
extra = (root / 'src/multi-extra.css').read_text(encoding='utf-8')
body = (root / 'src/multi-body.html').read_text(encoding='utf-8')
head = '''<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>等式高低 · 多人連線</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700;900&family=IBM+Plex+Mono:wght@500;600&display=swap">
<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%}</style>
'''
(root / 'multi.html').write_text(head + css + extra + '</style>\n</head>\n<body>\n' + body + '</body>\n</html>\n', encoding='utf-8')
print('built multi.html')
