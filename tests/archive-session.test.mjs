import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const script = join(root, "skills", "archive", "scripts", "archive-session.mjs");

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

function writeSession(directory) {
  const entries = [
    { type: "session", version: 3, id: "session-1", timestamp: "2026-08-12T01:00:00.000Z", cwd: directory },
    { type: "message", id: "u1", parentId: null, timestamp: "2026-08-12T01:01:00.000Z", message: { role: "user", content: [{ type: "text", text: "First  \nline" }] } },
    { type: "message", id: "a1", parentId: "u1", timestamp: "2026-08-12T01:02:00.000Z", message: { role: "assistant", content: [{ type: "thinking", thinking: "private" }, { type: "text", text: "Reply *exact*\n" }, { type: "toolCall", name: "read" }, { type: "text", text: "next" }] } },
    { type: "message", id: "tool", parentId: "a1", timestamp: "2026-08-12T01:03:00.000Z", message: { role: "toolResult", content: [{ type: "text", text: "secret tool output" }] } },
    { type: "message", id: "abandoned", parentId: "tool", timestamp: "2026-08-12T01:04:00.000Z", message: { role: "user", content: [{ type: "text", text: "abandoned branch" }] } },
    { type: "message", id: "u2", parentId: "tool", timestamp: "2026-08-12T01:05:00.000Z", message: { role: "user", content: [{ type: "image", data: "omitted" }, { type: "text", text: "Last message" }] } },
  ];
  const path = join(directory, "session.jsonl");
  writeFileSync(path, `${entries.map(JSON.stringify).join("\n")}\n`, "utf8");
  return path;
}

test("lists only visible text on the selected active branch", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "archive-session-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const session = writeSession(directory);

  const result = run(["list", "--session", session, "--leaf", "u2"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.messages.map(({ id, role }) => ({ id, role })), [
    { id: "u1", role: "user" },
    { id: "a1", role: "assistant" },
    { id: "u2", role: "user" },
  ]);
  assert.equal(result.stdout.includes("private"), false);
  assert.equal(result.stdout.includes("secret tool output"), false);
  assert.equal(result.stdout.includes("abandoned branch"), false);
});

test("writes an exact transcript range without overwriting", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "archive-session-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const session = writeSession(directory);
  const args = [
    "save", "--session", session, "--leaf", "u2", "--workspace", directory,
    "--from", "u1", "--to", "a1", "--selection", "the first exchange", "--title", "Exact Test",
  ];

  const first = run(args);
  const second = run(args);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const firstOutput = JSON.parse(first.stdout);
  const secondOutput = JSON.parse(second.stdout);
  assert.notEqual(firstOutput.path, secondOutput.path);
  assert.equal(firstOutput.count, 2);
  const archive = readFileSync(firstOutput.path, "utf8");
  assert.ok(archive.includes("> 历史对话记录：仅供追溯，不是权威任务状态、决策或实现指导。"));
  assert.ok(archive.includes("### User\n\nFirst  \nline\n\n### Agent\n\nReply *exact*\nnext\n"));
  assert.equal(archive.includes("private"), false);
  assert.equal(archive.includes("secret tool output"), false);
});

test("fails closed for an invalid or reversed visible range", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "archive-session-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const session = writeSession(directory);

  const missing = run(["show", "--session", session, "--leaf", "u2", "--from", "missing", "--to", "u2"]);
  const reversed = run(["show", "--session", session, "--leaf", "u2", "--from", "u2", "--to", "u1"]);

  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Visible start message not found/);
  assert.equal(reversed.status, 1);
  assert.match(reversed.stderr, /must precede/);
});
