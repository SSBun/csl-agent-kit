"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const DIGEST = /^[a-f0-9]{64}$/;
// Draft remains readable for legacy records; new Topics start Active.
const STATES = new Set(["Draft", "Active", "Archived"]);
const RESERVED = new Set(["__proto__", "constructor", "prototype"]);
const core = () => require("./task-core.js");
const hash = (text) => createHash("sha256").update(text).digest("hex");

function line(value, name) {
  if (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value)) throw new Error(`${name} must be one non-empty line`);
  return value.trim();
}

function assertId(id) {
  if (!ID.test(id || "")) throw new Error(`invalid topic/task id: ${id}`);
}

function root(workspace) {
  return fs.realpathSync(path.resolve(workspace));
}

// Reject symlink traversal in owned data and normative dependencies, including missing leaves.
function safePath(workspace, relative) {
  const base = root(workspace);
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || relative.split(/[\\/]/).some((part) => !part || part === ".." || part === ".")) {
    throw new Error(`unsafe relative path: ${relative}`);
  }
  let current = base;
  for (const part of relative.split(/[\\/]/)) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`symlinks are not allowed: ${current}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return current;
}

function topicPath(workspace, id) {
  assertId(id);
  return safePath(workspace, `tasks/topics/${id}.md`);
}

function revisionPath(workspace, id, digest) {
  assertId(id);
  if (!DIGEST.test(digest || "")) throw new Error("invalid topic revision");
  return safePath(workspace, `tasks/topics/${id}/revisions/${digest}.md`);
}

function fileText(file) {
  try { return fs.readFileSync(file, "utf8"); } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function withLocks(workspaces, action) {
  const locks = [];
  try {
    for (const workspace of [...new Set(workspaces.map(root))].sort()) {
      const lock = safePath(workspace, "tasks/.topic-write.lock");
      fs.mkdirSync(path.dirname(lock), { recursive: true });
      try { fs.mkdirSync(lock); } catch (error) {
        if (error.code === "EEXIST") throw new Error(`workspace write locked: ${lock}; inspect the owner before manually recovering an abandoned lock`);
        throw error;
      }
      locks.push(lock);
      fs.writeFileSync(path.join(lock, "owner.json"), JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
    }
    return action();
  } finally {
    for (const lock of locks.reverse()) {
      try { fs.rmSync(lock, { recursive: true, force: true }); }
      catch (error) { process.emitWarning(`Lock cleanup failed: ${lock}: ${error.message}; inspect the operation result and lock owner before retrying`); }
    }
  }
}

// Synchronous rollback is best effort, not a cross-repository crash transaction.
function commit(changes) {
  for (const item of changes) {
    if (fileText(item.file) !== item.before) throw new Error(`concurrent change: ${item.file}`);
  }
  const written = [];
  try {
    for (const item of changes) {
      core().atomicWrite(item.file, item.after);
      written.push(item);
    }
  } catch (error) {
    const failed = [];
    for (const item of written.reverse()) {
      try {
        if (fileText(item.file) !== item.after) throw new Error("changed during rollback");
        if (item.before === undefined) fs.rmSync(item.file);
        else core().atomicWrite(item.file, item.before);
      } catch { failed.push(item.file); }
    }
    throw new Error(`${error.message}; association/write incomplete; inspect and repair exact references${failed.length ? `; rollback failed: ${failed.join(", ")}` : "; written files rolled back"}`);
  }
}

function registry() {
  const file = path.join(process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit"), "project-indexes", "index.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data.schemaVersion !== 1 || !data.projects || typeof data.projects !== "object" || Array.isArray(data.projects)) throw new Error("invalid project-index schema");
  return data.projects;
}

function gitIdentity(workspace) {
  const base = root(workspace);
  const top = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: base, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  if (root(top) !== base) throw new Error("project mapping must name the repository root");
  const origin = execFileSync("git", ["remote", "get-url", "origin"], { cwd: base, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  if (!origin) throw new Error("cross-project references require an origin identity");
  return hash(origin);
}

function parseRef(value) {
  const match = String(value || "").match(/^([^:]+):([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match || !PROJECT.test(match[1]) || RESERVED.has(match[1])) throw new Error(`invalid reference (project:id or self:id): ${value}`);
  return { project: match[1], id: match[2] };
}

function resolve(workspace, reference, repository) {
  const { project, id } = parseRef(reference);
  const base = root(workspace);
  if (project === "self") {
    if (repository && repository !== "local") throw new Error("self reference must use local identity");
    return { workspace: base, id, repository: "local" };
  }
  const projects = registry();
  if (!Object.hasOwn(projects, project) || !path.isAbsolute(projects[project].root || "")) throw new Error(`unmapped project: ${project}; confirm project-index mapping first`);
  const target = root(projects[project].root);
  const identity = gitIdentity(target);
  if (repository && identity !== repository) throw new Error(`repository identity changed for ${project}`);
  return { workspace: target, id, repository: identity };
}

function refFor(from, to, id) {
  if (root(from) === root(to)) return { reference: `self:${id}`, repository: "local" };
  const matches = Object.entries(registry()).filter(([key, value]) => {
    if (!PROJECT.test(key) || RESERVED.has(key) || key === "self" || !path.isAbsolute(value?.root || "")) return false;
    try { return root(value.root) === root(to); } catch { return false; }
  });
  if (matches.length !== 1) throw new Error("cross-project writes require one confirmed project-index mapping for each repository");
  return { reference: `${matches[0][0]}:${id}`, repository: gitIdentity(to) };
}

function body(text, name, required = true) {
  const sections = core().sectionsOf(text, name);
  if (sections.length > 1 || (required && sections.length !== 1)) throw new Error(`expected one ${name} section`);
  if (!sections.length) return "";
  const item = sections[0];
  return item.lines.slice(item.start + 1, item.end).join("\n").trim();
}

function fields(text, required) {
  const values = {};
  for (const raw of text.split(/\r?\n/).filter((entry) => entry.trim())) {
    const match = raw.match(/^- ([A-Za-z]+): (.+)$/);
    if (!match || !required.includes(match[1]) || Object.hasOwn(values, match[1])) throw new Error(`invalid or duplicate field: ${raw}`);
    values[match[1]] = match[2];
  }
  if (required.some((key) => !values[key])) throw new Error(`missing fields: ${required.join(", ")}`);
  return values;
}

function jsonLines(value, name) {
  return value ? value.split("\n").map((entry) => {
    if (!entry.startsWith("- ")) throw new Error(`invalid ${name} entry`);
    const parsed = JSON.parse(entry.slice(2));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`invalid ${name} object`);
    return parsed;
  }) : [];
}

function validateSpec(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !["scope", "spec", "decisions", "dependencies"].includes(key))) throw new Error("spec input accepts scope, spec, decisions, dependencies only");
  const out = {};
  for (const key of ["scope", "spec", "decisions"]) {
    if (typeof (input[key] ?? "") !== "string") throw new Error(`invalid ${key}`);
    out[key] = (input[key] || "").replace(/\r\n/g, "\n").trim();
    if ((key !== "decisions" && !out[key]) || /^#{1,2}(?:\s|$)/m.test(out[key])) throw new Error(`${key} must be non-empty when required and contain no H1/H2 headings`);
  }
  out.dependencies = input.dependencies || [];
  if (!Array.isArray(out.dependencies)) throw new Error("dependencies must be an array");
  const seen = new Set();
  for (const dep of out.dependencies) {
    if (!dep || Object.keys(dep).sort().join(",") !== "path,sha256" || !DIGEST.test(dep.sha256) || typeof dep.path !== "string" || seen.has(dep.path)) throw new Error("invalid or duplicate dependency");
    if (path.isAbsolute(dep.path) || dep.path.split(/[\\/]/).some((part) => !part || part === "." || part === "..")) throw new Error("dependency must be a safe repository-relative file");
    seen.add(dep.path);
  }
  return out;
}

function validateResources(input, { allowTaskReferences = false } = {}) {
  if (!Array.isArray(input)) throw new Error("resources must be an array");
  const seen = new Set();
  return input.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || !["normative", "reference"].includes(item.kind)) throw new Error("resource kind must be normative or reference");
    const keys = item.kind === "normative" ? "kind,label,purpose,sha256,target" : `kind,label,purpose,target${item.type === "directory" ? ",type" : ""}`;
    if (Object.keys(item).sort().join(",") !== keys) throw new Error("invalid resource fields; only normative files have sha256 and only references may be directories");
    const label = line(item.label, "resource label"), purpose = line(item.purpose, "resource purpose");
    if (/[\[\]|<>\\]/.test(label) || /[|<>\\]/.test(purpose)) throw new Error("resource label/purpose cannot contain Markdown delimiters");
    const target = line(item.target, "resource target");
    if (/^https?:\/\//.test(target)) {
      const url = new URL(target);
      if (item.kind !== "reference" || url.username || url.password || /[|<>\\]/.test(target) || url.href !== target) throw new Error("URLs must be canonical credential-free reference links; normative sources require a pinned local file");
    } else if (path.isAbsolute(target) || /[:\\\u0000-\u001f\u007f]/.test(target) || target.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error("resource target must be an owner-repository-relative file or an HTTP(S) reference");
    }
    const targetPath = /^https?:\/\//.test(target) ? decodeURIComponent(new URL(target).pathname) : target;
    if (!allowTaskReferences && /(^|\/)tasks\/tasks(?:\.md$|\/|$)/.test(targetPath)) throw new Error("task records belong in Tasks; use reference-task for history, not Resources");
    if (item.type === "directory" && /^https?:\/\//.test(target)) throw new Error("directory resources must be local references");
    if (seen.has(target)) throw new Error("duplicate resource target");
    seen.add(target);
    const resource = { label, target, purpose, kind: item.kind };
    if (item.type === "directory") resource.type = "directory";
    if (item.kind === "normative") {
      if (!DIGEST.test(item.sha256)) throw new Error("normative resource needs a SHA-256 digest");
      resource.sha256 = item.sha256;
    }
    return resource;
  });
}

function resourceLink(target, type) {
  if (/^https?:\/\//.test(target)) return target;
  return path.posix.relative("tasks/topics", target).split("/").map(encodeURIComponent).join("/") + (type === "directory" ? "/" : "");
}

function resourceViews(workspace, topic) {
  return (topic.resources || []).map((item) => ({ ...item, href: /^https?:\/\//.test(item.target) ? item.target : pathToFileURL(safePath(workspace, item.target)).href + (item.type === "directory" ? "/" : "") }));
}

function renderResources(resources) {
  if (resources === undefined) return "";
  const rows = resources.map((item) => `| [${item.label}](<${resourceLink(item.target, item.type)}>) | ${item.kind} | ${item.purpose} | ${item.sha256 || "-"} |`);
  return `\n## Resources\n\n| Resource | Kind | Purpose | SHA-256 |\n| --- | --- | --- | --- |\n${rows.length ? `${rows.join("\n")}\n` : ""}`;
}

