"""Read ALBA's KITA workbook without changing it; generate the bounded test catalog.

Usage: python scripts/import-kita.py /path/to/Content-Tabelle_Kita.xlsx
Only exact, unique title matches supply existing original links/thumbnails.
All pedagogical content and constraints come exclusively from the workbook.
"""
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from openpyxl import load_workbook

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
sheet = load_workbook(source, data_only=True)['Spiele Kita']
def normal(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(value).lower().replace('ß', 'ss')).encode('ascii', 'ignore').decode())
public = json.loads((root / 'app/data/public-games.json').read_text())
def text(row, col):
    value = sheet[f'{col}{row}'].value
    return str(value).strip() if value is not None else ''
def number(row, col):
    value = sheet[f'{col}{row}'].value
    return value if isinstance(value, (int, float)) else None
def flag(row, col):
    raw = text(row, col)
    return True if raw.lower() == 'x' else None
categories = {col:text(4,col) for col in ['V','W','X','Y','Z','AA','AB','AC','AD','AE']}
records = []
for row in range(5, sheet.max_row + 1):
    name, title = text(row,'B'), text(row,'C')
    if not (name or title): continue
    matches = [g for g in public if normal(g['title']) == normal(title or name)]
    linked = matches[0] if len(matches) == 1 else {}
    prep = normal(text(row,'L'))
    minutes = 0 if prep in ['minimal','mimimal'] else 10 if '10' in prep else 5 if '5' in prep else 3 if prep == '3minuten' else None
    level = {'einsteiger':'Einsteiger','fortgeschritten':'Fortgeschrittene','fortgeschrittene':'Fortgeschrittene','experte':'Experte'}.get(normal(text(row,'T')))
    issues = []
    for col,label in [('M','Mindestalter'),('O','Mindestgruppengröße'),('P','Maximalgruppengröße')]:
        if number(row,col) is None: issues.append(f'{label} fehlt oder ist uneindeutig ({col}{row})')
    if minutes is None: issues.append(f'Vorbereitungszeit fehlt oder ist uneindeutig (L{row})')
    if level is None: issues.append(f'Niveau fehlt oder ist uneindeutig (T{row})')
    if not text(row,'G'): issues.append(f'Ablauf fehlt (G{row})')
    if not text(row,'I'): issues.append(f'Materialangabe fehlt (I{row})')
    code = text(row,'A')
    family = re.match(r'K\s*(\d+)', code)
    records.append(dict(
        id=f'kita-r{row}', sourceRow=row, sourceCode=code, name=name,
        title=title or name, teaser=text(row,'D'), tip=text(row,'E'),
        description=text(row,'F'), steps=[s.strip() for s in text(row,'G').splitlines() if s.strip()],
        materials=text(row,'I'), preparationRaw=text(row,'L'), preparationMinutes=minutes,
        minAge=number(row,'M'), maxAge=number(row,'N'), minChildren=number(row,'O'), maxChildren=number(row,'P'),
        level=level, levelRaw=text(row,'T'), categories=[label for col,label in categories.items() if flag(row,col)],
        outdoors=flag(row,'AH'), outdoorsRaw=text(row,'AH'),
        family=f'kita-family-{family[1]}' if family else f'kita-r{row}',
        href=linked.get('href',''), image=linked.get('image',''), issues=issues,
        raw={c:text(row,c) for c in ['V','W','X','Y','Z','AA','AB','AC','AD','AE','AF','AG','AH','S']},
    ))
result = dict(source=source.name, sheet=sheet.title, sha256=hashlib.sha256(source.read_bytes()).hexdigest(), records=records)
(root / 'app/data/kita-games.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'records':len(records),'exactLinks':sum(bool(r['href']) for r in records),'withIssues':sum(bool(r['issues']) for r in records)}))
