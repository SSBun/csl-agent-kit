import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../skills/meta/csl-tasks/shared/lib/task-core.js');
const storage = require('../skills/meta/csl-tasks/shared/lib/task-storage.js');
const migration = require('../skills/meta/csl-tasks/shared/scripts/migrate-task-storage.js');
const evidence = require('../skills/meta/csl-tasks/shared/lib/task-evidence.js');
const topics = require('../skills/meta/csl-tasks/shared/lib/topic-core.js');

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'csl-storage-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.csl-agent-kit/migrations'), { recursive: true });
  return root;
}

function create(root, id = 'sample') {
  core.createTask(root, { id, title: '合成迁移任务', kind: 'task', targets: ['T1: 检查'] });
}

test('explicit migration preserves relative links, historical identity and normal lifecycle', t => {
  const root = fixture(t);
  create(root);
  const file = core.taskPath(root, 'sample');
  fs.writeFileSync(path.join(root, 'README.md'), '# Source\n');
  fs.appendFileSync(file, '\n## Task Summary\n\n[源码](../../README.md)\n');
  const before = fs.readFileSync(file, 'utf8');
  const fingerprint = core.reviewTaskFingerprint(before);
  fs.writeFileSync(path.join(root, 'tasks/historical.md'), '# Historical immutable\n');
  const prepared = migration.prepare(root, 'cutover');
  assert.equal(prepared.repairedDocuments, 1);
  assert.equal(storage.layout(root).root, 'tasks');
  migration.apply(root, 'cutover');
  assert.equal(fs.existsSync(path.join(root, 'tasks')), false);
  const task = core.readTask(root, 'sample');
  assert.match(task.text, /\(\.\.\/\.\.\/\.\.\/README.md\)/);
  assert.equal(core.reviewTaskFingerprint(task.text, task.file), fingerprint);
  assert.notEqual(core.reviewTaskFingerprint(task.text + '\nChanged\n', task.file), fingerprint);
  assert.equal(fs.readFileSync(storage.taskPath(root, 'historical.md'), 'utf8'), '# Historical immutable\n');
  core.resumeTask(root, 'sample');
  assert.equal(core.readTask(root, 'sample').status.state, 'in_progress');
  create(root, 'new-task');
  assert.ok(fs.existsSync(path.join(root, '.csl-agent-kit/tasks/tasks/new-task.md')));
  assert.equal(migration.apply(root, 'cutover').status, 'current');
});