function parseResources(text) {
  const sections = core().sectionsOf(text, "Resources");
  if (!sections.length) return undefined;
  const lines = body(text, "Resources").split("\n");
  if (lines.shift() !== "| Resource | Kind | Purpose | SHA-256 |" || lines.shift() !== "| --- | --- | --- | --- |") throw new Error("invalid Resources table");
  return validateResources(lines.map((entry) => {
    const match = entry.match(/^\| \[([^\]]+)\]\(<([^>]+)>\) \| (normative|reference) \| (.+) \| (-|[a-f0-9]{64}) \|$/);
    if (!match) throw new Error("invalid Resources row");
    const [, label, link, kind, purpose, digest] = match;
    const target = /^https?:\/\//.test(link) ? link : path.posix.normalize(`tasks/topics/${decodeURIComponent(link)}`).replace(/\/$/, "");
    return { label, target, purpose, kind, ...(!/^https?:\/\//.test(link) && link.endsWith("/") ? { type: "directory" } : {}), ...(digest === "-" ? {} : { sha256: digest }) };
  }), { allowTaskReferences: true });
}

function normative(spec, resources = []) {
  const selected = resources.filter((item) => item.kind === "normative");
  const base = `## Scope\n\n${spec.scope}\n\n## Spec Context\n\n${spec.spec}\n\n## Decisions\n\n${spec.decisions}\n\n## Dependencies\n\n${spec.dependencies.map((dep) => `- ${JSON.stringify({ path: dep.path, sha256: dep.sha256 })}`).join("\n")}\n`;
  return selected.length ? `${base}\n## Normative Resources\n\n${selected.map((item) => `- ${JSON.stringify(item)}`).join("\n")}\n` : base;
}

function checkDependencies(workspace, spec, resources = []) {
  const legacyPaths = new Set(spec.dependencies.map((dep) => safePath(workspace, dep.path)));
  if (resources.some((item) => item.kind === "normative" && legacyPaths.has(safePath(workspace, item.target)))) throw new Error("a normative source must not be duplicated in Dependencies and Resources; move the declaration explicitly");
  const dependencies = [...spec.dependencies, ...resources.filter((item) => item.kind === "normative").map((item) => ({ path: item.target, sha256: item.sha256 }))];
  for (const dep of dependencies) {
    if (hash(fs.readFileSync(safePath(workspace, dep.path))) !== dep.sha256) throw new Error(`normative dependency changed: ${dep.path}`);
  }
}

const isMember = (entry) => entry.relation !== "history";
const escapeCell = (value) => value.replace(/[&|\[\]<>\\*_`]/g, (character) => `&#${character.charCodeAt(0)};`);
const unescapeCell = (value) => value.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

function taskLink(owner, source, id) {
  return root(owner) === root(source) ? resourceLink(`tasks/tasks/${id}.md`) : pathToFileURL(safePath(source, `tasks/tasks/${id}.md`)).href;
}

function taskEntry(owner, source, task, reference, purpose, table, relation = "member") {
  const entry = { ...reference, purpose: line(purpose, "purpose") };
  return table ? { ...entry, relation, title: task.title, link: taskLink(owner, source, task.id) } : entry;
}

function renderTasks(topic) {
  if (topic.tasksFormat !== "table") return topic.tasks.map((entry) => `- ${JSON.stringify(entry)}`).join("\n");
  return ["| Task | Relation | Reference | Purpose | Repository |", "| --- | --- | --- | --- | --- |", ...topic.tasks.map((entry) => `| [${escapeCell(entry.title)}](<${entry.link}>) | ${entry.relation} | ${entry.reference} | ${escapeCell(entry.purpose)} | ${entry.repository} |`)].join("\n");
}

function parseTasks(text) {
  const content = body(text, "Tasks");
  if (!content.startsWith("|")) return { tasksFormat: "legacy", tasks: jsonLines(content, "task") };
  const lines = content.split("\n");
  if (lines.shift() !== "| Task | Relation | Reference | Purpose | Repository |" || lines.shift() !== "| --- | --- | --- | --- | --- |") throw new Error("invalid Tasks table");
  const tasks = lines.map((row) => {
    const match = row.match(/^\| \[([^\]]+)\]\(<([^>]+)>\) \| (member|history) \| ([^|]+) \| (.+) \| ([^|]+) \|$/);
    if (!match) throw new Error("invalid Tasks row");
    const [, title, link, relation, reference, purpose, repository] = match;
    const ref = parseRef(reference);
    if (ref.project === "self") {
      if (link !== resourceLink(`tasks/tasks/${ref.id}.md`)) throw new Error("local task link does not match its reference");
    } else {
      const url = new URL(link);
      if (url.protocol !== "file:" || url.hostname || url.search || url.hash || !decodeURIComponent(url.pathname).endsWith(`/tasks/tasks/${ref.id}.md`) || url.href !== link) throw new Error("invalid cross-project task file link");
    }
    return { reference, repository, purpose: unescapeCell(purpose), relation, title: unescapeCell(title), link };
  });
  return { tasksFormat: "table", tasks };
}

function tableTopic(workspace, topic) {
  const tasks = topic.tasks.map((entry) => {
    const location = resolve(workspace, entry.reference, entry.repository);
    const task = core().readTask(location.workspace, location.id);
    return taskEntry(workspace, location.workspace, task, { reference: entry.reference, repository: entry.repository }, entry.purpose, true, entry.relation || "member");
  });
  return { ...topic, tasksFormat: "table", tasks };
}

function render(topic) {
  return `# ${topic.title}\n\n- Schema: topic/v1\n- Id: ${topic.id}\n- State: ${topic.state}\n- Revision: ${topic.revision}\n\n${normative(topic.spec)}${renderResources(topic.resources)}\n## Tasks\n\n${renderTasks(topic)}\n`;
}

function parseTopic(id, text) {
  const title = text.match(/^# (.+)\n/)?.[1];
  if (!title) throw new Error("topic title missing");
  const split = text.indexOf("\n## ");
  const meta = fields(text.slice(text.indexOf("\n") + 1, split), ["Schema", "Id", "State", "Revision"]);
  if (meta.Schema !== "topic/v1" || meta.Id !== id || !STATES.has(meta.State) || !DIGEST.test(meta.Revision)) throw new Error("invalid topic metadata");
  const spec = validateSpec({ scope: body(text, "Scope"), spec: body(text, "Spec Context"), decisions: body(text, "Decisions"), dependencies: jsonLines(body(text, "Dependencies"), "dependency") });
  const resources = parseResources(text);
  if (hash(normative(spec, resources)) !== meta.Revision) throw new Error("topic specification changed outside update-spec/update-resources; use the last valid revision and an explicit update");
  const { tasks, tasksFormat } = parseTasks(text);
  const seen = new Set();
  for (const entry of tasks) {
    const keys = tasksFormat === "table" ? "link,purpose,reference,relation,repository,title" : "purpose,reference,repository";
    if (Object.keys(entry).sort().join(",") !== keys || seen.has(entry.reference)) throw new Error("invalid or duplicate topic task reference");
    parseRef(entry.reference);
    line(entry.purpose, "purpose");
    if (tasksFormat === "table") line(entry.title, "task title");
    if (entry.repository !== "local" && !DIGEST.test(entry.repository)) throw new Error("invalid repository identity");
    seen.add(entry.reference);
  }
  const topic = { id, title, state: meta.State, revision: meta.Revision, spec, resources, tasks, tasksFormat, text, version: hash(text) };
  if (render(topic) !== text) throw new Error("noncanonical Topic structure; use Topic commands rather than editing fields or sections");
  return topic;
}

function readTopic(workspace, id) {
  const file = topicPath(workspace, id);
  const topic = parseTopic(id, fs.readFileSync(file, "utf8"));
  const snapshot = fs.readFileSync(revisionPath(workspace, id, topic.revision), "utf8");
  if (snapshot !== normative(topic.spec, topic.resources)) throw new Error("topic snapshot missing or corrupt");
  return { ...topic, file };
}

function topicIndex(workspace, topic) {
  const file = safePath(workspace, "tasks/topics.md");
  const before = fileText(file);
  const lines = (before || "# Topic 索引\n").trimEnd().split("\n");
  const link = `(topics/${topic.id}.md)`;
  const matches = lines.map((entry, i) => entry.includes(link) ? i : -1).filter((i) => i !== -1);
  if (matches.length > 1) throw new Error("duplicate topic index entry");
  const title = topic.title.replace(/[\[\]]/g, "");
  const entry = `- [${title}]${link} — ${topic.state}`;
  if (matches.length) lines[matches[0]] = entry;
  else lines.splice(1, 0, "", entry);
  return { file, before, after: `${lines.join("\n")}\n` };
}

function saveTopic(workspace, topic, before) {
  const candidate = render(topic);
  parseTopic(topic.id, candidate);
  const revision = revisionPath(workspace, topic.id, topic.revision);
  const existing = fileText(revision);
  const content = normative(topic.spec, topic.resources);
  if (existing !== undefined && existing !== content) throw new Error("immutable topic revision conflict");
  if (topic.resources !== undefined) fs.mkdirSync(safePath(workspace, `tasks/topics/${topic.id}/resources`), { recursive: true });
  commit([
    { file: revision, before: existing, after: content },
    { file: topicPath(workspace, topic.id), before, after: candidate },
    topicIndex(workspace, topic),
  ]);
  return readTopic(workspace, topic.id);
}

function createTopic(workspace, id, title, input) {
  assertId(id);
  title = line(title, "title");
  if (/[\[\]|]/.test(title)) throw new Error("topic title cannot contain Markdown table/link delimiters");
  return withLocks([workspace], () => {
    if (fileText(topicPath(workspace, id)) !== undefined) throw new Error(`topic already exists: ${id}`);
    const spec = validateSpec(input);
    checkDependencies(workspace, spec);
    return saveTopic(workspace, { id, title, state: "Active", revision: hash(normative(spec)), spec, resources: [], tasks: [], tasksFormat: "table" }, undefined);
  });
}

function updateSpec(workspace, id, expected, input) {
  return withLocks([workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== expected) throw new Error("topic changed; reread before update-spec");
    if (topic.state === "Archived") throw new Error("restore Archived topic before changing its specification");
    const spec = validateSpec(input);
    checkDependencies(workspace, spec, topic.resources);
    return saveTopic(workspace, { ...topic, spec, revision: hash(normative(spec, topic.resources)) }, topic.text);
  });
}

function updateResources(workspace, id, expected, input) {
  return withLocks([workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== expected) throw new Error("topic changed; reread before update-resources");
    if (topic.state === "Archived") throw new Error("restore Archived topic before changing resources");
    const resources = validateResources(input);
    for (const item of resources) {
      if (item.kind === "normative" && item.target === `tasks/topics/${id}.md`) throw new Error("a Topic cannot pin its own mutable document as a normative resource");
      if (!/^https?:\/\//.test(item.target)) {
        const stat = fs.statSync(safePath(workspace, item.target));
        if (stat.isDirectory()) {
          if (item.kind !== "reference") throw new Error("normative directories are not supported; pin the relevant files individually");
          item.type = "directory";
        } else if (!stat.isFile() || item.type === "directory") throw new Error(`resource type does not match a regular file/directory: ${item.target}`);
      }
    }
    checkDependencies(workspace, topic.spec, resources);
    return saveTopic(workspace, { ...topic, resources, revision: hash(normative(topic.spec, resources)) }, topic.text);
  });
}

function formatTopic(workspace, id, expected) {
  return withLocks([workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== expected) throw new Error("topic changed; reread before format");
    return saveTopic(workspace, tableTopic(workspace, topic), topic.text);
  });
}

