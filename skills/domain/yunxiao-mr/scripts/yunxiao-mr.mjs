#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";

const API_BASE = "https://one.in.zhihu.com";
const GIT_HOST = "git.in.zhihu.com";
const CHROME_USER_DATA_DIRS = [
	join(homedir(), "Library/Application Support/Google/Chrome"),
	join(homedir(), "Library/Application Support/Chromium"),
	join(homedir(), ".config/google-chrome"),
	join(homedir(), ".config/chromium"),
	join(homedir(), "AppData/Local/Google/Chrome/User Data"),
	join(homedir(), "AppData/Local/Chromium/User Data"),
];
const CHROME_PROFILE_PATTERN = /^(?:Default|Profile \d+)$/;
const CHROME_TOKEN_RECORD_KEYS = new Set([
	"_https://one.in.zhihu.com\u0000\u0001token",
	"_https://one.in.zhihu.com..token",
]);
const CHROME_BEARER_PATTERN = /\bBearer\s+[-A-Za-z0-9._~+/=]{8,4096}(?=$|[^-A-Za-z0-9._~+/=])/gi;
const CHROME_BARE_HEX_PATTERN = /\b[a-f0-9]{32}\b/gi;
const INPUT_LIMIT = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const GIT_TIMEOUT_MS = 10 * 60_000;
const REPO_KEY_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const REMOTE_NAME_PATTERN = /^(?!-)[A-Za-z0-9._-]+$/;
const DEFAULT_SHELL_REPOS = {
	ios: "zhihu/osee2unified",
	android: "AIS/AIS_Android",
};
const MANIFEST_FIELDS = [
	"title",
	"workItem",
	"description",
	"changeDescription",
	"testDescription",
	"platform",
	"shellBranch",
	"shellRepo",
	"squash",
	"removeSourceBranch",
	"qa",
	"mainModule",
	"modules",
];
const MODULE_FIELDS = [
	"name",
	"repoPath",
	"sourceBranch",
	"targetBranch",
	"targetRepo",
	"remote",
];

async function main(argv) {
	const { positionals, values } = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			help: { type: "boolean", short: "h" },
			input: { type: "string" },
			yes: { type: "boolean" },
		},
	});
	const command = positionals[0];

	if (values.help || !command) {
		printUsage();
		return;
	}
	if (command === "self-test") {
		await runSelfTest();
		return;
	}
	if (!values.input || !["plan", "create"].includes(command)) {
		throw new Error("用法: yunxiao-mr.mjs <plan|create> --input <manifest.json> [--yes]");
	}
	if (command === "create" && values.yes !== true) {
		throw new Error("create 会推送分支并创建远端 MR；展示 plan 并取得用户确认后才可传 --yes");
	}

	const manifest = loadManifest(values.input);
	const token = await readToken();
	const plan = await buildPlan(manifest, token);
	if (command === "plan") {
		printJson(toPublicPlan(plan));
		return;
	}

	const result = await executePlan(plan, token);
	printJson(result);
	if (result.status !== "completed") process.exitCode = 2;
}

function printUsage() {
	process.stdout.write([
		"用法:",
		"  yunxiao-mr.mjs plan --input <manifest.json>",
		"  yunxiao-mr.mjs create --input <manifest.json> --yes",
		"  yunxiao-mr.mjs self-test",
		"",
		"鉴权: 优先使用 YUNXIAO_TOKEN，缺失时只读获取本机 Chrome 云效授权。",
	].join("\n") + "\n");
}

function loadManifest(inputPath) {
	const text = inputPath === "-"
		? readFileSync(0, "utf8")
		: readBoundedFile(inputPath);
	if (Buffer.byteLength(text) > INPUT_LIMIT) {
		throw new Error(`manifest 超过 ${INPUT_LIMIT} bytes`);
	}
	let value;
	try {
		value = JSON.parse(text);
	} catch (error) {
		throw new Error(`manifest 不是合法 JSON: ${error.message}`);
	}
	return validateManifest(value);
}

function readBoundedFile(inputPath) {
	const stat = statSync(inputPath);
	if (!stat.isFile()) throw new Error(`manifest 不是普通文件: ${inputPath}`);
	if (stat.size > INPUT_LIMIT) throw new Error(`manifest 超过 ${INPUT_LIMIT} bytes`);
	return readFileSync(inputPath, "utf8");
}

