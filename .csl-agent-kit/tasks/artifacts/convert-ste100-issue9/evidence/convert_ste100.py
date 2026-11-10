import collections
import hashlib
import json
import re
import subprocess
from pathlib import Path

import pymupdf

PDF = Path('/Users/caishilin/Downloads/ASD-STE100_ISSUE9.pdf')
OUT = Path('/Users/caishilin/Downloads/ASD-STE100-Issue9')
OUT.mkdir(exist_ok=True)
DOC = pymupdf.open(PDF)
LAYOUT = subprocess.check_output(['pdftotext', '-layout', str(PDF), '-']).decode().split('\f')
POS = re.compile(r'\((n|v|adj|adv|prep|pron|conj|art|prefix)\)')
FIELDS = ['word_and_forms', 'meaning_or_alternatives', 'ste_examples', 'non_ste_examples']


def spans(page):
    return [s for b in page.get_text('dict')['blocks'] for l in b.get('lines', [])
            for s in l['spans'] if s['text'].strip()]


def label(page):
    return re.search(r'Page (\d-\d-[A-Z]?\d+)', page.get_text()).group(1)


def body_layout(index):
    lines = LAYOUT[index].splitlines()
    result = []
    for line in lines:
        if re.search(r'ASD[- ]STE100 Simplified Technical English', line):
            continue
        if re.search(r'Part [12] - (Writing rules|Dictionary)', line, re.I) and 'Issue 9' in line:
            continue
        if line.strip() == '2025-01-15':
            continue
        result.append(line.rstrip())
    while result and not result[0].strip():
        result.pop(0)
    while result and not result[-1].strip():
        result.pop()
    indent = min((len(x) - len(x.lstrip()) for x in result if x.strip()), default=0)
    return '\n'.join(x[indent:] for x in result)


def markdown_body(text):
    prepared = []
    for line in text.splitlines():
        stripped = line.strip()
        if re.match(r'(?:Rule \d\.\d+\b|(?:Non-)?STE:)', stripped):
            line = re.sub(r' {2,}', ' ', stripped)
        if re.match(r'(?:Section \d\s*[-–]|Rule \d\.\d+\b)', stripped) or stripped == 'Summary of the rules':
            prepared.append('')
        prepared.append(line)
        if re.match(r'Section \d\s*[-–]', stripped) or stripped == 'Summary of the rules':
            prepared.append('')
    blocks = re.split(r'\n\s*\n', '\n'.join(prepared))
    rendered = []
    for block in blocks:
        block = block.strip('\n')
        lines = block.splitlines()
        if not lines:
            continue
        stripped = [x.strip() for x in lines]
        # Fixed-width tables retain empty cells and the alignment of paired examples.
        columns = any(re.search(r'\S {3,}\S', x.strip()) for x in lines)
        if columns:
            rendered.append('```text\n' + block + '\n```')
        elif len(lines) == 1 and re.match(r'Section \d\s*[-–]', stripped[0]):
            rendered.append('## ' + stripped[0])
        elif len(lines) == 1 and stripped[0] == 'Summary of the rules':
            rendered.append('### ' + stripped[0])
        elif re.match(r'Rule \d\.\d+\b', stripped[0]):
            heading = stripped[0]
            rest = stripped[1:]
            while rest and not re.search(r'[.:]$', heading) and not re.match(r'[-•]|Rule ', rest[0]):
                heading += ' ' + rest.pop(0)
            rendered.append('### ' + heading + ('\n\n' + '\n'.join(rest) if rest else ''))
        else:
            # Escape Markdown syntax that could hide source characters.
            rendered.append('\n'.join(re.sub(r'([\\`*_<>])', r'\\\1', x) for x in stripped))
    return '\n\n'.join(rendered)


markdown = ['# ASD-STE100 Issue 9 — Part 1: Writing rules',
            '> 来源：ASD-STE100 Issue 9，2025-01-15。正文保留英文原文。PDF 第 43–128 页；'
            '重复页眉页脚已移除，每页保留来源编号。多列表格和并排示例使用等宽文本块，避免改变对应关系。'
            '排版换行及连字符保留原样，未作翻译或语义改写。']
