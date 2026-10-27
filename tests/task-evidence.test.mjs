import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { prepareSnapshot, verifySnapshot, isSnapshotReference } = require("../skills/meta/csl-tasks/shared/lib/task-evidence.js");

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "csl-evidence-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return fs.realpathSync(directory);
}

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function save(snapshot) {
  fs.mkdirSync(path.dirname(snapshot.file), { recursive: true });
  fs.writeFileSync(snapshot.file, snapshot.text, { flag: "wx" });
  return snapshot;
}

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function repository(t) {
  const root = workspace(t);
  git(root, "init", "--quiet");
  git(root, "config", "user.name", "Snapshot Fixture");
  git(root, "config", "user.email", "snapshot@example.test");
  git(root, "config", "commit.gpgsign", "false");
  return root;
}

function commit(root, file = "source.txt", content = "original\n") {
  write(root, file, content);
  git(root, "add", "--", file);
  git(root, "commit", "--quiet", "-m", "Fixture");
}

test("explicit non-Git snapshots are deterministic, sorted, immutable plans", (t) => {
  const root = workspace(t);
  write(root, "a.txt", "A\n");
  write(root, "nested/b.txt", Buffer.from([0, 255, 1]));
  const first = prepareSnapshot(root, "demo", ["nested/b.txt", "a.txt"]);
  assert.equal(fs.existsSync(first.file), false);
  assert.deepEqual(first.manifest.files.map((item) => item.path), ["a.txt", "nested/b.txt"]);
  assert.equal(first.manifest.files[0].git, null);
  assert.deepEqual(prepareSnapshot(root, "demo", ["a.txt", "nested/b.txt"]), first);
  save(first);
  assert.deepEqual(verifySnapshot(root, "demo", first.reference), first.manifest);
  assert.deepEqual(prepareSnapshot(root, "demo", ["a.txt", "nested/b.txt"]), first);
  fs.writeFileSync(first.file, "changed\n");
  assert.throws(() => prepareSnapshot(root, "demo", ["a.txt", "nested/b.txt"]), /immutable snapshot is corrupt/);
});

test("verification detects declared content drift and preserves historical manifests", (t) => {
  const root = workspace(t);
  write(root, "source.txt", "before");
  const snapshot = save(prepareSnapshot(root, "demo", ["source.txt"]));
  write(root, "unrelated.txt", "does not invalidate declared scope");
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference), snapshot.manifest);
  write(root, "source.txt", "after");
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /changed: source.txt/);
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference, { current: false }), snapshot.manifest);
  fs.unlinkSync(path.join(root, "source.txt"));
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /missing and not Git-tracked/);
  fs.symlinkSync(path.join(root, "unrelated.txt"), path.join(root, "source.txt"));
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /symlinks/);
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference, { current: false }), snapshot.manifest);
});

test("reference, manifest bytes and schema tampering fail closed", (t) => {
  const root = workspace(t);
  write(root, "source.txt", "original");
  const snapshot = save(prepareSnapshot(root, "demo", ["source.txt"]));
  assert.equal(isSnapshotReference("owner-attested-v1"), false);
  for (const reference of ["snapshot:broken", " SNAPSHOT:broken", snapshot.reference.replace("#", "#0"), snapshot.reference.replace("/demo/", "/other/")]) {
    assert.equal(isSnapshotReference(reference), true);
    assert.throws(() => verifySnapshot(root, "demo", reference), /invalid snapshot reference/);
  }
  assert.throws(() => verifySnapshot(root, "other", snapshot.reference), /task identity/);
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference, { current: "false" }), /must be boolean/);
  fs.appendFileSync(snapshot.file, " ");
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /digest/);
  const malformed = { ...snapshot.manifest, schema: "task-snapshot/v99" };
  const text = JSON.stringify(malformed);
  const digest = createHash("sha256").update(text).digest("hex");
  write(root, `tasks/artifacts/demo/evidence/${digest}.json`, text);
  assert.throws(() => verifySnapshot(root, "demo", `snapshot:tasks/artifacts/demo/evidence/${digest}.json#${digest}`), /manifest schema/);
});

test("invalid scope, directories, missing files and self-reference are rejected", (t) => {
  const root = workspace(t);
  write(root, "source.txt", "original");
  for (const files of [[], null, ["source.txt", "source.txt"], ["../outside"], [path.join(root, "source.txt")], ["./source.txt"], ["missing.txt"], ["dir\\file"], ["bad\nname"], [42]]) {
    assert.throws(() => prepareSnapshot(root, "demo", files));
  }
  fs.mkdirSync(path.join(root, "directory"));
  assert.throws(() => prepareSnapshot(root, "demo", ["directory"]), /regular file/);
  for (const file of ["tasks/tasks.md", "tasks/tasks/demo.md", `tasks/artifacts/demo/evidence/${"a".repeat(64)}.json`]) {
    write(root, file, "own task state");
    assert.throws(() => prepareSnapshot(root, "demo", [file]), /own lifecycle files/);
  }
  assert.throws(() => prepareSnapshot(root, "demo", ["TASKS/TASKS/DEMO.MD"]), /own lifecycle files/);
  for (const file of ["tasks/artifacts/demo/spec.md", "tasks/artifacts/demo/reports/review.md", "tasks/artifacts/demo/evidence/check.log"]) {
    write(root, file, "explicit deliverable or check evidence");
    const snapshot = save(prepareSnapshot(root, "demo", [file]));
    assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference), snapshot.manifest);
  }
  write(root, "tasks/tasks/other.md", "another task as a review input");
  assert.doesNotThrow(() => prepareSnapshot(root, "demo", ["tasks/tasks/other.md"]));
  assert.throws(() => prepareSnapshot(root, "../demo", ["source.txt"]), /invalid task id/);
});