function validateManifest(value) {
	assertObject(value, "manifest");
	assertKnownFields(value, MANIFEST_FIELDS, "manifest");
	const platform = requiredString(value.platform, "platform");
	if (!["ios", "android"].includes(platform)) {
		throw new Error("platform 仅支持 ios 或 android");
	}
	if (!Array.isArray(value.modules) || value.modules.length === 0) {
		throw new Error("modules 至少需要一个模块");
	}

	const names = new Set();
	const modules = value.modules.map((module, index) => {
		const label = `modules[${index}]`;
		assertObject(module, label);
		assertKnownFields(module, MODULE_FIELDS, label);
		const normalized = {
			name: requiredString(module.name, `${label}.name`),
			repoPath: requiredString(module.repoPath, `${label}.repoPath`),
			sourceBranch: requiredString(module.sourceBranch, `${label}.sourceBranch`),
			targetBranch: requiredString(module.targetBranch, `${label}.targetBranch`),
			targetRepo: validateRepoKey(requiredString(module.targetRepo, `${label}.targetRepo`), `${label}.targetRepo`),
			remote: optionalString(module.remote, `${label}.remote`),
		};
		if (!isAbsolute(normalized.repoPath)) throw new Error(`${label}.repoPath 必须是绝对路径`);
		if (normalized.sourceBranch === normalized.targetBranch) {
			throw new Error(`${label} 的 sourceBranch 不能等于 targetBranch`);
		}
		if (normalized.remote && !REMOTE_NAME_PATTERN.test(normalized.remote)) {
			throw new Error(`${label}.remote 不是安全的 Git remote 名称`);
		}
		if (names.has(normalized.name)) throw new Error(`模块名重复: ${normalized.name}`);
		names.add(normalized.name);
		return normalized;
	});

	const mainModule = optionalString(value.mainModule, "mainModule") || modules[0].name;
	if (!names.has(mainModule)) throw new Error(`mainModule 不在 modules 中: ${mainModule}`);
	return {
		title: requiredString(value.title, "title"),
		workItem: parseWorkItem(requiredString(value.workItem, "workItem")),
		description: optionalText(value.description, "description") || "",
		changeDescription: requiredText(value.changeDescription, "changeDescription"),
		testDescription: requiredText(value.testDescription, "testDescription"),
		platform,
		shellBranch: requiredString(value.shellBranch, "shellBranch"),
		shellRepo: validateRepoKey(
			optionalString(value.shellRepo, "shellRepo") || DEFAULT_SHELL_REPOS[platform],
			"shellRepo",
		),
		squash: optionalBoolean(value.squash, "squash", true),
		removeSourceBranch: optionalBoolean(value.removeSourceBranch, "removeSourceBranch", false),
		qa: optionalString(value.qa, "qa"),
		mainModule,
		modules,
	};
}

function parseWorkItem(input) {
	const trimmed = input.trim();
	if (/^\d+$/.test(trimmed)) {
		return workItem("task", Number.parseInt(trimmed, 10));
	}
	let url;
	try {
		url = new URL(trimmed);
	} catch {
		throw new Error(`无法解析云效 workItem: ${input}`);
	}
	if (!["http:", "https:"].includes(url.protocol) || url.hostname !== "one.in.zhihu.com") {
		throw new Error(`workItem 必须来自 one.in.zhihu.com: ${input}`);
	}
	const match = url.pathname.match(/\/(epic|task)\/detail\/(\d+)/);
	if (!match) throw new Error(`无法解析云效 workItem: ${input}`);
	return workItem(match[1], Number.parseInt(match[2], 10));
}

function workItem(kind, id) {
	if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`无效的云效实体 ID: ${id}`);
	return {
		kind,
		id,
		normalizedUrl: kind === "epic"
			? `${API_BASE}/epic/detail/${id}/tab/overview`
			: `${API_BASE}/task/detail/${id}`,
	};
}

function inspectModule(module) {
	const repoPath = realpathSync(module.repoPath);
	if (!statSync(repoPath).isDirectory()) throw new Error(`仓库路径不是目录: ${module.repoPath}`);
	const gitRoot = realpathSync(git(repoPath, ["rev-parse", "--show-toplevel"]));
	if (gitRoot !== repoPath) throw new Error(`repoPath 必须是独立 Git 根目录: ${module.repoPath}`);
	const currentBranch = git(repoPath, ["branch", "--show-current"]);
	if (!currentBranch) throw new Error(`仓库处于 detached HEAD: ${repoPath}`);
	if (currentBranch !== module.sourceBranch) {
		throw new Error(`${module.name} 当前分支为 ${currentBranch}，不是 ${module.sourceBranch}`);
	}
	if (git(repoPath, ["status", "--porcelain"])) {
		throw new Error(`${module.name} 存在未提交修改；Skill 不会自动 commit`);
	}
	for (const branch of [module.sourceBranch, module.targetBranch]) {
		git(repoPath, ["check-ref-format", "--branch", branch]);
	}

	const remotes = git(repoPath, ["remote"])
		.split("\n")
		.filter(Boolean)
		.filter((name) => REMOTE_NAME_PATTERN.test(name))
		.map((name) => {
			const url = git(repoPath, ["remote", "get-url", "--push", name]);
			return { name, repoKey: repoKeyFromGitUrl(url) };
		})
		.filter(({ repoKey }) => repoKey);
	const candidates = selectRemoteCandidates(remotes, module.targetRepo, module.remote);
	if (candidates.length === 0) {
		throw new Error(`${module.name} 没有可用于 ${module.targetRepo} 的 push remote`);
	}
	return { ...module, repoPath, remoteCandidates: candidates };
}