function referenceTask(workspace, id, reference, expected, purpose, remove = false) {
  return withLocks([workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== expected) throw new Error("topic changed; reread before task reference update");
    if (topic.state === "Archived") throw new Error("restore Archived topic before changing task references");
    if (remove) {
      parseRef(reference);
      const existing = topic.tasks.find((entry) => entry.reference === reference);
      if (!existing) throw new Error("historical reference not found; use the exact stored reference");
      if (isMember(existing)) throw new Error("formal members require detach, not unreference-task");
      return saveTopic(workspace, { ...topic, tasks: topic.tasks.filter((entry) => entry !== existing) }, topic.text);
    }
    const location = resolve(workspace, reference);
    const canonical = refFor(workspace, location.workspace, location.id);
    const existing = topic.tasks.find((entry) => entry.reference === canonical.reference);
    if (existing && isMember(existing)) throw new Error("formal members require attach/detach; history commands cannot change membership");
    if (existing && existing.repository !== canonical.repository) throw new Error("historical task repository identity changed; resolve the mapping first");
    const prepared = topic.tasksFormat === "table" ? topic : tableTopic(workspace, topic);
    const tasks = prepared.tasks.filter((entry) => entry.reference !== canonical.reference);
    const task = core().readTask(location.workspace, location.id);
    tasks.push(taskEntry(workspace, location.workspace, task, canonical, purpose, true, "history"));
    return saveTopic(workspace, { ...prepared, tasks }, topic.text);
  });
}

