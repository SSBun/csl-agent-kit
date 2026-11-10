import collections
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path('/Users/caishilin/Downloads/ASD-STE100-Issue9')
DATA = json.loads((OUT / 'ASD-STE100-Issue9-Dictionary.json').read_text())
AUDIT = json.loads(Path('/tmp/ste100-conversion-audit.json').read_text())
NS = {'x': 'http://www.w3.org/1999/xhtml'}
PAGES = ET.parse('/tmp/ste100-bbox.html').findall('.//x:page', NS)
FIELDS = ['word_and_forms', 'meaning_or_alternatives', 'ste_examples', 'non_ste_examples']


def chars(text):
    return collections.Counter(re.sub(r'\s', '', text))


def compact(text):
    return re.sub(r'\s', '', text)


by_page = collections.defaultdict(list)
for entry in DATA['entries']:
    for fragment in entry['source_fragments']:
        by_page[fragment['pdf_page']].extend(fragment['positioned_text'])

page_differences = []
column_differences = []
independent_markers = 0
independent_headers = []
independent_columns = {}
for n in range(149, 435):
    if n in DATA['blank_dictionary_pages']:
        continue
    words = [w for w in PAGES[n - 1].findall('.//x:word', NS) if 89 < float(w.attrib['yMin']) < 715]
    source = chars(''.join(w.text or '' for w in words))
    actual = chars(''.join(s['text'] for s in by_page[n]))
    if source != actual:
        page_differences.append(n)
    left = min(float(w.attrib['xMin']) for w in words)
    source_columns = collections.defaultdict(list)
    source_lines = [line for line in PAGES[n - 1].findall('.//x:line', NS)
                    if 89 < float(line.attrib['yMin']) < 715]
    anchors = [left + 108, left + 237.63, left + 367.25]
    bounds = [min((float(line.attrib['xMin']) for line in source_lines
                   if abs(float(line.attrib['xMin']) - anchor) < 12), default=anchor) - .5
              for anchor in anchors]
    for w in words:
        center = (float(w.attrib['xMin']) + float(w.attrib['xMax'])) / 2
        c = sum(center >= boundary for boundary in bounds)
        source_columns[c].append(w)
    independent_columns[n] = source_columns
    for c in range(4):
        source_text = ''.join(w.text or '' for w in source_columns[c])
        actual_text = ''.join(s['text'] for s in by_page[n] if s['column'] == c)
        if chars(source_text) != chars(actual_text):
            column_differences.append({'pdf_page': n, 'column': c,
                                      'source_only': dict(chars(source_text) - chars(actual_text)),
                                      'json_only': dict(chars(actual_text) - chars(source_text))})
    first = source_columns[0]
    # Match every explicitly printed POS marker without using the converter's gap grouping.
    row_words = collections.defaultdict(list)
    for w in first:
        row_words[round(float(w.attrib['yMin']), 1)].append(w)
    first_text = ' '.join(' '.join(w.text or '' for w in sorted(row, key=lambda w: float(w.attrib['xMin'])))
                          for _, row in sorted(row_words.items()))
    markers = re.findall(r'\((?:n|v|adj|adv|prep|pron|conj|art|prefix)\)', first_text)
    independent_markers += len(markers)
    expected = sum(e['part_of_speech'] is not None for e in DATA['entries'] if e['pdf_pages'][0] == n)
    if len(markers) != expected:
        independent_headers.append({'page': n, 'source': len(markers), 'json': expected})

rule_differences = []
rule_xml_differences = []
written_markdown = (OUT / 'ASD-STE100-Issue9-Part1-Writing-Rules.md').read_text()
written_pages = {}
for chunk in written_markdown.split('<!-- PDF page ')[1:]:
    page_number = int(chunk.split(';', 1)[0])
    content = chunk.split('-->', 1)[1].strip()
    content = content.split('\n', 1)[1].strip()
    content = content.split('![原文插图', 1)[0].strip()
    written_pages[page_number] = content
assert set(written_pages) == set(range(43, 129))
for page in AUDIT['rules']:
    original = page['source_text']
    rendered = written_pages[page['pdf_page']]
    # Remove only the converter's exact Markdown syntax, never original punctuation.
    decoded = []
    in_code = False
    for line in rendered.splitlines():
        if line in ('```text', '```'):
            in_code = not in_code
            continue
        if not in_code:
            line = re.sub(r'^#{2,3} ', '', line)
            line = re.sub(r'\\([\\`*_<>])', r'\1', line)
        decoded.append(line)
    if compact(original) != compact('\n'.join(decoded)):
        rule_differences.append(page['pdf_page'])
    n = page['pdf_page']
    words = [w for w in PAGES[n - 1].findall('.//x:word', NS)
             if 55 < float(w.attrib['yMin']) < 720]
    if chars(''.join(w.text or '' for w in words)) != chars(original):
        rule_xml_differences.append({'pdf_page': n,
                                    'xml_only': dict(chars(''.join(w.text or '' for w in words)) - chars(original)),
                                    'layout_only': dict(chars(original) - chars(''.join(w.text or '' for w in words)))})