function selectRemoteCandidates(remotes, targetRepo, explicitRemote) {
	const targetName = basename(targetRepo);
	if (explicitRemote) {
		const selected = remotes.find(({ name }) => name === explicitRemote);
		if (!selected) throw new Error(`找不到 Git remote: ${explicitRemote}`);
		if (basename(selected.repoKey) !== targetName) {
			throw new Error(`remote ${explicitRemote} 的仓库名与目标仓库不一致`);
		}
		return [selected];
	}

	const ordered = [
		...remotes.filter(({ repoKey }) => repoKey === targetRepo),
		...remotes.filter(({ name, repoKey }) => name === "user" && basename(repoKey) === targetName),
		...remotes.filter(({ repoKey }) => basename(repoKey) === targetName),
	];
	const seen = new Set();
	return ordered.filter(({ name, repoKey }) => {
		const key = `${name}\n${repoKey}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function repoKeyFromGitUrl(rawUrl) {
	const input = rawUrl.trim().replace(/\/$/, "").replace(/\.git$/, "");
	const scp = input.match(/^(?:[^@]+@)?git\.in\.zhihu\.com:(.+)$/);
	if (scp) return REPO_KEY_PATTERN.test(scp[1]) ? scp[1] : null;
	try {
		const url = new URL(input);
		if (url.hostname !== GIT_HOST) return null;
		const repoKey = url.pathname.replace(/^\//, "");
		return REPO_KEY_PATTERN.test(repoKey) ? repoKey : null;
	} catch {
		return null;
	}
}

async function buildPlan(manifest, token) {
	const client = new OneClient(token);
	const warnings = [];
	const inspected = manifest.modules.map(inspectModule);
	const ordered = [
		inspected.find(({ name }) => name === manifest.mainModule),
		...inspected.filter(({ name }) => name !== manifest.mainModule),
	];
	const qa = manifest.qa ? await resolveQa(client, manifest.qa) : null;
	let shellRepo = null;
	try {
		shellRepo = await client.fetchRepository(manifest.shellRepo);
	} catch (error) {
		warnings.push(`获取壳工程 ${manifest.shellRepo} 失败，将不提交 parentApps: ${error.message}`);
	}
	const existingMrSummaries = await client.fetchWorkItemMrSummaries(manifest.workItem);

	const modules = [];
	for (const [index, module] of ordered.entries()) {
		const targetRepo = await client.fetchRepository(module.targetRepo);
		const sourceCandidates = [];
		for (const candidate of module.remoteCandidates) {
			try {
				sourceCandidates.push({
					...candidate,
					repository: await client.fetchRepository(candidate.repoKey),
				});
			} catch (error) {
				warnings.push(`忽略不可访问的源仓库候选 ${candidate.repoKey}: ${error.message}`);
			}
		}
		if (sourceCandidates.length === 0) {
			throw new Error(`${module.name} 没有可访问的云效源仓库候选`);
		}
		const existingMr = await findExistingMr(
			client,
			existingMrSummaries,
			module,
			sourceCandidates,
			targetRepo,
		);
		if (existingMr) {
			throw new Error(
				`${module.name} 已存在匹配 MR: ${API_BASE}/repos/${module.targetRepo}/merge_requests/${existingMr.mrIid}；首次创建流程不会推送或更新已有 MR`,
			);
		}

		let reviewRule;
		try {
			const current = await client.fetchReviewRule(targetRepo.repoId);
			if (current.users?.length) {
				reviewRule = {
					approvalsRequired: 1,
					groupIds: [],
					name: "yunxiao-mr-skill",
					userIds: current.users.map(({ id }) => id),
				};
			}
		} catch (error) {
			warnings.push(`获取 ${module.targetRepo} 审批规则失败，将使用仓库默认规则: ${error.message}`);
		}

		modules.push({
			...module,
			role: index === 0 ? "main" : "sub",
			targetRepository: targetRepo,
			sourceCandidates,
			reviewRule,
			appId: ordered.length >= 2
				? await client.resolveRepositoryAppId(module.targetRepo, targetRepo)
				: targetRepo.appId,
		});
	}
	return { manifest, qa, shellRepo, modules, warnings };
}

async function findExistingMr(client, summaries, module, sourceCandidates, targetRepository) {
	for (const summary of summaries) {
		if (summary.targetRepoId !== targetRepository.repoId) continue;
		const mr = await client.fetchMergeRequest(summary.targetRepoId, summary.mrIid);
		const sourceRepoId = Number(mr.sourceRepoId ?? mr.sourceRepo?.repoId);
		const targetRepoId = Number(mr.targetRepoId ?? mr.targetRepo?.repoId ?? mr.repoId);
		const sourceMatches = sourceCandidates.some(({ repository }) => repository.repoId === sourceRepoId);
		if (
			sourceMatches
			&& targetRepoId === targetRepository.repoId
			&& mr.sourceBranch === module.sourceBranch
			&& mr.targetBranch === module.targetBranch
		) return mr;
	}
	return null;
}

async function resolveQa(client, query) {
	const employees = await client.searchEmployee(query);
	if (employees.length === 0) throw new Error(`未找到 QA: ${query}`);
	const exact = employees.find(({ name }) => name.toLowerCase() === query.toLowerCase());
	const selected = exact || employees[0];
	return {
		query,
		id: String(selected.id),
		name: selected.name,
		candidateCount: employees.length,
	};
}

function toPublicPlan(plan) {
	return {
		status: "planned",
		apiBase: API_BASE,
		mainModule: plan.manifest.mainModule,
		workItem: plan.manifest.workItem,
		qa: plan.qa,
		modules: plan.modules.map((module) => ({
			name: module.name,
			role: module.role,
			repoPath: module.repoPath,
			sourceBranch: module.sourceBranch,
			targetBranch: module.targetBranch,
			targetRepo: module.targetRepo,
			targetRepoId: module.targetRepository.repoId,
			sourceCandidates: module.sourceCandidates.map(({ name, repoKey, repository }) => ({
				remote: name,
				repoKey,
				repoId: repository.repoId,
			})),
			request: {
				method: "POST",
				path: "/api/rd/repositories/{first-successful-push-repo-id}/mergeRequests",
				bodyPreview: buildMrMeta(plan, module, module.sourceCandidates[0].repository.repoId),
			},
		})),
		union: plan.modules.length >= 2 ? {
			method: "POST",
			path: "/api/v1/app_releases",
			mainModule: plan.manifest.mainModule,
			modules: plan.modules.map(({ name }) => name),
		} : null,
		warnings: plan.warnings,
	};
}

async function executePlan(plan, token) {
	const client = new OneClient(token);
	const result = {
		status: "completed",
		pushed: [],
		mergeRequests: [],
		failedModules: [],
		union: null,
		warnings: [...plan.warnings],
		retryPolicy: "写请求不会自动重放；失败后先在云效确认远端状态，再决定是否重试。",
	};
	const pushed = new Map();

	for (const module of plan.modules) {
		try {
			const candidate = pushBranch(module);
			pushed.set(module.name, candidate);
			result.pushed.push({
				module: module.name,
				branch: module.sourceBranch,
				remote: candidate.name,
				repoKey: candidate.repoKey,
			});
		} catch (error) {
			result.status = "failed";
			result.error = error.message;
			return result;
		}
	}

	for (const module of plan.modules) {
		const source = pushed.get(module.name);
		const sourceCandidate = module.sourceCandidates.find(({ name }) => name === source.name);
		try {
			const meta = buildMrMeta(plan, module, sourceCandidate.repository.repoId);
			const created = await client.createOrRecoverMR(meta, sourceCandidate.repository.repoId, module.targetRepo);
			const item = {
				module: module.name,
				role: module.role,
				existing: created.existing,
				repoId: created.mr.repoId,
				mrIid: created.mr.mrIid,
				gitUrl: `https://${GIT_HOST}/${module.targetRepo}/-/merge_requests/${created.mr.mrIid}`,
				oneUrl: `${API_BASE}/repos/${module.targetRepo}/merge_requests/${created.mr.mrIid}`,
				appId: module.appId,
			};
			result.mergeRequests.push(item);
			if (created.existing) {
				result.status = "partial";
				result.failedModules.push({
					module: module.name,
					error: "执行前检查后出现已有 MR；未同步检查状态，也不会创建联合 MR",
				});
				if (module.role === "main") return result;
				continue;
			}
			await syncChecks(client, item, plan, result.warnings);
		} catch (error) {
			result.failedModules.push({ module: module.name, error: error.message });
			result.status = "partial";
			if (module.role === "main") return result;
		}
	}

	if (result.status === "partial") return result;
	if (result.mergeRequests.length >= 2) {
		try {
			const body = buildUnionBody(plan, result.mergeRequests);
			const union = await client.createUnionMR(body);
			result.union = {
				id: union.id,
				url: `${API_BASE}/app/${union.mainItem.appId}/releases/${union.id}/detail`,
			};
		} catch (error) {
			result.status = "partial";
			result.union = { error: error.message };
		}
	}
	return result;
}

