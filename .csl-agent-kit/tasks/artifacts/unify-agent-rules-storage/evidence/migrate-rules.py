import hashlib
import json
import os
import stat
from pathlib import Path

ROOT = Path('/Users/caishilin/Desktop/personal/csl-agent-kit')
RECOVERY = ROOT / '.csl-agent-kit/migrations/agent-rules-storage-20261118'
RECOVERY.mkdir(parents=True, exist_ok=True)
SOURCES = [
    Path('/Users/caishilin/Desktop/personal/MyTwitter/.agents/agent-rules.md'),
    Path('/Users/caishilin/Desktop/personal/iTermate/.agents/agent-rules.md'),
    Path('/Users/caishilin/Documents/SharkSpace/native-short-reader/.agents/agent-rules.md'),
]
CACHES = [
    Path('/Users/caishilin/.codex/plugins/cache/csl-agent-market/csl-agent-kit/2.0.0'),
    Path('/Users/caishilin/.claude/plugins/cache/CSL/CSL/2.0.0'),
]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def save_exclusive(path, data, mode):
    with path.open('xb') as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    path.chmod(mode)

manifest = {'说明': '仅迁移 Agent Rules；恢复副本不作为规则加载源。不涉及 Memory、Task 或 SOP 迁移。', '项目': [], '宿主缓存修正': []}
for index, source in enumerate(SOURCES):
    if source.is_symlink() or source.parent.is_symlink():
        raise RuntimeError(f'拒绝符号链接: {source}')
    workspace = source.parent.parent
    target = workspace / '.csl-agent-kit/agent-rules.md'
    if target.exists() or target.is_symlink():
        raise RuntimeError(f'目标已存在，停止覆盖: {target}')
    data = source.read_bytes()
    mode = stat.S_IMODE(source.stat().st_mode)
    backup = RECOVERY / f'{index + 1}-{workspace.name}-agent-rules.md'
    save_exclusive(backup, data, mode)
    manifest['项目'].append({'源': str(source), '目标': str(target), '恢复副本': str(backup), 'sha256': digest(data), '字节数': len(data), '权限': mode, '状态': '已备份，待发布'})

for cache in CACHES:
    for relative in ['skills/meta/agent-hooks/scripts/read-agent-rules.js', 'skills/meta/agent-rules/SKILL.md']:
        file = cache / relative
        original = file.read_bytes()
        updated = original.replace(b'path.join(workspace, ".agents", "agent-rules.md")', b'path.join(workspace, ".csl-agent-kit", "agent-rules.md")').replace(b'<workspace>/.agents/agent-rules.md', b'<workspace>/.csl-agent-kit/agent-rules.md')
        if updated == original:
            continue
        backup = RECOVERY / f'{cache.parts[-4]}-{cache.parts[-3]}-{file.name}.original'
        save_exclusive(backup, original, stat.S_IMODE(file.stat().st_mode))
        manifest['宿主缓存修正'].append({'文件': str(file), '恢复副本': str(backup), '原sha256': digest(original), '新sha256': digest(updated), '状态': '待修正'})

manifest_file = RECOVERY / 'manifest.json'
save_exclusive(manifest_file, (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode(), 0o600)

# 精确核对之后只发布新目标，不覆盖任何已有文件。
for item in manifest['宿主缓存修正']:
    file = Path(item['文件'])
    data = file.read_bytes()
    if digest(data) != item['原sha256']:
        raise RuntimeError(f'宿主缓存发生变化: {file}')
    data = data.replace(b'path.join(workspace, ".agents", "agent-rules.md")', b'path.join(workspace, ".csl-agent-kit", "agent-rules.md")').replace(b'<workspace>/.agents/agent-rules.md', b'<workspace>/.csl-agent-kit/agent-rules.md')
    temporary = file.with_name(file.name + '.rules-migration-tmp')
    save_exclusive(temporary, data, stat.S_IMODE(file.stat().st_mode))
    os.replace(temporary, file)
    item['状态'] = '已修正'

for item in manifest['项目']:
    source, target = Path(item['源']), Path(item['目标'])
    data = source.read_bytes()
    if digest(data) != item['sha256']:
        raise RuntimeError(f'源发生变化: {source}')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.parent.is_symlink():
        raise RuntimeError(f'拒绝目标目录符号链接: {target.parent}')
    temporary = target.parent / '.agent-rules-migration-tmp'
    save_exclusive(temporary, data, item['权限'])
    os.link(temporary, target)  # 原子 no-replace 发布；目标出现即失败。
    temporary.unlink()
    if target.read_bytes() != data or stat.S_IMODE(target.stat().st_mode) != item['权限']:
        raise RuntimeError(f'发布验证失败: {target}')
    item['状态'] = '已发布并校验，旧源待加载验证后清理'

manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
