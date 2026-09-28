#!/usr/bin/env python3
"""Converte a planilha de arquitetura (xlsx) em JSON para o Astro.

Uso: python3 scripts/extract-xlsx.py [caminho.xlsx]
"""
import json, re, sys, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

SRC = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / 'Downloads/05-mapa-de-arquitetura.xlsx')
OUT = Path(__file__).resolve().parent.parent / 'src' / 'data'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
M = '{%s}' % NS['m']


def read_sheets(path):
    z = zipfile.ZipFile(path)
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            strings.append(''.join(t.text or '' for t in si.iter(M + 't')))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    sheets = {}
    for s in wb.find('m:sheets', NS):
        target = rels[s.get('{%s}id' % NS['r'])].lstrip('/')
        if not target.startswith('xl/'):
            target = 'xl/' + target
        rows = []
        for row in ET.fromstring(z.read(target)).iter(M + 'row'):
            cells = {}
            for c in row.findall('m:c', NS):
                col = re.match(r'[A-Z]+', c.get('r')).group()
                v, t = c.find('m:v', NS), c.get('t')
                if t == 's' and v is not None:
                    val = strings[int(v.text)]
                elif t == 'inlineStr':
                    val = ''.join(x.text or '' for x in c.iter(M + 't'))
                else:
                    val = v.text if v is not None else ''
                cells[col] = (val or '').strip()
            rows.append(cells)
        sheets[s.get('name')] = rows
    return sheets


def table(rows, keys):
    """Primeira linha é cabeçalho; mapeia colunas A, B, C... para as chaves dadas."""
    cols = [chr(ord('A') + i) for i in range(len(keys))]
    out = []
    for r in rows[1:]:
        if not any(r.get(c) for c in cols):
            continue
        out.append({k: r.get(c, '') for k, c in zip(keys, cols)})
    return out


sheets = read_sheets(SRC)

pages = table(sheets['Mapa de URLs'], [
    'id', 'hub', 'level', 'name', 'url', 'fullUrl', 'type', 'keyword', 'variations', 'intent',
    'intentDetail', 'stage', 'persona', 'cta', 'parent', 'priority', 'condition', 'status'])
for p in pages:
    p['level'] = int(p['level'] or 0)
    p['variations'] = [v.strip() for v in p['variations'].split(';') if v.strip()]

articles = table(sheets['Artigos de apoio'], [
    'id', 'title', 'keyword', 'url', 'stage', 'persona', 'hub', 'target', 'origin', 'priority', 'status'])

links = table(sheets['Links internos'], ['fromName', 'from', 'toName', 'to', 'anchor', 'kind'])

# Na planilha, os links "Artigo para serviço" apontam para a coluna Origem
# (ex.: "Dúvida 1") em vez da página de serviço. Corrige pelo artigo.
names = {p['url']: p['name'] for p in pages}
by_url = {a['url']: a for a in articles}
for l in links:
    if not l['to'].startswith('/') and l['from'] in by_url:
        l['to'] = by_url[l['from']]['target']
        l['toName'] = names.get(l['to'], l['to'])

menu = table(sheets['Menu'], ['area', 'level', 'label', 'url', 'note'])
for m in menu:
    m['level'] = int(m['level'] or 0)
    if not m['url'].startswith('/'):
        m['url'] = ''

OUT.mkdir(parents=True, exist_ok=True)
for name, data in [('pages', pages), ('articles', articles), ('links', links), ('menu', menu)]:
    (OUT / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'{name}.json: {len(data)}')