test("symlink scope and storage paths cannot escape the workspace", (t) => {
  const root = workspace(t), outside = workspace(t);
  write(outside, "file.txt", "external");
  fs.symlinkSync(path.join(outside, "file.txt"), path.join(root, "linked.txt"));
  fs.symlinkSync(outside, path.join(root, "linked-directory"));
  assert.throws(() => prepareSnapshot(root, "demo", ["linked.txt"]), /symlinks/);
  assert.throws(() => prepareSnapshot(root, "demo", ["linked-directory/file.txt"]), /symlinks/);
  write(root, "source.txt", "original");
  const snapshot = prepareSnapshot(root, "demo", ["source.txt"]);
  fs.mkdirSync(path.join(root, "tasks/artifacts/demo"), { recursive: true });
  fs.symlinkSync(outside, path.join(root, "tasks/artifacts/demo/evidence"));
  assert.throws(() => prepareSnapshot(root, "demo", ["source.txt"]), /symlinks/);
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /symlinks/);
});

test("Git snapshots detect staged-only drift with unchanged working tree bytes", (t) => {
  const root = repository(t);
  commit(root);
  const snapshot = save(prepareSnapshot(root, "demo", ["source.txt"]));
  assert.equal(snapshot.manifest.files[0].git.index[0].object, snapshot.manifest.files[0].git.head.object);
  write(root, "source.txt", "staged\n");
  git(root, "add", "source.txt");
  write(root, "source.txt", "original\n");
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /Git identity changed/);
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference, { current: false }), snapshot.manifest);
});

test("Git HEAD identity is per-file and unrelated commits do not invalidate scope", (t) => {
  const root = repository(t);
  commit(root);
  const snapshot = save(prepareSnapshot(root, "demo", ["source.txt"]));
  commit(root, "unrelated.txt", "other\n");
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference), snapshot.manifest);
  commit(root, "source.txt", "new HEAD\n");
  write(root, "source.txt", "original\n");
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /Git identity changed/);
});

test("only tracked deletions can produce missing-file snapshots", (t) => {
  const root = repository(t);
  commit(root);
  fs.unlinkSync(path.join(root, "source.txt"));
  git(root, "add", "-u", "--", "source.txt");
  const snapshot = save(prepareSnapshot(root, "demo", ["source.txt"]));
  assert.equal(snapshot.manifest.files[0].sha256, null);
  assert.deepEqual(snapshot.manifest.files[0].git.index, []);
  assert.ok(snapshot.manifest.files[0].git.head.object);
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference), snapshot.manifest);
  assert.throws(() => prepareSnapshot(root, "demo", ["typo.txt"]), /missing and not Git-tracked/);
  write(root, "source.txt", "restored");
  assert.throws(() => verifySnapshot(root, "demo", snapshot.reference), /changed/);
});

test("unborn repositories preserve index identity and tracked missing additions", (t) => {
  const root = repository(t);
  write(root, "new.txt", "new\n");
  git(root, "add", "new.txt");
  const snapshot = save(prepareSnapshot(root, "demo", ["new.txt"]));
  assert.equal(snapshot.manifest.files[0].git.head, null);
  assert.equal(snapshot.manifest.files[0].git.index.length, 1);
  assert.deepEqual(verifySnapshot(root, "demo", snapshot.reference), snapshot.manifest);
  fs.unlinkSync(path.join(root, "new.txt"));
  assert.equal(prepareSnapshot(root, "demo", ["new.txt"]).manifest.files[0].sha256, null);
});

test("nested workspaces use literal paths relative to the actual repository root", (t) => {
  const root = repository(t);
  commit(root, "nested/[source].txt", "selected\n");
  commit(root, "[source].txt", "outside\n");
  const nested = path.join(root, "nested");
  const snapshot = save(prepareSnapshot(nested, "demo", ["[source].txt"]));
  assert.ok(snapshot.manifest.files[0].git.head.object);
  assert.deepEqual(verifySnapshot(nested, "demo", snapshot.reference), snapshot.manifest);
  write(root, "[source].txt", "outside changed\n");
  git(root, "add", "--", "[source].txt");
  assert.deepEqual(verifySnapshot(nested, "demo", snapshot.reference), snapshot.manifest);
  write(nested, "[source].txt", "inside staged\n");
  git(root, "add", "--", "nested/[source].txt");
  write(nested, "[source].txt", "selected\n");
  assert.throws(() => verifySnapshot(nested, "demo", snapshot.reference), /Git identity changed/);
});
