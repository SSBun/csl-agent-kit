from pathlib import Path
import difflib
import hashlib
import json
import subprocess

root = Path.cwd()
out = root / '.csl-agent-kit/tasks/artifacts/commit-inline-review-and-guard/evidence'
out.mkdir(parents=True, exist_ok=True)

def head(path):
    return subprocess.check_output(['git', 'show', 'HEAD:' + path], text=True)

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError('Expected one match: ' + old[:100])
    return text.replace(old, new, 1)

def current_line(path, prefix):
    matches = [line for line in Path(path).read_text().splitlines() if line.startswith(prefix)]
    if len(matches) != 1:
        raise RuntimeError('Ambiguous line: ' + prefix)
    return matches[0]

selected = {}
path = '.claude-plugin/plugin.json'
selected[path] = replace_once(head(path), '    "./skills/dev/brainstorming",', '    "./skills/dev/brainstorming",\n    "./skills/dev/code-inline-review",\n    "./skills/dev/commit-guard",')
path = 'README.md'
anchor = current_line(path, '| brainstorming |')
selected[path] = replace_once(head(path), anchor, anchor + '\n' + current_line(path, '| code-inline-review |') + '\n' + current_line(path, '| commit-guard |'))
path = 'package.json'
selected[path] = replace_once(head(path), '    "test:agent-hooks": "node --test tests/agent-hooks.test.js",', '    "test:agent-hooks": "node --test tests/agent-hooks.test.js tests/commit-guard.test.js",\n    "test:commit-guard": "node --test tests/commit-guard.test.js",')
path = 'skills/meta/agent-hooks/SKILL.md'
text = head(path)
old = next(line for line in text.splitlines() if line.startswith('- Pi runs triggers'))
text = replace_once(text, old, current_line(path, '- Pi runs triggers'))
old = next(line for line in text.splitlines() if line.startswith('- Use Agent Hooks for'))
new = '\n'.join(current_line(path, prefix) for prefix in ['- Use Agent Hooks for', '- `before-tool` / `run-script`', '- `commit-guard`'])
selected[path] = replace_once(text, old, new)
path = 'docs/rfcs/agent-hooks.md'
text = head(path)
anchor = '未知 capability 必须按 unsupported 处理。事件名相同不能作为能力相同的证据。'
text = replace_once(text, anchor, anchor + '\n\n' + current_line(path, '当前 Pi 适配的'))
anchor = '| `timeout` | 否 | 正整数秒；必须受运行时默认值和上限约束 |'
text = replace_once(text, anchor, anchor + '\n' + current_line(path, '| `on-error`'))
text = replace_once(text, '- 不阻止其他有效规则运行。', current_line(path, '- 通常不阻止其他有效规则运行') + '\n\n' + current_line(path, '`on-error: block` 也覆盖'))
old = '- `before-tool` 的 commit 检查只是 Agent 内提前反馈，最终约束应复用 Git `pre-commit` 或 CI。\n- Runtime error 默认 fail-open，因此 Agent Hooks V1 不是安全强制边界。'
new = '\n'.join(current_line(path, prefix) for prefix in ['- `before-tool` 的 commit 检查保护', '- `commit-guard` 拥有', '- Runtime error 默认尽力'])
selected[path] = replace_once(text, old, new)
path = 'pi/extensions/csl-context-hooks.ts'
text = head(path)
text = replace_once(text, '): { prompts: TriggerPrompt[]; diagnostics: string[]; blocked: boolean };', '): { prompts: TriggerPrompt[]; diagnostics: string[]; blocked: boolean; reason?: string };')
start = '\tpi.on("tool_call", async (event, ctx) => {'
end = '\n\t\tif (toolReminderShown'
working = Path(path).read_text()
old_start = text.index(start)
old_end = text.index(end, old_start)
new_start = working.index(start)
new_end = working.index(end, new_start)
selected[path] = text[:old_start] + working[new_start:new_end] + text[old_end:]
for path in ['skills/meta/agent-hooks/scripts/lib/native-hook.js', 'skills/meta/agent-hooks/scripts/lib/rule.js', 'skills/meta/agent-hooks/scripts/lib/runtime.js']:
    selected[path] = Path(path).read_text()

patch = []
for path, content in selected.items():
    original = head(path)
    patch.extend(difflib.unified_diff(original.splitlines(True), content.splitlines(True), fromfile='a/' + path, tofile='b/' + path))
(out / 'selected.patch').write_text(''.join(patch))
new_files = [str(p) for directory in ['skills/dev/code-inline-review', 'skills/dev/commit-guard'] for p in sorted(Path(directory).rglob('*')) if p.is_file()]
new_files += ['skills/meta/agent-hooks/hooks/code-inline-review-commit.md', 'skills/meta/agent-hooks/scripts/check-code-review-commit.js', 'tests/commit-guard.test.js']
all_files = list(selected) + new_files
manifest = {
    'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'selected': {p: hashlib.sha256(content.encode()).hexdigest() for p, content in selected.items()},
    'newFiles': new_files,
    'workingTree': {p: hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in all_files},
}
(out / 'selection.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'modified': list(selected), 'newFiles': new_files, 'count': len(all_files)}, ensure_ascii=False, indent=2))