function taskTopic(text) {
  const raw = body(text, "Topic", false);
  if (!raw && core().sectionsOf(text, "Topic").length === 0) return undefined;
  const data = fields(raw, ["Schema", "Reference", "Repository", "Revision", "Applies", "Mode"]);
  if (data.Schema !== "task-topic/v1" || !DIGEST.test(data.Revision) || !["implementation", "maintenance"].includes(data.Mode)) throw new Error("invalid task Topic schema, revision, or mode");
  parseRef(data.Reference);
  if (data.Repository !== "local" && !DIGEST.test(data.Repository)) throw new Error("invalid task Topic repository identity");
  return { reference: data.Reference, repository: data.Repository, revision: data.Revision, applies: data.Applies, mode: data.Mode };
}

function bindingLines(binding) {
  return ["- Schema: task-topic/v1", `- Reference: ${binding.reference}`, `- Repository: ${binding.repository}`, `- Revision: ${binding.revision}`, `- Applies: ${binding.applies}`, `- Mode: ${binding.mode}`];
}

function transactionPath(workspace, id) {
  assertId(id);
  return safePath(workspace, `tasks/topic-transactions/${id}.json`);
}

function pendingTransaction(workspace, id) {
  const file = transactionPath(workspace, id);
  const text = fileText(file);
  if (text === undefined) return undefined;
  const value = JSON.parse(text);
  if (!value || Object.keys(value).sort().join(",") !== "after,before,schema,task,topics" || value.schema !== "topic-association-pending/v1" || value.task !== id || !Array.isArray(value.topics) || value.topics.length < 1 || value.topics.length > 2) throw new Error(`invalid pending association record: ${file}`);
  for (const reference of [...value.topics, value.before, value.after].filter(Boolean)) {
    if (Object.keys(reference).sort().join(",") !== "reference,repository") throw new Error(`invalid pending reference: ${file}`);
    parseRef(reference.reference);
    if (reference.repository !== "local" && !DIGEST.test(reference.repository)) throw new Error(`invalid pending repository: ${file}`);
  }
  const identities = new Set([value.before, value.after].filter(Boolean).map((entry) => `${entry.reference}|${entry.repository}`));
  const declared = new Set(value.topics.map((entry) => `${entry.reference}|${entry.repository}`));
  if (declared.size !== value.topics.length || identities.size !== declared.size || [...identities].some((identity) => !declared.has(identity)) || (!value.before && !value.after)) throw new Error(`inconsistent pending association record: ${file}`);
  return value;
}