function pushBranch(module) {
	const errors = [];
	for (const candidate of module.sourceCandidates) {
		const pushed = runGit(module.repoPath, ["push", candidate.name, module.sourceBranch], true);
		if (pushed.ok) return candidate;
		errors.push(`${candidate.name}: ${pushed.error}`);
	}
	throw new Error(`${module.name} 分支推送失败: ${errors.join("; ")}`);
}

function buildMrMeta(plan, module, sourceRepoId) {
	const { manifest, qa, shellRepo } = plan;
	const main = module.role === "main";
	const checks = qa ? [{ type: "QA", userId: qa.id }] : [];
	const binding = manifest.workItem.kind === "task"
		? { issueIds: [String(manifest.workItem.id)], bindEntities: [] }
		: { issueIds: [], bindEntities: [{ entityId: manifest.workItem.id, entityType: 1 }] };
	const meta = {
		title: manifest.title,
		parentBranch: manifest.shellBranch,
		description: main ? manifest.description : "",
		testDescription: main ? manifest.testDescription : "见主 MR",
		changeDescription: main ? manifest.changeDescription : "见主 MR",
		sourceBranch: module.sourceBranch,
		sourceRepoId: String(sourceRepoId),
		targetBranch: module.targetBranch,
		targetRepoId: String(module.targetRepository.repoId),
		squash: manifest.squash ? 1 : 0,
		removeSourceBranch: manifest.removeSourceBranch ? 1 : 0,
		...binding,
		reviewRule: module.reviewRule,
		randReviewerMode: !module.reviewRule,
		parentApps: shellRepo ? [{ branch: manifest.shellBranch, repoId: shellRepo.repoId }] : [],
	};
	if (checks.length > 0) {
		meta.checkRequired = 1;
		meta.checks = checks;
	}
	return meta;
}

function buildUnionBody(plan, createdMrs) {
	const main = createdMrs.find(({ role }) => role === "main");
	if (!main) throw new Error("联合 MR 缺少主 MR");
	const unionItems = createdMrs
		.filter(({ role }) => role !== "main")
		.map(({ appId, mrIid }) => ({ appId, targetId: String(mrIid), type: 0 }));
	return {
		mrIid: main.mrIid,
		repoId: main.repoId,
		parentBranch: plan.manifest.shellBranch,
		title: plan.manifest.title,
		type: plan.manifest.platform === "android" ? 1 : 0,
		unionItems,
	};
}

async function syncChecks(client, mr, plan, warnings) {
	try {
		await client.updateSelfTest(mr.repoId, mr.mrIid);
		if (plan.qa) await client.submitCheck(mr.repoId, mr.mrIid, plan.manifest.testDescription);
	} catch (error) {
		warnings.push(`${mr.module} MR 已创建，但同步自测/提测状态失败: ${error.message}`);
	}
}

class OneClient {
	constructor(token) {
		this.token = token;
		this.engineeringApplications = null;
	}