rule_pages = []
for i in range(42, 128):
    text = body_layout(i)
    body = markdown_body(text)
    page_label = label(DOC[i])
    markdown.append(f'<!-- PDF page {i + 1}; printed page {page_label} -->\n\n'
                    f'### 原文页 {page_label} · PDF {i + 1}\n\n' + body)
    rule_pages.append({'pdf_page': i + 1, 'printed_page': page_label, 'source_text': text, 'markdown_body': body})
    for image in DOC[i].get_image_info(xrefs=True):
        if image['bbox'][1] < 55:
            continue
        asset = DOC.extract_image(image['xref'])
        folder = OUT / 'assets'
        folder.mkdir(exist_ok=True)
        name = f'page-{i + 1}-image-{image["xref"]}.{asset["ext"]}'
        (folder / name).write_bytes(asset['image'])
        markdown.append(f'![原文插图，PDF 第 {i + 1} 页](assets/{name})')
        if i + 1 == 73:
            markdown.append('插图文字转录：\n\n'
                            '- Passive voice: The main gear leg is held by the side stay.\n'
                            '  Agent (≠ Subject): the side stay.\n'
                            '- Active voice: The side stay holds the main gear leg.\n'
                            '  Subject (= Agent): The side stay.')
(OUT / 'ASD-STE100-Issue9-Part1-Writing-Rules.md').write_text('\n\n'.join(markdown) + '\n')

entries = []
page_audits = []
blank_pages = []
for i in range(148, len(DOC)):
    page = DOC[i]
    ss = spans(page)
    x0 = next(s['bbox'][0] for s in ss if s['text'].strip() == 'Word')
    x2 = next(s['bbox'][0] for s in ss if s['text'].strip() == 'STE EXAMPLE')
    x3 = next(s['bbox'][0] for s in ss if s['text'].strip() == 'Non-STE example')
    body = [s for s in ss if 90 <= s['origin'][1] < 715]
    if ''.join(s['text'].strip() for s in body) == 'Blank Page':
        blank_pages.append(i + 1)
        continue
    nominal = [x0 + 108, x2, x3]
    boundaries = [min((s['origin'][0] for s in body if abs(s['origin'][0] - anchor) < 12), default=anchor) - .5
                  for anchor in nominal]
    lines = []
    # Some PDF spans contain text from two adjacent cells. Split at character positions.
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                if not 90 <= span['origin'][1] < 715:
                    continue
                groups = []
                for char in span['chars']:
                    x, y = char['origin']
                    column = sum(x >= boundary for boundary in boundaries)
                    if not groups or groups[-1][0] != column:
                        groups.append((column, []))
                    groups[-1][1].append(char)
                for column, chars in groups:
                    text = ''.join(c['c'] for c in chars).strip()
                    if text:
                        first_char = next(c for c in chars if c['c'].strip())
                        x, y = first_char['origin']
                        lines.append({'column': column, 'y': round(y, 3), 'x': round(x, 3),
                                      'x_end': round(chars[-1]['bbox'][2], 3), 'text': text})
    lines.sort(key=lambda z: (z['y'], z['column'], z['x']))
    first = [s for s in lines if s['column'] == 0]
    groups = []
    for s in first:
        if not groups or s['y'] - groups[-1][-1]['y'] > 15:
            groups.append([])
        groups[-1].append(s)
    starts = []
    for group in groups:
        text = ' '.join(s['text'] for s in group)
        matches = list(POS.finditer(text))
        if len(matches) == 1 or text in ['FOR EXAMPLE', 'such as']:
            starts.append((group[0]['y'], text))
        elif matches:
            raise ValueError(f'Multiple headwords at page {i + 1}: {text}')
        elif not text.startswith('No other'):
            raise ValueError(f'Unknown word-column group at page {i + 1}: {text}')
    assigned = 0
    # A top-of-page continuation belongs to the preceding entry.
    regions = [(90, starts[0][0], None)] if starts and starts[0][0] > 91 else []
    regions += [(y, starts[k + 1][0] if k + 1 < len(starts) else 715, text)
                for k, (y, text) in enumerate(starts)]
    if not starts:
        regions = [(90, 715, None)]
    for start, end, word in regions:
        selected = [s for s in lines if start - .5 <= s['y'] < end - .5]
        if not selected:
            continue
        if word is not None:
            match = POS.search(word)
            headword = word[:match.start()].strip() if match else word
            status_word = re.sub(r'\([^)]*\)', '', headword).strip()
            entry = {'id': f'entry-{len(entries) + 1:04d}', 'headword': headword,
                     'part_of_speech': match.group(1) if match else None,
                     'approved': status_word.isupper(), 'source_fragments': []}
            entries.append(entry)
        elif not entries:
            raise ValueError(f'Orphan content on page {i + 1}')
        columns = {}
        for c, key in enumerate(FIELDS):
            rows = collections.defaultdict(list)
            for s in selected:
                if s['column'] == c:
                    rows[s['y']].append(s)
            rendered_rows = []
            for _, row in sorted(rows.items()):
                row = sorted(row, key=lambda z: z['x'])
                text = row[0]['text']
                for previous, current in zip(row, row[1:]):
                    text += (' ' if current['x'] - previous['x_end'] > 1.5 else '') + current['text']
                rendered_rows.append(text)
            columns[key] = '\n'.join(rendered_rows)
        entries[-1]['source_fragments'].append({'pdf_page': i + 1, 'printed_page': label(page),
                                               'columns': columns, 'positioned_text': selected})
        assigned += len(selected)
    if assigned != len(lines):
        raise ValueError(f'Unassigned or duplicate text on page {i + 1}: {assigned}/{len(lines)}')
    page_audits.append({'pdf_page': i + 1, 'source_spans': len(lines), 'assigned_spans': assigned,
                        'entry_starts': len(starts)})