function finishPending(workspace, task) {
  const pending = pendingTransaction(workspace, task.id);
  if (!pending) return;
  const binding = taskTopic(task.text);
  const identity = (value) => value ? `${value.reference}|${value.repository}` : null;
  if (![identity(pending.before), identity(pending.after)].includes(identity(binding))) throw new Error("task binding no longer matches the pending transaction; explicit recovery is required");
  const current = binding && resolve(workspace, binding.reference, binding.repository);
  for (const reference of pending.topics) {
    const target = resolve(workspace, reference.reference, reference.repository);
    const topic = readTopic(target.workspace, target.id);
    const reverse = refFor(target.workspace, workspace, task.id);
    const entries = topic.tasks.filter((entry) => isMember(entry) && entry.reference === reverse.reference);
    const belongs = current?.workspace === target.workspace && current.id === target.id;
    if (belongs ? entries.length !== 1 || entries[0].repository !== reverse.repository : entries.length !== 0) return;
  }
  core().checkTaskIndex(workspace, task.id);
  fs.unlinkSync(transactionPath(workspace, task.id));
}

function fresh(workspace, task) {
  if (pendingTransaction(workspace, task.id)) throw new Error(`incomplete Topic association: ${transactionPath(workspace, task.id)}; repair every exact old/new backlink before terminal gates`);
  const binding = taskTopic(task.text);
  if (!binding) return { applicable: false };
  const target = resolve(workspace, binding.reference, binding.repository);
  const topic = readTopic(target.workspace, target.id);
  const reverse = refFor(target.workspace, workspace, task.id);
  if (!topic.tasks.some((entry) => isMember(entry) && entry.reference === reverse.reference && entry.repository === reverse.repository)) throw new Error("incomplete Topic association; repair the exact task reference");
  const snapshot = fs.readFileSync(revisionPath(target.workspace, target.id, binding.revision), "utf8");
  if (hash(snapshot) !== binding.revision) throw new Error("adopted topic snapshot corrupt");
  if (binding.revision !== topic.revision) throw new Error("Topic specification changed; analyze impact, align if needed, and explicitly adopt the current revision");
  if (binding.mode === "implementation" && topic.state !== "Active") throw new Error("implementation requires an Active Topic; status does not replace authorization");
  checkDependencies(target.workspace, topic.spec, topic.resources);
  return { applicable: true, topic: binding.reference, revision: binding.revision, state: topic.state };
}