	async request(method, apiPath, { body, params } = {}) {
		const url = new URL(apiPath, API_BASE);
		for (const [key, value] of Object.entries(params || {})) url.searchParams.set(key, String(value));
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		let response;
		try {
			response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: this.token,
				},
				body: body === undefined ? undefined : JSON.stringify(body),
				signal: controller.signal,
			});
		} catch (error) {
			throw new Error(`云效请求失败 ${method} ${url.pathname}: ${error.message}`);
		} finally {
			clearTimeout(timer);
		}
		const text = await response.text();
		let payload;
		try {
			payload = text ? JSON.parse(text) : {};
		} catch {
			throw new Error(`云效返回非 JSON 响应: HTTP ${response.status}`);
		}
		if (!response.ok) {
			if (response.status === 401) {
				throw new Error("云效 Token 无效或已过期；写请求不会自动重试");
			}
			throw new Error(apiMessage(payload, `HTTP ${response.status}`));
		}
		return payload;
	}

	async fetchRepository(repoKey) {
		const encoded = encodeURIComponent(repoKey.replace("/", "|"));
		return requireData(await this.request("GET", `/api/rd/repositories/${encoded}`), `获取仓库 ${repoKey}`);
	}

	async fetchReviewRule(repoId) {
		return requireData(await this.request("GET", `/api/rd/repositories/${repoId}/reviewRule`), "获取审批规则");
	}

	async searchEmployee(match) {
		const payload = await this.request("GET", "/api/mate/employee/search", {
			params: { empStatus: "在职", match },
		});
		return requireData(payload, `搜索员工 ${match}`);
	}

	async resolveRepositoryAppId(repoKey, repository) {
		if (Number.isSafeInteger(repository.appId) && repository.appId > 0) return repository.appId;
		if (!this.engineeringApplications) {
			const payload = await this.request("GET", "/api/rd/engineering", {
				params: { pageNum: 1, pageSize: 10000 },
			});
			this.engineeringApplications = payload.data?.list || [];
		}
		const ids = [...new Set(this.engineeringApplications
			.filter(({ repoId }) => repoId === repository.repoId)
			.map(({ id }) => id))];
		if (ids.length !== 1) throw new Error(`无法按仓库解析应用: ${repoKey}`);
		return ids[0];
	}

	async fetchWorkItemMrSummaries(workItem) {
		let summaries;
		if (workItem.kind === "task") {
			summaries = requireData(await this.request(
				"GET",
				`/api/v3/tasks/${workItem.id}/mergeRequests`,
			), "获取任务关联 MR");
		} else {
			summaries = [];
			const pageSize = 100;
			for (let pageNum = 1; ; pageNum += 1) {
				const page = requireData(await this.request(
					"GET",
					`/api/prj/v1/epics/${workItem.id}/merge-requests`,
					{ params: { pageNum, pageSize } },
				), "获取需求关联 MR");
				if (!Array.isArray(page.list)) throw new Error("获取需求关联 MR 失败: list 不是数组");
				summaries.push(...page.list);
				if (page.list.length < pageSize || summaries.length >= Number(page.total)) break;
			}
		}
		if (!Array.isArray(summaries)) throw new Error("获取 work item 关联 MR 失败: data 不是数组");
		return summaries.map((summary, index) => {
			const targetRepoId = Number(summary.targetRepoId ?? summary.repoId);
			const mrIid = Number(summary.mrIid);
			if (!Number.isSafeInteger(targetRepoId) || targetRepoId <= 0) {
				throw new Error(`work item MR[${index}] 缺少有效 targetRepoId`);
			}
			if (!Number.isSafeInteger(mrIid) || mrIid <= 0) {
				throw new Error(`work item MR[${index}] 缺少有效 mrIid`);
			}
			return { targetRepoId, mrIid };
		});
	}

	async fetchMergeRequest(repository, mrIid) {
		const encoded = encodeURIComponent(String(repository).replace("/", "|"));
		return requireData(await this.request(
			"GET",
			`/api/rd/repositories/${encoded}/mergeRequests/${mrIid}`,
			{ params: { withChecks: 1, withReviewSettings: true, withBindEntity: true } },
		), "获取已有 MR");
	}

	async createOrRecoverMR(meta, sourceRepoId, targetRepo) {
		const payload = await this.request("POST", `/api/rd/repositories/${sourceRepoId}/mergeRequests`, { body: meta });
		if (payload.data) return { mr: payload.data, existing: false };
		const existing = parseExistingMr(payload);
		if (!existing) throw new Error(apiMessage(payload, "创建 MR 失败"));
		if (existing.targetRepo !== targetRepo) throw new Error("服务端返回的已有 MR 目标仓库不匹配");
		return { mr: await this.fetchMergeRequest(existing.targetRepo, existing.mrIid), existing: true };
	}

	async updateSelfTest(repoId, mrIid) {
		return requireBusinessSuccess(await this.request(
			"PUT",
			`/api/rd/repositories/${repoId}/mergeRequests/${mrIid}/selfTest`,
			{ body: { status: true } },
		), "同步自测状态");
	}

	async submitCheck(repoId, mrIid, note) {
		return requireBusinessSuccess(await this.request(
			"POST",
			`/api/rd/repositories/${repoId}/mergeRequests/${mrIid}/submitCheck`,
			{ body: { note } },
		), "提交 QA 检查");
	}

	async createUnionMR(body) {
		return requireData(await this.request("POST", "/api/v1/app_releases", { body }), "创建联合 MR");
	}
}

function parseExistingMr(payload) {
	if (payload?.code !== 11107) return null;
	const message = payload.msg || payload.message || "";
	const match = message.match(/repos\/([^/]+\/[^/]+)\/merge_requests\/(\d+)/);
	return match ? { targetRepo: match[1], mrIid: Number.parseInt(match[2], 10) } : null;
}

function requireBusinessSuccess(payload, action) {
	if (payload?.code === undefined || payload.code === 0) return payload;
	throw new Error(`${action}失败: ${apiMessage(payload, `业务码 ${payload.code}`)}`);
}

function requireData(payload, action) {
	if (payload?.data !== undefined && payload.data !== null) return payload.data;
	throw new Error(`${action}失败: ${apiMessage(payload, "响应数据为空")}`);
}