for entry in entries:
    for key in FIELDS:
        entry[key] = '\n'.join(f['columns'][key] for f in entry['source_fragments'] if f['columns'][key])
    entry['pdf_pages'] = list(dict.fromkeys(f['pdf_page'] for f in entry['source_fragments']))

introductory_pages = [{'pdf_page': i + 1, 'printed_page': label(DOC[i]), 'text': body_layout(i)}
                      for i in range(128, 148)]
cover_image = DOC.extract_image(296)
cover_name = f'page-129-image-296.{cover_image["ext"]}'
(OUT / 'assets' / cover_name).write_bytes(cover_image['image'])
introductory_pages[0]['images'] = [{
    'path': f'assets/{cover_name}',
    'transcription': 'One day I will find the right words, and they all will be simple.',
    'attribution': 'Jack Kerouac',
    'verification': '对照原文图像人工核对引文及署名。'
}]
flow_name = 'page-144-word-selection-flowchart.png'
DOC[143].get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=pymupdf.Rect(28, 200, 595, 485)).save(OUT / 'assets' / flow_name)
node_data = [
    ('in_dictionary', 'decision', 'Is the word in the dictionary?'),
    ('approved', 'decision', 'Is the word approved?'),
    ('same_pos', 'decision', 'Does the word have the same part of speech?'),
    ('read_meaning', 'action', 'Read the meaning and the related examples.'),
    ('correct_meaning', 'decision', 'Is the meaning correct?'),
    ('technical_word', 'decision', 'Is the word a technical noun or a technical verb?'),
    ('refer_categories', 'action', 'Refer to technical noun and technical verb categories.'),
    ('read_alternative', 'action', 'Read the alternative, its meaning, and the related examples.'),
    ('select_alternative', 'action', 'Select the correct alternative.'),
    ('reject_meaning', 'result', 'Do not use the word.'),
    ('use_approved', 'result', 'Use the word.'),
    ('add_glossary', 'document', 'Add the word to the project glossary with the applicable technical noun or technical verb category.'),
    ('alternative_same_pos', 'decision', 'Does the alternative have the same part of speech?'),
    ('replace', 'result', 'Do a word-for-word replacement.'),
    ('reject_technical', 'result', 'Do not use the word.'),
    ('use_technical', 'result', 'Use the word.'),
    ('reconstruct', 'result', 'Use a different sentence construction.'),
]
edge_data = [
    ('in_dictionary', 'approved', 'Yes'), ('in_dictionary', 'technical_word', 'No'),
    ('approved', 'same_pos', 'Yes'), ('approved', 'read_alternative', 'No'),
    ('same_pos', 'read_meaning', 'Yes'), ('same_pos', 'select_alternative', 'No'),
    ('read_meaning', 'correct_meaning', 'Yes'),
    ('correct_meaning', 'use_approved', 'Yes'), ('correct_meaning', 'reject_meaning', 'No'),
    ('reject_meaning', 'technical_word', None),
    ('technical_word', 'refer_categories', None), ('technical_word', 'reject_technical', 'No'),
    ('refer_categories', 'add_glossary', 'Yes'), ('add_glossary', 'use_technical', None),
    ('read_alternative', 'select_alternative', None), ('select_alternative', 'alternative_same_pos', None),
    ('alternative_same_pos', 'replace', 'Yes'), ('alternative_same_pos', 'reconstruct', 'No'),
]
introductory_pages[15]['flowchart'] = {
    'title': 'How to select words correctly', 'image_path': f'assets/{flow_name}',
    'nodes': [{'id': node_id, 'type': kind, 'text': text} for node_id, kind, text in node_data],
    'edges': [{'from': start, 'to': end, 'label': edge_label} for start, end, edge_label in edge_data],
    'transcription_notes': '英文节点和箭头标签按原图人工转录；无标签的连线使用 null。'
                           '保留原图 read_meaning 到 correct_meaning 连线上的 Yes，以及 refer_categories 到 add_glossary 连线上的 Yes，'
                           '不移动标签或推断未印出的条件。横向返回线的跨线拱桥不是连接节点。'
}