record_differences = []
for index, entry in enumerate(DATA['entries']):
    fragment = entry['source_fragments'][0]
    n = fragment['pdf_page']
    start = min(s['y'] for s in fragment['positioned_text']) - 12
    end = 715
    if index + 1 < len(DATA['entries']):
        next_fragment = DATA['entries'][index + 1]['source_fragments'][0]
        if next_fragment['pdf_page'] == n:
            end = min(s['y'] for s in next_fragment['positioned_text']) - 12
    for c, key in enumerate(FIELDS):
        words = [w for w in independent_columns[n][c] if start <= float(w.attrib['yMin']) < end]
        words.sort(key=lambda w: (float(w.attrib['yMin']), float(w.attrib['xMin'])))
        rows = []
        for word in words:
            y = float(word.attrib['yMin'])
            if not rows or y - float(rows[-1][0].attrib['yMin']) > 4:
                rows.append([])
            rows[-1].append(word)
        source = ''.join(w.text or '' for row in rows
                         for w in sorted(row, key=lambda w: float(w.attrib['xMin'])))
        actual = entry[key]
        if compact(source) != compact(actual):
            record_differences.append({'id': entry['id'], 'headword': entry['headword'], 'pdf_page': n,
                                       'column': c, 'source': source, 'actual': actual})

intro_differences = []
for page in DATA['introductory_pages']:
    words = [w for w in PAGES[page['pdf_page'] - 1].findall('.//x:word', NS)
             if 55 < float(w.attrib['yMin']) < 720]
    if chars(''.join(w.text or '' for w in words)) != chars(page['text']):
        intro_differences.append(page['pdf_page'])
image_listing = subprocess.check_output(['pdfimages', '-f', '129', '-l', '148', '-list',
                                        '/Users/caishilin/Downloads/ASD-STE100_ISSUE9.pdf']).decode()
image_pages = set()
for line in image_listing.splitlines()[2:]:
    columns = line.split()
    if len(columns) >= 5 and columns[2] == 'image' and tuple(map(int, columns[3:5])) not in [(173, 60), (172, 60)]:
        image_pages.add(int(columns[0]))
represented_image_pages = {page['pdf_page'] for page in DATA['introductory_pages'] if 'images' in page or 'flowchart' in page}
flowchart = next(page['flowchart'] for page in DATA['introductory_pages'] if 'flowchart' in page)
node_ids = [node['id'] for node in flowchart['nodes']]
assert len(node_ids) == len(set(node_ids))
assert all(edge['from'] in node_ids and edge['to'] in node_ids for edge in flowchart['edges'])
assert all(edge['label'] in ['Yes', 'No', None] for edge in flowchart['edges'])
assert (OUT / flowchart['image_path']).is_file()
assert image_pages == represented_image_pages
assert len(DATA['introductory_pages']) == 20

rules = set(re.findall(r'\bRule (\d\.\d+)\b', '\n'.join(p['source_text'] for p in AUDIT['rules'])))
keys = [(e['headword'], e['part_of_speech']) for e in DATA['entries']]
report = {
    'entry_count': len(DATA['entries']),
    'independent_pos_marker_count': independent_markers,
    'entries_without_printed_pos': [e['headword'] for e in DATA['entries'] if e['part_of_speech'] is None],
    'duplicate_headword_pos_pairs': [list(k) for k, v in collections.Counter(keys).items() if v > 1],
    'empty_meaning_entries': [e['id'] for e in DATA['entries'] if not e['meaning_or_alternatives']],
    'empty_ste_example_entries': [e['id'] for e in DATA['entries'] if not e['ste_examples']],
    'dictionary_page_character_differences': page_differences,
    'dictionary_column_character_differences': column_differences,
    'independent_headword_count_differences': independent_headers,
    'record_column_order_differences': record_differences,
    'rules_markdown_roundtrip_differences': rule_differences,
    'rules_pdf_text_differences': rule_xml_differences,
    'dictionary_intro_text_differences': intro_differences,
    'dictionary_intro_image_pages': sorted(image_pages),
    'dictionary_intro_represented_image_pages': sorted(represented_image_pages),
    'flowchart_node_count': len(node_ids),
    'flowchart_edge_count': len(flowchart['edges']),
    'flowchart_transcription_check': '主 Agent 对照 PDF 第144页渲染图人工核对17个节点、18条有向连线及标签；图中文字不是文本层比较的覆盖范围。',
    'unique_rule_count': len(rules),
    'rule_ids': sorted(rules, key=lambda s: tuple(map(int, s.split('.')))),
    'files': {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
              for p in OUT.iterdir() if p.is_file()},
}
Path('/tmp/ste100-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