function apiMessage(payload, fallback) {
	return payload?.msg || payload?.message || fallback;
}

async function readToken(userDataDirs = CHROME_USER_DATA_DIRS) {
	const provided = process.env.YUNXIAO_TOKEN;
	if (provided?.trim()) return normalizeBearerToken(provided, "YUNXIAO_TOKEN");

	const candidates = await readChromeTokenCandidates(userDataDirs);
	if (candidates.length === 0) {
		throw new Error("未设置 YUNXIAO_TOKEN，且未在本机 Chrome Local Storage 中找到 one.in.zhihu.com Token");
	}
	for (const candidate of candidates) {
		try {
			await new OneClient(candidate).searchEmployee("yunxiao-mr-auth-check");
			return candidate;
		} catch {
			// Try the next read-only Chrome candidate.
		}
	}
	throw new Error("Chrome Local Storage 中的云效 Token 均无效；请重新登录 one.in.zhihu.com 或设置 YUNXIAO_TOKEN");
}

function normalizeBearerToken(value, label) {
	if (/[\0\r\n]/.test(value)) throw new Error(`${label} 不能包含 NUL 或换行`);
	const token = value.trim();
	if (!token) throw new Error(`${label} 不能为空`);
	return /^Bearer\s+/i.test(token)
		? `Bearer ${token.replace(/^Bearer\s+/i, "")}`
		: `Bearer ${token}`;
}

async function readChromeTokenCandidates(userDataDirs = CHROME_USER_DATA_DIRS) {
	const ClassicLevel = await loadClassicLevel();
	const tokens = [];
	const seen = new Set();
	for (const leveldbDir of findChromeLeveldbDirs(userDataDirs)) {
		const tempRoot = mkdtempSync(join(tmpdir(), "yunxiao-chrome-leveldb-"));
		const copy = join(tempRoot, "leveldb");
		const db = new ClassicLevel(copy, { valueEncoding: "buffer" });
		let opened = false;
		try {
			cpSync(leveldbDir, copy, { recursive: true });
			await db.open();
			opened = true;
			for await (const [recordKey, value] of db.iterator()) {
				if (!CHROME_TOKEN_RECORD_KEYS.has(recordKey)) continue;
				for (const token of extractChromeTokenValues(value)) {
					if (seen.has(token)) continue;
					seen.add(token);
					tokens.push(token);
				}
			}
		} catch {
			// A concurrently rotated or unreadable profile must not block other profiles.
		} finally {
			if (opened) await db.close().catch(() => undefined);
			rmSync(tempRoot, { recursive: true, force: true });
		}
	}
	return tokens;
}

function findChromeLeveldbDirs(userDataDirs) {
	const dirs = [];
	for (const userDataDir of userDataDirs) {
		let profiles;
		try {
			profiles = readdirSync(userDataDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory() && CHROME_PROFILE_PATTERN.test(entry.name))
				.map((entry) => entry.name);
			const preferred = readPreferredChromeProfiles(userDataDir);
			const rank = new Map(preferred.map((name, index) => [name, index]));
			profiles.sort((left, right) => {
				const leftRank = rank.get(left) ?? Number.MAX_SAFE_INTEGER;
				const rightRank = rank.get(right) ?? Number.MAX_SAFE_INTEGER;
				if (leftRank !== rightRank) return leftRank - rightRank;
				if (left === "Default") return -1;
				if (right === "Default") return 1;
				return left.localeCompare(right, undefined, { numeric: true });
			});
		} catch {
			continue;
		}
		for (const profile of profiles) {
			const leveldbDir = join(userDataDir, profile, "Local Storage", "leveldb");
			try {
				if (statSync(leveldbDir).isDirectory()) dirs.push(leveldbDir);
			} catch {
				// Ignore profiles without Local Storage.
			}
		}
	}
	return dirs;
}

function readPreferredChromeProfiles(userDataDir) {
	try {
		const state = JSON.parse(readFileSync(join(userDataDir, "Local State"), "utf8"));
		const lastUsed = typeof state.profile?.last_used === "string" ? [state.profile.last_used] : [];
		const active = Array.isArray(state.profile?.last_active_profiles)
			? state.profile.last_active_profiles.filter((name) => typeof name === "string")
			: [];
		return [...new Set([...lastUsed, ...active])];
	} catch {
		return [];
	}
}

function extractChromeTokenValues(value) {
	const tokens = new Set();
	for (const text of [value.toString("utf8"), value.toString("utf16le"), value.toString("latin1")]) {
		for (const [pattern, bare] of [[CHROME_BEARER_PATTERN, false], [CHROME_BARE_HEX_PATTERN, true]]) {
			pattern.lastIndex = 0;
			let match;
			while ((match = pattern.exec(text)) !== null) {
				if (bare && text.slice(Math.max(0, match.index - 7), match.index).toLowerCase() === "bearer ") continue;
				tokens.add(bare ? `Bearer ${match[0]}` : normalizeBearerToken(match[0], "Chrome Token"));
			}
		}
	}
	return [...tokens];
}

async function loadClassicLevel() {
	try {
		return (await import("classic-level")).ClassicLevel;
	} catch {
		throw new Error("缺少 classic-level；请在 Skill 仓库运行 npm install，或设置 YUNXIAO_TOKEN");
	}
}

function git(repoPath, args) {
	const result = runGit(repoPath, args, false);
	return result.output;
}