payload = {
    'title': 'ASD-STE100 Issue 9 — Part 2: Dictionary',
    'issue': 9, 'issue_date': '2025-01-15',
    'source_url': 'https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf',
    'source_pdf_sha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
    'schema_version': 1,
    'schema_notes': {
        'language': '词典原文为英文；说明字段为中文。',
        'coverage': '全部词条，以及词典前言、使用说明、常见错误和批准动词列表。',
        'approved': '根据原文词头大小写判定；不是对词条所有含义或所有词性的批准。',
        'part_of_speech': '原文词性缩写；原文未标词性的短语为 null，不推断词性。',
        'word_and_forms': '原文第一列，含词头、词性、词形及相关限制。',
        'meaning_or_alternatives': '原文第二列，保留定义、替代词和帮助说明，不将不同含义混成单一定义。',
        'ste_examples': '原文第三列，保留全部 STE 示例。',
        'non_ste_examples': '原文第四列，保留全部 Non-STE 示例。',
        'source_fragments': '按来源页保存四列原文及带位置的文本。positioned_text 的 column 为 0–3，x/y 为 PDF 点坐标；用于核对多义项与示例对应关系。',
        'line_breaks': '保留原文排版换行，不推测跨行连字符；源文本大小写和标点不改写。',
        'introductory_pages': '按页保留等宽原文，其中的示例词条不重复计入 entries；封面图片和选词流程图关联 assets 资源，图中英文及分支关系另行转录。'
    },
    'entry_count': len(entries),
    'approved_entry_count': sum(e['approved'] for e in entries),
    'not_approved_entry_count': sum(not e['approved'] for e in entries),
    'source_introduction_word_counts': {'approved': 875, 'not_approved': 1274, 'pdf_page': 131},
    'count_note': '前言声明的词数与正文逐项记录数不同。本文件按原文词头及词性保留全部记录；'
                  '两种提取引擎均识别 2196 个词性标记，另有 FOR EXAMPLE 和 such as 两个未标词性的短语。'
                  '未为匹配前言数字而删除或合并条目；未推断原文统计差异的成因。',
    'introductory_pages': introductory_pages,
    'blank_dictionary_pages': blank_pages,
    'entries': entries,
}
(OUT / 'ASD-STE100-Issue9-Dictionary.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
Path('/tmp/ste100-conversion-audit.json').write_text(json.dumps({'rules': rule_pages, 'dictionary': page_audits}, ensure_ascii=False, indent=2))
print(json.dumps({'entries': len(entries), 'approved': payload['approved_entry_count'],
                  'not_approved': payload['not_approved_entry_count'], 'blank_pages': blank_pages,
                  'dictionary_text_spans': sum(p['source_spans'] for p in page_audits),
                  'multi_page_entries': [e['headword'] for e in entries if len(e['pdf_pages']) > 1]}, ensure_ascii=False))