test('historical snapshot remains verifiable without rewriting manifest bytes', t => {
  const root = fixture(t);
  create(root);
  create(root, 'other');
  const other = core.taskPath(root, 'other');
  fs.appendFileSync(other, '\n## Task Summary\n\n[源码](../../README.md)\n');
  const snap = evidence.prepareSnapshot(root, 'sample', ['tasks/tasks/other.md']);
  fs.mkdirSync(path.dirname(snap.file), { recursive: true });
  fs.writeFileSync(snap.file, snap.text);
  migration.prepare(root, 'cutover');
  migration.apply(root, 'cutover');
  evidence.verifySnapshot(root, 'sample', snap.reference);
  fs.appendFileSync(core.taskPath(root, 'other'), '\nChanged\n');
  assert.throws(() => evidence.verifySnapshot(root, 'sample', snap.reference), /changed/);
  const modern = evidence.prepareSnapshot(root, 'sample', ['.csl-agent-kit/tasks/tasks/other.md']);
  assert.match(modern.reference, /^snapshot:\.csl-agent-kit\/tasks\//);
});

test('source drift and a conflicting destination prevent cutover', t => {
  const root = fixture(t);
  create(root);
  migration.prepare(root, 'cutover');
  fs.appendFileSync(core.taskPath(root, 'sample'), '\nDrift\n');
  assert.throws(() => migration.apply(root, 'cutover'), /drift/);
  assert.ok(fs.existsSync(path.join(root, 'tasks/tasks.md')));
  assert.equal(fs.existsSync(path.join(root, storage.MARKER)), false);
  fs.mkdirSync(path.join(root, storage.TARGET));
  assert.throws(() => migration.apply(root, 'cutover'), /already exists/);
});

test('migration marker blocks runtime and corrupted manifest is rejected', t => {
  const root = fixture(t);
  create(root);
  migration.prepare(root, 'cutover');
  migration.apply(root, 'cutover');
  const markerPath = path.join(root, storage.MARKER);
  const marker = JSON.parse(fs.readFileSync(markerPath));
  fs.writeFileSync(markerPath, JSON.stringify({ ...marker, state: 'migrating' }));
  assert.throws(() => core.readTask(root, 'sample'), /in progress/);
  fs.writeFileSync(markerPath, JSON.stringify(marker));
  fs.appendFileSync(path.join(root, '.csl-agent-kit', marker.manifest), ' ');
  assert.throws(() => storage.manifest(root), /digest mismatch/);
});

test('link relocation does not rewrite fenced or inline code examples', t => {
  const root = fixture(t);
  const input = '`[literal](../../README.md)`\n```md\n[literal](../../README.md)\n```\n[real](../../README.md)\n';
  const output = migration.rebaseLinks(input, 'tasks/tasks/sample.md', root);
  assert.equal(output, '`[literal](../../README.md)`\n```md\n[literal](../../README.md)\n```\n[real](../../../README.md)\n');
});

test('same-directory links keep dot paths rather than becoming root links', t => {
  const root = fixture(t);
  const text = '[tasks](./) [same](.) [anchor](./#section)\n';
  assert.equal(migration.rebaseLinks(text, 'tasks/tasks/sample.md', root), text);
});

test('kernel no-replace rename rejects an existing directory', t => {
  const root = fixture(t);
  const a = path.join(root, 'a'), b = path.join(root, 'b');
  fs.mkdirSync(a); fs.mkdirSync(b);
  assert.throws(() => migration.renameExclusive(a, b));
  assert.ok(fs.existsSync(a));
  assert.ok(fs.existsSync(b));
});

test('Topic normative identity and external resource links survive relocation', t => {
  const root = fixture(t);
  create(root);
  fs.writeFileSync(path.join(root, 'spec.md'), '规范\n');
  const topic = topics.createTopic(root, 'shared', '共享规范', { scope: '本项目', spec: '保留身份', decisions: '无变化', dependencies: [] });
  const updated = topics.updateResources(root, 'shared', topic.version, [{ label: '规范', target: 'spec.md', purpose: '权威内容', kind: 'normative', sha256: topics.hash('规范\n') }]);
  migration.prepare(root, 'cutover'); migration.apply(root, 'cutover');
  const current = topics.readTopic(root, 'shared');
  assert.equal(current.revision, updated.revision);
  assert.match(current.text, /\.\.\/\.\.\/\.\.\/spec.md/);
  topics.updateResources(root, 'shared', current.version, current.resources);
  assert.equal(topics.readTopic(root, 'shared').revision, updated.revision);
});

test('Topic directory resource type and trailing slash survive relocation', t => {
  const root = fixture(t);
  create(root);
  fs.mkdirSync(path.join(root, 'docs'));
  const topic = topics.createTopic(root, 'shared', '共享规范', { scope: '本项目', spec: '保留身份', decisions: '无变化', dependencies: [] });
  const updated = topics.updateResources(root, 'shared', topic.version, [{ label: '文档', target: 'docs', purpose: '参考目录', kind: 'reference', type: 'directory' }]);
  migration.prepare(root, 'cutover'); migration.apply(root, 'cutover');
  const current = topics.readTopic(root, 'shared');
  assert.deepEqual(current.resources, updated.resources);
  assert.equal(current.revision, updated.revision);
  assert.match(current.text, /<\.\.\/\.\.\/\.\.\/docs\/>/);
  assert.ok(topics.resourceViews(root, current)[0].href.endsWith('/docs/'));
});

test('Topic normative link relocation is rejected before preparing a publishable manifest', t => {
  const root = fixture(t);
  create(root);
  topics.createTopic(root, 'shared', '共享规范', { scope: '本项目', spec: '[源码](../../README.md)', decisions: '无变化', dependencies: [] });
  assert.throws(() => migration.prepare(root, 'cutover'), /Topic normative content would change/);
  assert.equal(fs.existsSync(path.join(root, storage.MARKER)), false);
  assert.equal(fs.existsSync(path.join(root, '.csl-agent-kit/migrations/cutover/manifest.json')), false);
  assert.ok(topics.readTopic(root, 'shared'));
});

test('apply rechecks Topic normative content in previously prepared trees before moving the source', t => {
  const root = fixture(t);
  create(root);
  topics.createTopic(root, 'shared', '共享规范', { scope: '本项目', spec: '保留身份', decisions: '无变化', dependencies: [] });
  migration.prepare(root, 'cutover');
  const base = path.join(root, '.csl-agent-kit/migrations/cutover');
  const staged = path.join(base, 'stage/tasks/topics/shared.md');
  const changed = fs.readFileSync(staged, 'utf8').replace('保留身份', '[源码](../../../README.md)');
  fs.writeFileSync(staged, changed);
  const manifestPath = path.join(base, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  const entry = manifest.files.find(item => item.source === 'tasks/topics/shared.md');
  entry.afterHash = storage.hash(Buffer.from(changed));
  entry.afterSize = Buffer.byteLength(changed);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.throws(() => migration.apply(root, 'cutover'), /Topic normative content would change/);
  assert.ok(fs.existsSync(path.join(root, 'tasks/topics/shared.md')));
  assert.equal(fs.existsSync(path.join(root, storage.TARGET)), false);
  assert.equal(fs.existsSync(path.join(base, 'retired-tasks')), false);
});

test('an interrupted frozen migration can resume or roll back without deleting backups', t => {
  const root = fixture(t);
  create(root);
  migration.prepare(root, 'cutover');
  const manifestPath = path.join(root, '.csl-agent-kit/migrations/cutover/manifest.json');
  const marker = { schema: 'csl-task-storage/v1', state: 'migrating', manifest: 'migrations/cutover/manifest.json', sha256: storage.hash(fs.readFileSync(manifestPath)) };
  fs.writeFileSync(path.join(root, storage.MARKER), JSON.stringify(marker));
  migration.renameExclusive(path.join(root, 'tasks'), path.join(root, '.csl-agent-kit/migrations/cutover/retired-tasks'));
  assert.equal(migration.rollback(root, 'cutover').status, 'rolled-back');
  assert.equal(core.readTask(root, 'sample').id, 'sample');
  migration.apply(root, 'cutover');
  assert.throws(() => migration.rollback(root, 'cutover'), /incomplete/);
});

test('new snapshot cannot include its own canonical lifecycle files', t => {
  const root = fixture(t);
  create(root);
  migration.prepare(root, 'cutover'); migration.apply(root, 'cutover');
  assert.throws(() => evidence.prepareSnapshot(root, 'sample', ['.csl-agent-kit/tasks/tasks/sample.md']), /own lifecycle/);
});