function runGit(repoPath, args, allowFailure) {
	const gitEnv = { ...process.env };
	delete gitEnv.YUNXIAO_TOKEN;
	const result = spawnSync("git", ["-C", repoPath, ...args], {
		encoding: "utf8",
		timeout: GIT_TIMEOUT_MS,
		env: {
			...gitEnv,
			GIT_TERMINAL_PROMPT: "0",
			GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND || "ssh -o BatchMode=yes",
		},
	});
	const error = result.error?.message || result.stderr?.trim() || `git exited ${result.status}`;
	if (result.status !== 0) {
		if (allowFailure) return { ok: false, error };
		throw new Error(`Git 命令失败 (${args.join(" ")}): ${error}`);
	}
	return { ok: true, output: result.stdout.trim() };
}

function assertObject(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${label} 必须是对象`);
	}
}

function assertKnownFields(value, allowed, label) {
	for (const key of Object.keys(value)) {
		if (!allowed.includes(key)) throw new Error(`${label}.${key} 是未知字段`);
	}
}

function requiredString(value, label) {
	if (typeof value !== "string" || !value.trim() || /[\0\r\n]/.test(value)) {
		throw new Error(`${label} 必须是非空单行字符串`);
	}
	return value.trim();
}

function optionalString(value, label) {
	if (value === undefined) return undefined;
	return requiredString(value, label);
}

function requiredText(value, label) {
	if (typeof value !== "string" || !value.trim() || value.includes("\0")) {
		throw new Error(`${label} 必须是非空文本`);
	}
	return value.trim();
}

function optionalText(value, label) {
	if (value === undefined) return undefined;
	return requiredText(value, label);
}

function optionalBoolean(value, label, fallback) {
	if (value === undefined) return fallback;
	if (typeof value !== "boolean") throw new Error(`${label} 必须是 boolean`);
	return value;
}

function validateRepoKey(value, label) {
	if (!REPO_KEY_PATTERN.test(value)) throw new Error(`${label} 必须是 namespace/repository`);
	return value;
}

async function runSelfTest() {
	const manifest = validateManifest({
		title: "测试 MR",
		workItem: "https://one.in.zhihu.com/new-one/task/detail/123",
		changeDescription: "变更",
		testDescription: "测试",
		platform: "ios",
		shellBranch: "dev",
		modules: [{
			name: "Feature",
			repoPath: "/tmp/Feature",
			sourceBranch: "feat/test",
			targetBranch: "dev",
			targetRepo: "Team/Feature",
		}],
	});
	assert.equal(manifest.workItem.kind, "task");
	assert.equal(manifest.squash, true);
	assert.equal(optionalBoolean(false, "squash", true), false);
	assert.equal(parseWorkItem("https://one.in.zhihu.com/epic/detail/456").kind, "epic");
	assert.throws(() => parseWorkItem("https://evil.example/task/detail/1"));
	assert.equal(repoKeyFromGitUrl("git@git.in.zhihu.com:Team/Feature.git"), "Team/Feature");
	assert.equal(repoKeyFromGitUrl("https://git.in.zhihu.com/Team/Feature.git"), "Team/Feature");
	assert.equal(repoKeyFromGitUrl("https://evil.example/Team/Feature.git"), null);
	const successPayload = { code: 0 };
	assert.equal(requireBusinessSuccess(successPayload, "同步"), successPayload);
	assert.deepEqual(requireBusinessSuccess({}, "同步"), {});
	assert.throws(() => requireBusinessSuccess({ code: 42001, msg: "检查同步失败" }, "同步"), /同步失败: 检查同步失败/);
	assert.deepEqual(
		selectRemoteCandidates([
			{ name: "origin", repoKey: "Team/Feature" },
			{ name: "user", repoKey: "me/Feature" },
		], "Team/Feature"),
		[
			{ name: "origin", repoKey: "Team/Feature" },
			{ name: "user", repoKey: "me/Feature" },
		],
	);

	const temp = mkdtempSync(join(tmpdir(), "yunxiao-mr-self-test-"));
	try {
		const chromeRoot = join(temp, "Chrome");
		const leveldbDir = join(chromeRoot, "Default", "Local Storage", "leveldb");
		const chromeToken = "Bearer 930babaa9d5a9d477050e7a6fc823f72";
		const preferredLeveldbDir = join(chromeRoot, "Profile 1", "Local Storage", "leveldb");
		mkdirSync(preferredLeveldbDir, { recursive: true });
		mkdirSync(join(chromeRoot, "Default", "Local Storage"), { recursive: true });
		writeFileSync(join(chromeRoot, "Local State"), JSON.stringify({ profile: { last_used: "Profile 1" } }));
		assert.equal(findChromeLeveldbDirs([chromeRoot])[0], preferredLeveldbDir);
		const ClassicLevel = await loadClassicLevel();
		const fixtureDb = new ClassicLevel(leveldbDir, { valueEncoding: "buffer" });
		await fixtureDb.open();
		try {
			await fixtureDb.put([...CHROME_TOKEN_RECORD_KEYS][0], Buffer.concat([Buffer.from([1]), Buffer.from(chromeToken)]));
		} finally {
			await fixtureDb.close();
		}
		assert.deepEqual(extractChromeTokenValues(Buffer.from(`\u0001${chromeToken}`)), [chromeToken]);
		assert.deepEqual(extractChromeTokenValues(Buffer.from("\u0001930babaa9d5a9d477050e7a6fc823f72")), [chromeToken]);
		assert.deepEqual(await readChromeTokenCandidates([chromeRoot]), [chromeToken]);

		const originalToken = process.env.YUNXIAO_TOKEN;
		const originalFetch = globalThis.fetch;
		const authCalls = [];
		try {
			process.env.YUNXIAO_TOKEN = "manual-token-1234567890";
			assert.equal(await readToken([chromeRoot]), "Bearer manual-token-1234567890");
			delete process.env.YUNXIAO_TOKEN;
			globalThis.fetch = async (url, options) => {
				authCalls.push({ url: String(url), options });
				return {
					ok: true,
					status: 200,
					text: async () => JSON.stringify({ code: 0, data: [] }),
				};
			};
			assert.equal(await readToken([chromeRoot]), chromeToken);
			assert.equal(authCalls.length, 1);
			assert.equal(authCalls[0].options.headers.Authorization, chromeToken);
		} finally {
			if (originalToken === undefined) delete process.env.YUNXIAO_TOKEN;
			else process.env.YUNXIAO_TOKEN = originalToken;
			globalThis.fetch = originalFetch;
		}

		const repo = join(temp, "Feature");
		mkdirSync(repo);
		git(repo, ["init", "--initial-branch=feat/test"]);
		git(repo, ["config", "user.email", "test@example.com"]);
		git(repo, ["config", "user.name", "Self Test"]);
		git(repo, ["config", "alias.auth-env-check", "!test -z \"$YUNXIAO_TOKEN\""]);
		const originalGitToken = process.env.YUNXIAO_TOKEN;
		try {
			process.env.YUNXIAO_TOKEN = "must-not-reach-git";
			assert.equal(git(repo, ["auth-env-check"]), "");
		} finally {
			if (originalGitToken === undefined) delete process.env.YUNXIAO_TOKEN;
			else process.env.YUNXIAO_TOKEN = originalGitToken;
		}
		writeFileSync(join(repo, "README.md"), "# Test\n");
		git(repo, ["add", "README.md"]);
		git(repo, ["commit", "-m", "initial"]);
		git(repo, ["remote", "add", "origin", "git@git.in.zhihu.com:Team/Feature.git"]);
		const inspected = inspectModule({
			name: "Feature",
			repoPath: repo,
			sourceBranch: "feat/test",
			targetBranch: "dev",
			targetRepo: "Team/Feature",
		});
		assert.equal(inspected.remoteCandidates[0].name, "origin");
	} finally {
		rmSync(temp, { recursive: true, force: true });
	}

	const plan = {
		manifest,
		qa: { id: "7" },
		shellRepo: { repoId: 9 },
		modules: [],
	};
	const module = {
		role: "main",
		sourceBranch: "feat/test",
		targetBranch: "dev",
		targetRepository: { repoId: 11 },
	};
	const meta = buildMrMeta(plan, module, 10);
	const existingMr = {
		mrIid: 4,
		sourceRepoId: 10,
		targetRepoId: 11,
		sourceBranch: "feat/test",
		targetBranch: "dev",
	};
	assert.equal(await findExistingMr(
		{ fetchMergeRequest: async () => existingMr },
		[{ targetRepoId: 11, mrIid: 4 }],
		module,
		[{ repository: { repoId: 10 } }],
		module.targetRepository,
	), existingMr);
	assert.equal(await findExistingMr(
		{ fetchMergeRequest: async () => ({ ...existingMr, sourceBranch: "other" }) },
		[{ targetRepoId: 11, mrIid: 4 }],
		module,
		[{ repository: { repoId: 10 } }],
		module.targetRepository,
	), null);
	assert.deepEqual(meta.issueIds, ["123"]);
	assert.equal(meta.sourceRepoId, "10");
	assert.equal(meta.targetRepoId, "11");
	assert.deepEqual(meta.checks, [{ type: "QA", userId: "7" }]);
	const union = buildUnionBody(plan, [
		{ role: "main", repoId: 11, mrIid: 1, appId: 101 },
		{ role: "sub", repoId: 12, mrIid: 2, appId: 102 },
	]);
	assert.equal(union.type, 0);
	assert.deepEqual(union.unionItems, [{ appId: 102, targetId: "2", type: 0 }]);

	const originalFetch = globalThis.fetch;
	const calls = [];
	globalThis.fetch = async (url, options) => {
		calls.push({ url: String(url), options });
		const requestUrl = String(url);
		const data = requestUrl.endsWith("/api/v3/tasks/123/mergeRequests")
			? [{ targetRepoId: 11, mrIid: 1 }]
			: requestUrl.endsWith("/api/v1/app_releases")
				? { id: 3, mainItem: { appId: 101 } }
				: { repoId: 11, mrIid: 1 };
		return {
			ok: true,
			status: 200,
			text: async () => JSON.stringify({ code: 0, msg: "ok", data }),
		};
	};
	try {
		const client = new OneClient("Bearer test-token");
		assert.deepEqual(await client.fetchWorkItemMrSummaries(manifest.workItem), [
			{ targetRepoId: 11, mrIid: 1 },
		]);
		const created = await client.createOrRecoverMR(meta, 10, "Team/Feature");
		assert.equal(created.mr.mrIid, 1);
		await client.createUnionMR(union);
		assert.equal(calls[0].url, `${API_BASE}/api/v3/tasks/123/mergeRequests`);
		assert.equal(calls[0].options.method, "GET");
		assert.equal(calls[1].url, `${API_BASE}/api/rd/repositories/10/mergeRequests`);
		assert.equal(calls[1].options.method, "POST");
		assert.equal(calls[1].options.headers.Authorization, "Bearer test-token");
		assert.equal(JSON.parse(calls[1].options.body).targetRepoId, "11");
		assert.equal(calls[2].url, `${API_BASE}/api/v1/app_releases`);
	} finally {
		globalThis.fetch = originalFetch;
	}
	printJson({ status: "passed", checks: 39 });
}

function printJson(value) {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printError(error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${JSON.stringify({ status: "failed", error: message }, null, 2)}\n`);
}

try {
	await main(process.argv.slice(2));
} catch (error) {
	printError(error);
	process.exitCode = 1;
}