function freshness(workspace, task) {
  try { return { current: true, ...fresh(workspace, task) }; } catch (error) { return { current: false, error: error.message }; }
}

function writableTask(workspace, id, expected) {
  safePath(workspace, `tasks/tasks/${id}.md`);
  const task = core().readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen Completed task before changing Topic association");
  if (hash(task.text) !== expected) throw new Error("task changed; reread before changing association");
  return task;
}

function changedTask(task, binding) {
  let text = core().replaceSection(task.text, "Topic", binding ? bindingLines(binding) : undefined);
  text = core().replaceSection(text, "Topic Adoption", undefined);
  text = core().invalidateReviewGate(text, "Topic association or adopted revision changed; refresh self-check and review");
  if (task.status.state === "in_review") text = core().replaceStatus(text, "in_progress");
  return core().renderMetadata(text);
}

function association(workspace, id, reference, options = {}) {
  assertId(id);
  const target = reference ? resolve(workspace, reference) : undefined;
  const initial = core().readTask(workspace, id);
  const old = taskTopic(initial.text);
  const previous = old ? resolve(workspace, old.reference, old.repository) : undefined;
  const workspaces = [workspace, target?.workspace, previous?.workspace].filter(Boolean);
  if (workspaces.some((entry) => root(entry) !== root(workspace)) && options.allowCross !== true) throw new Error("cross-workspace mutation requires --allow-cross-workspace after explicit authorization");
  return withLocks(workspaces, () => {
    const task = writableTask(workspace, id, options.expectedTask);
    if (pendingTransaction(workspace, id)) throw new Error("repair the pending Topic association before another binding change");
    const topics = new Map();
    for (const location of [previous, target].filter(Boolean)) {
      const key = topicPath(location.workspace, location.id);
      if (!topics.has(key)) topics.set(key, { workspace: location.workspace, topic: readTopic(location.workspace, location.id) });
    }
    let binding;
    if (target) {
      const topic = topics.get(topicPath(target.workspace, target.id)).topic;
      if (topic.version !== options.expectedTopic) throw new Error("topic changed; reread before association");
      if (previous?.workspace === target.workspace && previous.id === target.id && old.revision !== topic.revision) throw new Error("use adopt with impact evidence before reattaching a stale Topic");
      if (topic.state === "Archived") throw new Error("restore Archived topic before adding tasks");
      if (!["maintenance", "implementation"].includes(options.mode)) throw new Error("association requires explicit implementation or maintenance mode");
      if (options.mode === "implementation" && topic.state !== "Active") throw new Error("implementation requires Active topic");
      checkDependencies(target.workspace, topic.spec, topic.resources);
      binding = { ...refFor(workspace, target.workspace, target.id), revision: topic.revision, applies: line(options.applies, "applies"), mode: options.mode };
    }
    const text = changedTask(task, binding);
    const changes = [{ file: task.file, before: task.text, after: text }];
    // A state transition out of review must also update the owning task index.
    const parsed = core().parseTask(task.id, text, task.file);
    const index = core().indexPath(workspace);
    changes.push({ file: index, before: fileText(index), after: core().updatedIndex(workspace, parsed) });
    for (const { workspace: owner, topic } of topics.values()) {
      const reverse = refFor(owner, workspace, id);
      const belongs = target && topic.file === topicPath(target.workspace, target.id);
      const tasks = topic.tasks.filter((entry) => entry.reference !== reverse.reference || (!belongs && !isMember(entry)));
      if (belongs) tasks.push(taskEntry(owner, workspace, task, reverse, options.purpose, topic.tasksFormat === "table"));
      changes.push({ file: topic.file, before: topic.text, after: render({ ...topic, tasks }) });
    }
    if (topics.size === 0) return task;
    const identity = (value) => value ? { reference: value.reference, repository: value.repository } : null;
    const journal = { schema: "topic-association-pending/v1", task: id, before: identity(old), after: identity(binding), topics: [...topics.values()].map(({ workspace: owner, topic }) => refFor(workspace, owner, topic.id)) };
    const journalFile = transactionPath(workspace, id);
    fs.mkdirSync(path.dirname(journalFile), { recursive: true });
    fs.writeFileSync(journalFile, `${JSON.stringify(journal, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    commit(changes);
    // Leave the journal on any error, including a rollback failure or process interruption.
    const result = core().readTask(workspace, id);
    finishPending(workspace, result);
    if (pendingTransaction(workspace, id)) throw new Error("association written but backlinks remain incomplete; repair exact references");
    return result;
  });
}

function adopt(workspace, id, options) {
  line(options.evidence, "impact evidence");
  return withLocks([workspace], () => {
    const task = writableTask(workspace, id, options.expectedTask);
    const binding = taskTopic(task.text);
    if (!binding) throw new Error("task has no Topic");
    const target = resolve(workspace, binding.reference, binding.repository);
    const topic = readTopic(target.workspace, target.id);
    if (topic.version !== options.expectedTopic) throw new Error("topic changed; reread before adopt");
    // Adoption never silently repairs a broken backlink or drops an existing review obligation.
    const reverse = refFor(target.workspace, workspace, id);
    if (!topic.tasks.some((entry) => isMember(entry) && entry.reference === reverse.reference && entry.repository === reverse.repository)) throw new Error("repair incomplete Topic association first");
    const text = changedTask(task, { ...binding, revision: topic.revision });
    const updated = core().replaceSection(text, "Topic Adoption", [`- Evidence: ${options.evidence.trim()}`]);
    const proposed = core().parseTask(id, updated, task.file);
    fresh(workspace, proposed);
    const index = core().indexPath(workspace);
    commit([{ file: task.file, before: task.text, after: updated }, { file: index, before: fileText(index), after: core().updatedIndex(workspace, proposed) }]);
    return core().readTask(workspace, id);
  });
}

function members(workspace, topic) {
  return topic.tasks.map((entry) => {
    try {
      const location = resolve(workspace, entry.reference, entry.repository);
      safePath(location.workspace, `tasks/tasks/${location.id}.md`);
      const task = core().readTask(location.workspace, location.id);
      const href = pathToFileURL(safePath(location.workspace, `tasks/tasks/${location.id}.md`)).href;
      if (!isMember(entry)) return { ...entry, status: task.status.display, href, member: false };
      const binding = taskTopic(task.text);
      if (!binding) throw new Error("stale backlink: task has no Topic");
      const owner = resolve(location.workspace, binding.reference, binding.repository);
      if (owner.workspace !== root(workspace) || owner.id !== topic.id) throw new Error("stale backlink: task belongs elsewhere");
      return { ...entry, status: task.status.display, href, member: true, adoptedRevision: binding.revision, freshness: freshness(location.workspace, task) };
    } catch (error) { return { ...entry, status: "unknown", member: isMember(entry), error: error.message }; }
  });
}

function setState(workspace, id, state, expected, ownerTask) {
  if (!STATES.has(state) || state === "Draft") throw new Error("state must be Active or Archived");
  return withLocks([workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== expected) throw new Error("topic changed; reread before state transition");
    if (state === "Archived") {
      let ownerReference;
      if (ownerTask) {
        const location = resolve(workspace, ownerTask);
        const task = core().readTask(location.workspace, location.id);
        const binding = taskTopic(task.text);
        const target = binding && resolve(location.workspace, binding.reference, binding.repository);
        if (binding?.mode !== "maintenance" || target?.workspace !== root(workspace) || target.id !== id || task.status.state !== "in_progress") throw new Error("archive owner must be the In Progress maintenance task bound to this Topic");
        fresh(location.workspace, task);
        ownerReference = refFor(workspace, location.workspace, task.id).reference;
      }
      if (members(workspace, topic).some((entry) => entry.member && !["Completed", "Cancelled"].includes(entry.status) && entry.reference !== ownerReference)) throw new Error("resolve active or inaccessible members before archive");
    }
    if (state === "Active") checkDependencies(workspace, topic.spec, topic.resources);
    return saveTopic(workspace, { ...topic, state }, topic.text);
  });
}

function repair(workspace, id, taskReference, options) {
  const location = resolve(workspace, taskReference);
  if (root(workspace) !== location.workspace && options.allowCross !== true) throw new Error("cross-workspace repair requires explicit --allow-cross-workspace");
  return withLocks([workspace, location.workspace], () => {
    const topic = readTopic(workspace, id);
    if (topic.version !== options.expectedTopic) throw new Error("topic changed; reread before repair");
    const task = core().readTask(location.workspace, location.id);
    const binding = taskTopic(task.text);
    const owner = binding ? resolve(location.workspace, binding.reference, binding.repository) : undefined;
    const reverse = refFor(workspace, location.workspace, location.id);
    const belongs = owner?.workspace === root(workspace) && owner.id === id;
    const tasks = topic.tasks.filter((entry) => entry.reference !== reverse.reference || (!belongs && !isMember(entry)));
    if (belongs) tasks.push(taskEntry(workspace, location.workspace, task, reverse, options.purpose, topic.tasksFormat === "table"));
    const index = core().indexPath(location.workspace);
    commit([
      { file: topic.file, before: topic.text, after: render({ ...topic, tasks }) },
      { file: index, before: fileText(index), after: core().updatedIndex(location.workspace, task) },
    ]);
    finishPending(location.workspace, task);
    return { ...readTopic(workspace, id), pendingAssociation: pendingTransaction(location.workspace, task.id) || null };
  });
}

function listTopics(workspace) {
  const directory = safePath(workspace, "tasks/topics");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith(".md")).sort().map((file) => readTopic(workspace, file.slice(0, -3)));
}

function check(workspace, id) {
  const topic = readTopic(workspace, id);
  const projected = topicIndex(workspace, topic);
  if (projected.before !== projected.after) throw new Error("Topic index missing or inconsistent; rebuild the index");
  const rows = members(workspace, topic);
  const errors = rows.filter((entry) => entry.member && entry.error).map((entry) => `${entry.reference}: ${entry.error}`);
  if (errors.length) throw new Error(errors.join("; "));
  return { valid: true, revision: topic.revision, members: rows, referenceWarnings: rows.filter((entry) => !entry.member && entry.error).map((entry) => `${entry.reference}: ${entry.error}`) };
}

function rebuildIndex(workspace) {
  return withLocks([workspace], () => {
    const topics = listTopics(workspace);
    const file = safePath(workspace, "tasks/topics.md");
    const after = `# Topic 索引\n\n${topics.map((topic) => `- [${topic.title}](topics/${topic.id}.md) — ${topic.state}`).join("\n")}\n`;
    commit([{ file, before: fileText(file), after }]);
    return { count: topics.length };
  });
}

module.exports = { resolveReference: resolve, hash, safePath, withLocks, createTopic, readTopic, updateSpec, updateResources, resourceViews, formatTopic, referenceTask, taskTopic, pendingTransaction, fresh, freshness, association, adopt, members, setState, repair, listTopics, check, rebuildIndex };
