#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoSkillDir = path.resolve(__dirname, '..');

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    process.stdin.on('error', () => resolve(input));
    setTimeout(() => resolve(input), 800).unref();
  });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const data = {};
  let listKey = null;

  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listKey && listMatch) {
      data[listKey].push(stripQuotes(listMatch[1].trim()));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) {
      if (!/^\s/.test(line)) listKey = null;
      continue;
    }

    listKey = null;
    const key = kv[1];
    const value = kv[2].trim();
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = stripQuotes(value);
    }
  }

  return data;
}

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, '');
}

function listMarkdown(dir) {
  try {
    return fs.readdirSync(dir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

function loadSops({ workspace = process.cwd(), userSopDir = resolveUserSopDir() } = {}) {
  const projectSopDir = path.join(path.resolve(workspace), '.agents', 'sops');
  const builtIn = listMarkdown(path.join(repoSkillDir, 'sops')).map((file) => ({ file, source: 'built-in' }));
  const user = listMarkdown(userSopDir).map((file) => ({ file, source: 'user' }));
  const project = listMarkdown(projectSopDir).map((file) => ({ file, source: 'project' }));
  const byName = new Map();

  for (const item of [...builtIn, ...user, ...project]) {
    try {
      const fm = parseFrontmatter(fs.readFileSync(item.file, 'utf8'));
      const name = typeof fm.name === 'string' && fm.name.trim()
        ? fm.name
        : path.basename(item.file, '.md');
      const whenToUse = typeof fm.when_to_use === 'string' ? fm.when_to_use : undefined;
      const globs = Array.isArray(fm.globs)
        ? fm.globs.filter((glob) => typeof glob === 'string')
        : typeof fm.globs === 'string' ? [fm.globs] : [];
      byName.set(name, { ...item, ...fm, name, when_to_use: whenToUse, globs });
    } catch {
      // One malformed or unreadable SOP must not disable all routing.
    }
  }

  return [...byName.values()];
}

function resolveUserSopDir() {
  const dataDir = process.env.CSL_AGENT_KIT_HOME || path.join(process.env.HOME || '', '.csl-agent-kit');
  return process.env.CSL_AGENT_KIT_SOPS_DIR || path.join(dataDir, 'sops');
}

function terms(value) {
  const text = Array.isArray(value) ? value.join(' ') : String(value || '');
  const stopwords = new Set([
    'use', 'when', 'the', 'and', 'for', 'with', 'this', 'that',
    'app', 'build', 'file', 'files', 'project', 'user', 'version',
    '用于',
  ]);
  const ascii = (text.toLowerCase().match(/[a-z0-9+#.]{3,}/g) || [])
    .filter((term) => !stopwords.has(term));
  const cjk = text.split(/[，。；、,.;:：\s/()（）`"'[\]{}]+/)
    .filter((term) => /[\u4e00-\u9fff]/.test(term) && term.length >= 2);
  return [...new Set([...ascii, ...cjk])];
}

function scoreSop(sop, prompt) {
  const lower = prompt.toLowerCase();
  let score = 0;

  if (lower.includes(sop.name.toLowerCase())) score += 10;
  if (lower.includes(sop.name.replace(/-/g, ' ').toLowerCase())) score += 8;

  for (const term of terms([sop.name, sop.when_to_use, sop.globs])) {
    if (lower.includes(term.toLowerCase())) score += term.length >= 5 ? 3 : 2;
  }

  for (const term of terms(sop.do_not_use_when).filter((item) => item.length >= 6)) {
    if (lower.includes(term.toLowerCase())) score -= 6;
  }

  return score;
}

function findCandidates(prompt, sops = loadSops()) {
  return sops
    .filter((sop) => sop.when_to_use)
    .map((sop) => ({ ...sop, score: scoreSop(sop, prompt) }))
    .filter((sop) => sop.score >= 5)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 3);
}

function formatCandidates(candidates) {
  if (candidates.length === 0) return '';
  const lines = ['Likely SOP candidates:'];
  for (const sop of candidates) {
    const globs = Array.isArray(sop.globs) && sop.globs.length ? ` [globs: ${sop.globs.join(', ')}]` : '';
    lines.push(`- ${sop.name}: ${sop.when_to_use}${globs} (${sop.source}: ${sop.file})`);
  }
  lines.push('Read the full matching SOP before tool use and verify its completion criteria before final.');
  return lines.join('\n');
}

function printCandidates(candidates) {
  const output = formatCandidates(candidates);
  if (output) console.log(output);
}

async function main() {
  try {
    const raw = await readStdin();
    const data = raw.trim() ? JSON.parse(raw.replace(/^\uFEFF/, '')) : {};
    const prompt = String(data.prompt || '').trim();
    if (!prompt) return;
    printCandidates(findCandidates(prompt));
  } catch {
    // Hook output is advisory; never block the session.
  }
}

module.exports = {
  findCandidates,
  formatCandidates,
  loadSops,
  parseFrontmatter,
  scoreSop,
};

if (require.main === module) {
  main();
}
