#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
	appendFileSync,
	chmodSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	realpathSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
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
const MQTT_BROKER_URL = "wss://mqtt-internal.in.zhihu.com/ws";
const MQTT_TOPIC_PREFIX = "zhihu/egon/prod/private/";
const DAEMON_LABEL = "com.csl-agent-kit.yunxiao-auto-approve";
const DAEMON_PORT = 4319;
const DAEMON_STATE_DIR = join(homedir(), "Library/Application Support/yunxiao");
const DAEMON_HISTORY_PATH = join(DAEMON_STATE_DIR, "approval-history.jsonl");
const DAEMON_STDOUT_PATH = join(DAEMON_STATE_DIR, "daemon.log");
const DAEMON_STDERR_PATH = join(DAEMON_STATE_DIR, "daemon.error.log");
const DAEMON_PLIST_PATH = join(homedir(), "Library/LaunchAgents", `${DAEMON_LABEL}.plist`);
const DAEMON_HISTORY_LIMIT = 500;
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
			repo: { type: "string" },
			from: { type: "string" },
			to: { type: "string" },
			"plan-id": { type: "string" },
			"dry-run": { type: "boolean" },
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
	if (command === "daemon") {
		await handleDaemonCommand(positionals[1], values);
		return;
	}
	if (["plan-approvals", "approve-all"].includes(command)) {
		const range = parseDateRange(values.from, values.to);
		let expectedPlanId;
		if (command === "approve-all") {
			if (values.yes !== true) throw new Error("approve-all 会批准多个远端 MR；展示 plan-approvals 并取得用户确认后才可传 --yes");
			expectedPlanId = requiredString(values["plan-id"], "--plan-id");
		}
		const token = await readToken();
		const plan = await buildApprovalPlan(range, token);
		if (command === "plan-approvals") {
			printJson(plan);
			return;
		}
		const result = await executeApprovalPlan(plan, expectedPlanId, token);
		printJson(result);
		if (result.status !== "completed") process.exitCode = 2;
		return;
	}
	if (command === "list-unmerged") {
		const range = parseDateRange(values.from, values.to);
		printJson(await listUnmergedMrs(range, await readToken()));
		return;
	}
	if (command === "list-qa") {
		const repoKey = validateRepoKey(requiredString(values.repo, "--repo"), "--repo");
		printJson(await listRepositoryQa(repoKey, await readToken()));
		return;
	}
	if (!values.input || !["plan", "create"].includes(command)) {
		throw new Error("未知命令或缺少参数；运行 --help 查看用法");
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
		"  yunxiao plan --input <manifest.json>",
		"  yunxiao create --input <manifest.json> --yes",
		"  yunxiao plan-approvals --from <YYYY-MM-DD> --to <YYYY-MM-DD>",
		"  yunxiao approve-all --from <YYYY-MM-DD> --to <YYYY-MM-DD> --plan-id <id> --yes",
		"  yunxiao list-unmerged --from <YYYY-MM-DD> --to <YYYY-MM-DD>",
		"  yunxiao list-qa --repo <namespace/repository>",
		"  yunxiao daemon install --dry-run",
		"  yunxiao daemon install --yes",
		"  yunxiao daemon <start --yes|stop|status|uninstall>",
		"  yunxiao self-test",
		"",
		"daemon install/start 会持续自动批准所有当前用户有资格审批的 MR，不会合并 MR。",
		"Dashboard: http://127.0.0.1:4319",
		"plan-approvals 只读列出日期闭区间内仍需当前用户批准的 MR。",
		"approve-all 仅执行匹配已确认 plan-id 的批量批准，不会合并 MR。",
		"list-unmerged 按 MR 创建日期闭区间列出当前登录用户的打开 MR。",
		"list-qa 列出指定仓库应用配置的 QA 负责人（零或一人）。",
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

function parseDateRange(fromValue, toValue) {
	const range = {
		from: parseDate(fromValue, "--from"),
		to: parseDate(toValue, "--to"),
	};
	if (range.from > range.to) throw new Error("--from 不能晚于 --to");
	return range;
}

function parseDate(value, label) {
	const date = requiredString(value, label);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${label} 必须是 YYYY-MM-DD`);
	const parsed = new Date(`${date}T00:00:00.000Z`);
	if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
		throw new Error(`${label} 不是有效日期`);
	}
	return date;
}

function extractMrCreationDate(mr) {
	const match = typeof mr.createTime === "string" && mr.createTime.match(/^(\d{4}-\d{2}-\d{2})(?:[ T]|$)/);
	if (!match) throw new Error(`MR !${mr.mrIid ?? "?"} 缺少有效 createTime`);
	return parseDate(match[1], "MR createTime");
}

function isMrCreatedInRange(mr, range) {
	const date = extractMrCreationDate(mr);
	return date >= range.from && date <= range.to;
}

function toPublicMergeRequest(mr) {
	const repo = mr.targetRepo?.pathWithNamespace || mr.pathWithNamespace || mr.targetRepoNameWithNamespace;
	const mrIid = Number(mr.mrIid);
	if (typeof repo !== "string" || !repo.trim()) throw new Error(`MR !${mr.mrIid ?? "?"} 缺少目标仓库`);
	if (!Number.isSafeInteger(mrIid) || mrIid <= 0) throw new Error(`MR 缺少有效 mrIid: ${mr.mrIid}`);
	return {
		title: typeof mr.title === "string" ? mr.title : "",
		repo,
		mrIid,
		status: mr.status?.text || "打开",
		createdAt: mr.createTime,
		url: `${API_BASE}/repos/${repo}/merge_requests/${mrIid}`,
	};
}

async function listUnmergedMrs(range, token) {
	const client = new OneClient(token);
	const currentUser = await client.fetchCurrentUser();
	const mergeRequests = (await client.fetchOpenMergeRequests(currentUser.id))
		.filter((mr) => isMrCreatedInRange(mr, range))
		.map(toPublicMergeRequest);
	return {
		status: "completed",
		readOnly: true,
		currentUser: {
			id: currentUser.id,
			name: currentUser.name,
			emailPrefix: currentUser.emailPrefix,
		},
		range: { field: "createTime", ...range, inclusive: true },
		total: mergeRequests.length,
		mergeRequests,
	};
}

function toPublicQaOwners(owner) {
	if (!owner) return [];
	assertObject(owner, "qaOwner");
	const id = Number(owner.id);
	if (!Number.isSafeInteger(id) || id <= 0) throw new Error("qaOwner.id 必须是正整数");
	return [{
		id,
		name: requiredString(owner.name, "qaOwner.name"),
		emailPrefix: typeof owner.emailPrefix === "string" ? owner.emailPrefix : null,
	}];
}

async function listRepositoryQa(repoKey, token) {
	const client = new OneClient(token);
	const repository = await client.fetchRepository(repoKey);
	const settings = await client.fetchRepositoryAppSettings(repository.repoId);
	const qaOwners = toPublicQaOwners(settings.qaOwner);
	return {
		status: "completed",
		readOnly: true,
		repository: {
			repoId: repository.repoId,
			appId: settings.appId ?? repository.appId ?? null,
			pathWithNamespace: repository.pathWithNamespace || repoKey,
		},
		qaRequired: Boolean(settings.mrForceCheckRequired),
		total: qaOwners.length,
		qaOwners,
	};
}

function isTimestampInRange(value, range, label) {
	const match = typeof value === "string" && value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T]|$)/);
	if (!match) throw new Error(`${label} 缺少有效时间`);
	const date = parseDate(match[1], label);
	return date >= range.from && date <= range.to;
}

function parseApprovalNotice(notice) {
	if (typeof notice?.url !== "string") return null;
	try {
		const url = new URL(notice.url);
		if (!["http:", "https:"].includes(url.protocol) || url.hostname !== "one.in.zhihu.com") return null;
		const match = decodeURIComponent(url.pathname).match(/^\/repos\/([^/]+\/[^/]+)\/merge_requests\/(\d+)\/?$/);
		if (!match) return null;
		return {
			repository: validateRepoKey(match[1], "通知仓库"),
			mrIid: Number.parseInt(match[2], 10),
		};
	} catch {
		return null;
	}
}

function approvedUserIds(mr) {
	const reviews = Array.isArray(mr.multiReview) && mr.multiReview.length > 0
		? mr.multiReview
		: [mr.review];
	return new Set(reviews
		.flatMap((review) => Array.isArray(review?.approvedBy) ? review.approvedBy : [])
		.map(({ id }) => Number(id))
		.filter((id) => Number.isSafeInteger(id) && id > 0));
}

function approvalProgress(mr) {
	if (Array.isArray(mr.multiReview) && mr.multiReview.length > 0) {
		return mr.multiReview.reduce((total, review) => {
			const required = Number(review.approvalsRequired) || 0;
			const approved = Array.isArray(review.approvedBy) ? review.approvedBy.length : 0;
			return {
				approvalsRequired: total.approvalsRequired + required,
				approvedCount: total.approvedCount + approved,
				approvalsLeft: total.approvalsLeft + Math.max(required - approved, 0),
			};
		}, { approvalsRequired: 0, approvedCount: 0, approvalsLeft: 0 });
	}
	const required = Number(mr.review?.approvalsRequired) || 0;
	const approved = Number(mr.review?.approvedCount ?? mr.review?.approvedBy?.length) || 0;
	const left = mr.review?.approvalsLeft == null
		? Math.max(required - approved, 0)
		: Math.max(Number(mr.review.approvalsLeft) || 0, 0);
	return { approvalsRequired: required, approvedCount: approved, approvalsLeft: left };
}

function approvalDecision(mr, userId) {
	const id = Number(userId);
	if (mr.status?.code !== 1) return { matches: false, reason: "not-open" };
	if (approvedUserIds(mr).has(id)) return { matches: false, reason: "already-approved" };
	if (approvalProgress(mr).approvalsLeft === 0) return { matches: false, reason: "approval-satisfied" };

	let eligible;
	if (Array.isArray(mr.multiReview) && mr.multiReview.length > 0) {
		const anyApprover = mr.multiReview.some(({ ruleType }) => ruleType === "any_approver");
		eligible = anyApprover
			? Number(mr.author?.id) !== id
			: mr.multiReview.some((review) => review.eligibleApprovers?.some(({ id: reviewerId }) => Number(reviewerId) === id));
	} else {
		const users = Array.isArray(mr.review?.users) ? mr.review.users : [];
		eligible = users.length > 0
			? users.some(({ id: reviewerId }) => Number(reviewerId) === id)
			: Number(mr.author?.id) !== id;
	}
	return eligible
		? { matches: true, reason: "pending-approval" }
		: { matches: false, reason: "not-eligible" };
}

function toApprovalRequest(mr, notice) {
	const repository = requiredString(
		mr.targetRepoNameWithNamespace || mr.targetRepo?.pathWithNamespace || mr.pathWithNamespace,
		"MR 目标仓库",
	);
	const repoId = Number(mr.repoId ?? mr.targetRepoId);
	const mrIid = Number(mr.mrIid);
	const notificationId = Number(notice.id);
	if (!Number.isSafeInteger(repoId) || repoId <= 0) throw new Error(`MR !${mrIid || "?"} 缺少有效 repoId`);
	if (!Number.isSafeInteger(mrIid) || mrIid <= 0) throw new Error("MR 缺少有效 mrIid");
	if (!Number.isSafeInteger(notificationId) || notificationId <= 0) throw new Error(`MR !${mrIid} 的通知缺少有效 id`);
	return {
		repository,
		repoId,
		mrIid,
		title: typeof mr.title === "string" ? mr.title : "",
		author: { id: mr.author?.id, name: mr.author?.name },
		sourceBranch: mr.sourceBranch,
		targetBranch: mr.targetBranch,
		sha: requiredString(mr.sha, `MR !${mrIid} sha`),
		progress: approvalProgress(mr),
		notification: {
			id: notificationId,
			title: typeof notice.title === "string" ? notice.title : "",
			createdAt: notice.createTime,
		},
		url: `${API_BASE}/repos/${repository}/merge_requests/${mrIid}`,
	};
}

function approvalPlanId(currentUserId, range, requests) {
	return createHash("sha256").update(JSON.stringify({
		currentUserId: Number(currentUserId),
		range,
		requests: requests.map(({ repository, repoId, mrIid, sha }) => ({ repository, repoId, mrIid, sha })),
	})).digest("hex");
}

async function buildApprovalPlan(range, token) {
	const client = new OneClient(token);
	const [currentUser, notices] = await Promise.all([
		client.fetchCurrentUser(),
		client.fetchApprovalNotices(),
	]);
	const recentNotices = notices.filter((notice) => isTimestampInRange(notice.createTime, range, "通知 createTime"));
	const targets = new Map();
	for (const notice of recentNotices) {
		const target = parseApprovalNotice(notice);
		if (!target) continue;
		const key = `${target.repository}!${target.mrIid}`;
		const existing = targets.get(key);
		if (!existing || notice.createTime > existing.notice.createTime) targets.set(key, { ...target, notice });
	}

	const approvalRequests = [];
	const excluded = [];
	for (const target of targets.values()) {
		const mr = await client.fetchMergeRequest(target.repository, target.mrIid);
		const request = toApprovalRequest(mr, target.notice);
		const decision = approvalDecision(mr, currentUser.id);
		if (decision.matches) approvalRequests.push(request);
		else excluded.push({ repository: request.repository, mrIid: request.mrIid, title: request.title, reason: decision.reason });
	}
	approvalRequests.sort((left, right) => left.repository.localeCompare(right.repository) || left.mrIid - right.mrIid);
	excluded.sort((left, right) => left.repository.localeCompare(right.repository) || left.mrIid - right.mrIid);
	return {
		status: "planned",
		readOnly: true,
		currentUser: { id: currentUser.id, name: currentUser.name, emailPrefix: currentUser.emailPrefix },
		range: { field: "notification.createTime", ...range, inclusive: true },
		scannedNotifications: notices.length,
		recentNotifications: recentNotices.length,
		linkedMergeRequests: targets.size,
		total: approvalRequests.length,
		planId: approvalPlanId(currentUser.id, range, approvalRequests),
		approvalRequests,
		excluded,
	};
}

async function executeApprovalPlan(plan, expectedPlanId, token) {
	if (plan.planId !== expectedPlanId) {
		throw new Error("待审批 MR 已变化；重新运行 plan-approvals、展示新计划并再次取得确认");
	}
	const client = new OneClient(token);
	const results = [];
	for (const request of plan.approvalRequests) {
		const item = {
			repository: request.repository,
			mrIid: request.mrIid,
			title: request.title,
			url: request.url,
		};
		let before;
		try {
			before = await client.fetchMergeRequest(request.repository, request.mrIid);
			if (before.sha !== request.sha) {
				results.push({ ...item, status: "skipped", reason: "sha-changed" });
				continue;
			}
			const decision = approvalDecision(before, plan.currentUser.id);
			if (!decision.matches) {
				results.push({ ...item, status: "skipped", reason: decision.reason });
				continue;
			}
		} catch (error) {
			results.push({ ...item, status: "failed", error: error.message });
			continue;
		}

		let writeError;
		try {
			await client.approveMergeRequest(request.repoId, request.mrIid);
		} catch (error) {
			writeError = error;
		}
		try {
			const after = await client.fetchMergeRequest(request.repository, request.mrIid);
			if (!approvedUserIds(after).has(Number(plan.currentUser.id))) {
				throw writeError || new Error("批准请求后远端状态未更新");
			}
			results.push({
				...item,
				status: "approved",
				progress: approvalProgress(after),
				recoveredAfterWriteError: Boolean(writeError),
				changedAfterApproval: after.sha !== request.sha,
			});
		} catch (error) {
			results.push({ ...item, status: "failed", error: error.message });
		}
	}
	const summary = {
		planned: plan.approvalRequests.length,
		approved: results.filter(({ status }) => status === "approved").length,
		skipped: results.filter(({ status }) => status === "skipped").length,
		failed: results.filter(({ status }) => status === "failed").length,
	};
	const changedAfterApproval = results.filter((result) => result.changedAfterApproval).length;
	return {
		status: summary.skipped > 0 || summary.failed > 0 || changedAfterApproval > 0 ? "partial" : "completed",
		planId: plan.planId,
		currentUser: plan.currentUser,
		range: plan.range,
		summary: { ...summary, changedAfterApproval },
		results,
	};
}

async function handleDaemonCommand(subcommand, values) {
	assertMacosDaemon();
	if (subcommand === "install") {
		await installDaemon({ dryRun: values["dry-run"] === true, confirmed: values.yes === true });
		return;
	}
	if (subcommand === "start") {
		if (values.yes !== true) throw new Error("daemon start 会恢复无人值守自动审批；明确确认后才可传 --yes");
		await startDaemon();
		return;
	}
	if (subcommand === "stop") {
		stopDaemon();
		return;
	}
	if (subcommand === "status") {
		printJson(daemonStatus());
		return;
	}
	if (subcommand === "uninstall") {
		uninstallDaemon();
		return;
	}
	if (subcommand === "run") {
		if (values.yes !== true) throw new Error("daemon run 会无人值守自动审批；仅允许由已确认安装的 LaunchAgent 传 --yes");
		await runApprovalDaemon();
		return;
	}
	throw new Error("daemon 子命令必须是 install、start、stop、status、uninstall 或 run");
}

function assertMacosDaemon() {
	if (process.platform !== "darwin") throw new Error("daemon 仅支持 macOS launchd");
	if (typeof process.getuid !== "function") throw new Error("无法确定当前 macOS 用户");
}

function launchdDomain() {
	return `gui/${process.getuid()}`;
}

function launchdService() {
	return `${launchdDomain()}/${DAEMON_LABEL}`;
}

function runLaunchctl(args, allowFailure = false) {
	const result = spawnSync("/bin/launchctl", args, { encoding: "utf8" });
	if (result.status !== 0 && !allowFailure) {
		throw new Error(`launchctl ${args[0]} 失败: ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`);
	}
	return { ok: result.status === 0, output: result.stdout.trim(), error: result.stderr.trim() };
}

function daemonLaunchdInfo() {
	const result = runLaunchctl(["print", launchdService()], true);
	const pid = result.output.match(/\bpid = (\d+)/)?.[1];
	return {
		loaded: result.ok,
		running: result.ok && /\bstate = running\b/.test(result.output),
		pid: pid ? Number.parseInt(pid, 10) : null,
	};
}

function isDaemonLoaded() {
	return daemonLaunchdInfo().loaded;
}

function escapeXml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function terminalNotifierEnvironment(executable) {
	const environment = {
		...process.env,
		PATH: `${dirname(executable)}:/usr/bin:/bin:/usr/sbin:/sbin`,
	};
	delete environment.YUNXIAO_TOKEN;
	return environment;
}

function findTerminalNotifier(searchPath = process.env.PATH) {
	for (const directory of String(searchPath || "").split(":")) {
		if (!isAbsolute(directory)) continue;
		const candidate = join(directory, "terminal-notifier");
		try {
			const stat = statSync(candidate);
			if (!stat.isFile() || (stat.mode & 0o111) === 0) continue;
			const executable = realpathSync(candidate);
			const result = spawnSync(executable, ["-version"], {
				encoding: "utf8",
				timeout: 5_000,
				env: terminalNotifierEnvironment(executable),
			});
			if (result.status === 0) return executable;
		} catch {
			// Continue to the next PATH entry.
		}
	}
	throw new Error("可点击通知需要 terminal-notifier；请先安装并确保其位于 PATH，然后重新安装 daemon");
}

function buildLaunchAgentPlist({
	nodePath = process.execPath,
	scriptPath = realpathSync(process.argv[1]),
	terminalNotifierPath,
} = {}) {
	if (!terminalNotifierPath) throw new Error("缺少 terminal-notifier 路径");
	const argumentsXml = [nodePath, scriptPath, "daemon", "run", "--yes"]
		.map((argument) => `\t\t<string>${escapeXml(argument)}</string>`)
		.join("\n");
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
		'<plist version="1.0">',
		'<dict>',
		'\t<key>Label</key>',
		`\t<string>${DAEMON_LABEL}</string>`,
		'\t<key>ProgramArguments</key>',
		'\t<array>',
		argumentsXml,
		'\t</array>',
		'\t<key>RunAtLoad</key>',
		'\t<true/>',
		'\t<key>KeepAlive</key>',
		'\t<true/>',
		'\t<key>ProcessType</key>',
		'\t<string>Background</string>',
		'\t<key>EnvironmentVariables</key>',
		'\t<dict>',
		'\t\t<key>YUNXIAO_TERMINAL_NOTIFIER</key>',
		`\t\t<string>${escapeXml(terminalNotifierPath)}</string>`,
		'\t</dict>',
		'\t<key>ThrottleInterval</key>',
		'\t<integer>10</integer>',
		'\t<key>StandardOutPath</key>',
		`\t<string>${escapeXml(DAEMON_STDOUT_PATH)}</string>`,
		'\t<key>StandardErrorPath</key>',
		`\t<string>${escapeXml(DAEMON_STDERR_PATH)}</string>`,
		'</dict>',
		'</plist>',
		'',
	].join("\n");
}

function ensureDaemonState() {
	// ponytail: approval volume is low; add file rotation only if state files become measurably large.
	mkdirSync(DAEMON_STATE_DIR, { recursive: true, mode: 0o700 });
	chmodSync(DAEMON_STATE_DIR, 0o700);
	for (const path of [DAEMON_HISTORY_PATH, DAEMON_STDOUT_PATH, DAEMON_STDERR_PATH]) {
		if (!existsSync(path)) writeFileSync(path, "", { mode: 0o600 });
		chmodSync(path, 0o600);
	}
}

async function installDaemon({ dryRun, confirmed }) {
	const terminalNotifierPath = findTerminalNotifier();
	const plist = buildLaunchAgentPlist({ terminalNotifierPath });
	if (dryRun) {
		printJson({
			status: "planned",
			writesRemote: false,
			autoApproveAllEligible: true,
			plistPath: DAEMON_PLIST_PATH,
			dashboardUrl: `http://127.0.0.1:${DAEMON_PORT}`,
			plist,
		});
		return;
	}
	if (!confirmed) throw new Error("daemon install 会持久安装并无人值守自动审批全部合资格 MR；明确确认后才可传 --yes");
	await createDaemonApprovalContext();
	ensureDaemonState();
	mkdirSync(join(homedir(), "Library/LaunchAgents"), { recursive: true });
	if (isDaemonLoaded()) runLaunchctl(["bootout", launchdService()]);
	const temporaryPath = `${DAEMON_PLIST_PATH}.tmp-${process.pid}`;
	writeFileSync(temporaryPath, plist, { mode: 0o600 });
	renameSync(temporaryPath, DAEMON_PLIST_PATH);
	chmodSync(DAEMON_PLIST_PATH, 0o600);
	runLaunchctl(["bootstrap", launchdDomain(), DAEMON_PLIST_PATH]);
	printJson({ ...daemonStatus(), status: "installed" });
}

async function startDaemon() {
	if (!existsSync(DAEMON_PLIST_PATH)) throw new Error("daemon 尚未安装；先运行 daemon install --yes");
	const launchd = daemonLaunchdInfo();
	if (launchd.running) {
		printJson({ ...daemonStatus(), status: "already-running" });
		return;
	}
	await createDaemonApprovalContext();
	if (!launchd.loaded) runLaunchctl(["bootstrap", launchdDomain(), DAEMON_PLIST_PATH]);
	else runLaunchctl(["kickstart", launchdService()]);
	printJson({ ...daemonStatus(), status: "started" });
}

function stopDaemon({ quiet = false } = {}) {
	const loaded = isDaemonLoaded();
	if (loaded) runLaunchctl(["bootout", launchdService()]);
	if (!quiet) printJson({ ...daemonStatus(), status: loaded ? "stopped" : "already-stopped" });
}

function uninstallDaemon() {
	stopDaemon({ quiet: true });
	rmSync(DAEMON_PLIST_PATH, { force: true });
	printJson({ ...daemonStatus(), status: "uninstalled", historyPreserved: DAEMON_HISTORY_PATH });
}

function daemonStatus() {
	const launchd = daemonLaunchdInfo();
	return {
		status: "completed",
		installed: existsSync(DAEMON_PLIST_PATH),
		loaded: launchd.loaded,
		running: launchd.running,
		pid: launchd.pid,
		autoApproveAllEligible: true,
		dashboardUrl: `http://127.0.0.1:${DAEMON_PORT}`,
		plistPath: DAEMON_PLIST_PATH,
		historyPath: DAEMON_HISTORY_PATH,
	};
}

function daemonHistoryKey(request) {
	return `${request.repository}!${request.mrIid}!${request.sha}!${request.notification.id}`;
}

function loadDaemonHistory() {
	const records = [];
	if (existsSync(DAEMON_HISTORY_PATH)) {
		for (const line of readFileSync(DAEMON_HISTORY_PATH, "utf8").split("\n")) {
			if (!line.trim()) continue;
			try {
				const record = JSON.parse(line);
				if (record && typeof record === "object") records.push(record);
			} catch {
				// Ignore a final partial line left by an interrupted append.
			}
		}
	}
	const processed = new Set(records
		.filter((record) => record.key && (record.terminal !== false || record.writeAttempted === true))
		.map((record) => record.key));
	return { records, processed };
}

function appendDaemonHistory(store, state, record) {
	const entry = {
		...record,
		id: randomUUID(),
		timestamp: new Date().toISOString(),
	};
	appendFileSync(DAEMON_HISTORY_PATH, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
	store.records.push(entry);
	if (entry.key && (entry.terminal !== false || entry.writeAttempted === true)) store.processed.add(entry.key);
	state.lastEventAt = entry.timestamp;
	process.stdout.write(`${JSON.stringify(entry)}\n`);
	return entry;
}

function latestDaemonHistory(records) {
	const latest = new Map();
	for (const record of records) {
		const key = record.operationId || record.id;
		if (latest.has(key)) latest.delete(key);
		latest.set(key, record);
	}
	return [...latest.values()].slice(-DAEMON_HISTORY_LIMIT).reverse();
}

async function createDaemonApprovalContext() {
	const client = new OneClient(await readValidatedChromeToken());
	const currentUser = await client.fetchCurrentUser();
	return { client, currentUser };
}

function sameUser(left, right) {
	return Number(left?.id) === Number(right?.id);
}

async function recoverInterruptedApprovals(context, store, state) {
	const latest = latestDaemonHistory(store.records);
	for (const pending of latest.filter((record) => record.kind === "approval" && record.status === "approving")) {
		try {
			const mr = await context.client.fetchMergeRequest(pending.repository, pending.mrIid);
			const approved = approvedUserIds(mr).has(Number(context.currentUser.id));
			const changed = mr.sha !== pending.sha;
			const status = approved ? (changed ? "partial" : "approved") : "failed";
			const macNotification = status === "approved" ? sendMacApprovalNotification(pending) : {};
			appendDaemonHistory(store, state, {
				...pending,
				id: undefined,
				timestamp: undefined,
				status,
				reason: approved
					? (changed ? "sha-changed-after-approval" : "recovered-after-restart")
					: "not-approved-after-interrupted-write",
				recoveredAfterRestart: true,
				changedAfterApproval: approved && changed,
				progress: approvalProgress(mr),
				...macNotification,
				terminal: true,
			});
		} catch (error) {
			state.lastError = error.message;
		}
	}
}

function approvalRecordBase(request, trigger) {
	return {
		kind: "approval",
		trigger,
		key: daemonHistoryKey(request),
		repository: request.repository,
		repoId: request.repoId,
		mrIid: request.mrIid,
		title: request.title,
		author: request.author,
		sourceBranch: request.sourceBranch,
		targetBranch: request.targetBranch,
		sha: request.sha,
		notification: request.notification,
		url: request.url,
	};
}

function sendMacApprovalNotification(
	request,
	run = spawnSync,
	notifierPath = process.env.YUNXIAO_TERMINAL_NOTIFIER,
) {
	try {
		if (!notifierPath) throw new Error("daemon 缺少 terminal-notifier 配置；重新运行 daemon install --yes");
		const url = new URL(request.url);
		const target = parseApprovalNotice({ url: url.href });
		if (url.origin !== API_BASE || target?.repository !== request.repository || target?.mrIid !== Number(request.mrIid)) {
			throw new Error("MR 通知链接无效");
		}
		const result = run(notifierPath, [
			"-title", "云效 MR 已批准",
			"-subtitle", `${request.repository} !${request.mrIid}`,
			"-message", `MR 标题：${request.title || "无标题"}`,
			"-open", url.href,
		], {
			encoding: "utf8",
			timeout: 5_000,
			env: terminalNotifierEnvironment(notifierPath),
		});
		if (result.status === 0) return { macNotificationSent: true };
		return {
			macNotificationSent: false,
			macNotificationError: result.error?.message || String(result.stderr || "").trim() || `terminal-notifier exit ${result.status ?? "unknown"}`,
		};
	} catch (error) {
		return { macNotificationSent: false, macNotificationError: error.message };
	}
}

async function processDaemonApproval(context, notice, trigger, store, state) {
	const target = parseApprovalNotice(notice);
	if (!target) return;
	let before;
	let request;
	try {
		before = await context.client.fetchMergeRequest(target.repository, target.mrIid);
		request = toApprovalRequest(before, notice);
	} catch (error) {
		appendDaemonHistory(store, state, {
			kind: "approval",
			operationId: randomUUID(),
			trigger,
			repository: target.repository,
			mrIid: target.mrIid,
			url: `${API_BASE}/repos/${target.repository}/merge_requests/${target.mrIid}`,
			status: "failed",
			reason: "preflight-failed",
			error: error.message,
			writeAttempted: false,
			terminal: false,
		});
		return;
	}
	const base = approvalRecordBase(request, trigger);
	if (store.processed.has(base.key)) return;
	const decision = approvalDecision(before, context.currentUser.id);
	if (!decision.matches) {
		appendDaemonHistory(store, state, {
			...base,
			operationId: randomUUID(),
			status: "skipped",
			reason: decision.reason,
			writeAttempted: false,
			terminal: true,
		});
		return;
	}

	const operationId = randomUUID();
	appendDaemonHistory(store, state, {
		...base,
		operationId,
		status: "approving",
		writeAttempted: true,
		terminal: false,
	});
	let writeError;
	try {
		await context.client.approveMergeRequest(request.repoId, request.mrIid);
	} catch (error) {
		writeError = error;
	}
	try {
		const after = await context.client.fetchMergeRequest(request.repository, request.mrIid);
		if (!approvedUserIds(after).has(Number(context.currentUser.id))) {
			throw writeError || new Error("批准请求后远端状态未更新");
		}
		const changedAfterApproval = after.sha !== request.sha;
		const status = changedAfterApproval ? "partial" : "approved";
		const macNotification = status === "approved" ? sendMacApprovalNotification(request) : {};
		appendDaemonHistory(store, state, {
			...base,
			operationId,
			status,
			reason: changedAfterApproval ? "sha-changed-after-approval" : undefined,
			progress: approvalProgress(after),
			recoveredAfterWriteError: Boolean(writeError),
			changedAfterApproval,
			...macNotification,
			writeAttempted: true,
			terminal: true,
		});
	} catch (error) {
		appendDaemonHistory(store, state, {
			...base,
			operationId,
			status: "failed",
			reason: "approval-not-verified",
			error: error.message,
			writeAttempted: true,
			terminal: true,
		});
	}
}

async function scanDaemonApprovalNotices(expectedUser, trigger, store, state) {
	const context = await createDaemonApprovalContext();
	if (!sameUser(expectedUser, context.currentUser)) throw new Error("Chrome 当前账号已变化；重启 daemon 后再继续");
	const notices = await context.client.fetchApprovalNotices();
	const targets = new Map();
	for (const notice of notices) {
		const target = parseApprovalNotice(notice);
		if (!target) continue;
		const key = `${target.repository}!${target.mrIid}`;
		const existing = targets.get(key);
		if (!existing || notice.createTime > existing.createTime) targets.set(key, notice);
	}
	for (const notice of targets.values()) {
		await processDaemonApproval(context, notice, trigger, store, state);
	}
	state.lastScanAt = new Date().toISOString();
}

function parseMqttNotice(payload) {
	try {
		const message = JSON.parse(payload.toString());
		return message && typeof message.notice === "object" ? message.notice : null;
	} catch {
		return null;
	}
}

function sendDashboardResponse(response, statusCode, contentType, body) {
	response.writeHead(statusCode, {
		"Cache-Control": "no-store",
		"Content-Type": contentType,
		"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
	});
	response.end(body);
}

function dashboardHtml() {
	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>云效自动审批</title>
<style>
:root{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f6f8;color:#1f2329}*{box-sizing:border-box}body{margin:0}.page{max-width:1180px;margin:auto;padding:28px 18px 48px}header{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:20px}h1{font-size:26px;margin:0 0 6px}.muted{color:#646a73;font-size:13px}.badge{padding:6px 10px;border-radius:999px;background:#e8f3ff;color:#1456a0;font-size:13px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}.card{background:#fff;border:1px solid #e5e6eb;border-radius:12px;padding:16px}.card b{display:block;font-size:24px;margin-top:6px}.panel{background:#fff;border:1px solid #e5e6eb;border-radius:12px;overflow:hidden}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;padding:12px 14px;border-bottom:1px solid #f0f1f2;font-size:13px;vertical-align:top}th{background:#fafafa;color:#646a73;font-weight:600}a{color:#1456a0;text-decoration:none}.status{font-weight:600}.approved{color:#168a45}.failed{color:#c93535}.partial,.skipped{color:#8a6816}.approving{color:#1456a0}.empty{text-align:center;padding:42px;color:#8f959e}@media(max-width:720px){header{align-items:start;flex-direction:column}.cards{grid-template-columns:repeat(2,1fr)}.page{padding-top:20px}}
</style>
</head>
<body>
<main class="page">
<header><div><h1>云效自动审批</h1><div id="meta" class="muted">正在连接本地守护进程…</div></div><span id="mqtt" class="badge">MQTT —</span></header>
<section class="cards"><div class="card"><span class="muted">已批准</span><b id="approved">0</b></div><div class="card"><span class="muted">需复核</span><b id="partial">0</b></div><div class="card"><span class="muted">失败</span><b id="failed">0</b></div><div class="card"><span class="muted">已跳过</span><b id="skipped">0</b></div><div class="card"><span class="muted">处理中</span><b id="approving">0</b></div></section>
<section class="panel scroll"><table><thead><tr><th>时间</th><th>结果</th><th>MR</th><th>标题</th><th>作者</th><th>分支</th><th>详情</th></tr></thead><tbody id="rows"></tbody></table><div id="empty" class="empty">暂无审批记录</div></section>
</main>
<script>
const labels={approved:"已批准",partial:"需复核",failed:"失败",skipped:"已跳过",approving:"处理中"};
function cell(value){const td=document.createElement("td");td.textContent=value==null?"—":String(value);return td}
function detail(record){return record.error||record.macNotificationError||record.reason||(record.changedAfterApproval?"批准后 SHA 已变化":"—")}
async function refresh(){
 try{
  const response=await fetch("/api/history",{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const data=await response.json();
  document.getElementById("mqtt").textContent="MQTT "+data.daemon.mqtt;
  document.getElementById("meta").textContent=(data.daemon.currentUser||"未知用户")+" · 启动于 "+new Date(data.daemon.startedAt).toLocaleString();
  const approvals=data.history.filter(item=>item.kind==="approval");
  for(const status of ["approved","partial","failed","skipped","approving"]){document.getElementById(status).textContent=approvals.filter(item=>item.status===status).length}
  const rows=document.getElementById("rows");rows.replaceChildren();
  for(const item of data.history){
   const tr=document.createElement("tr");tr.append(cell(new Date(item.timestamp).toLocaleString()));
   const status=cell(labels[item.status]||item.status);status.className="status "+item.status;tr.append(status);
   const mr=document.createElement("td");if(item.url){const a=document.createElement("a");a.href=item.url;a.target="_blank";a.rel="noreferrer";a.textContent=item.repository+" !"+item.mrIid;mr.append(a)}else{mr.textContent="系统"}tr.append(mr);
   tr.append(cell(item.title));tr.append(cell(item.author&&item.author.name));tr.append(cell(item.sourceBranch&&item.targetBranch?item.sourceBranch+" → "+item.targetBranch:"—"));tr.append(cell(detail(item)));rows.append(tr);
  }
  document.getElementById("empty").hidden=data.history.length>0;
 }catch(error){document.getElementById("meta").textContent="Dashboard 读取失败："+error.message}
}
refresh();setInterval(refresh,5000);
</script>
</body>
</html>`;
}

async function startDashboardServer(state, store) {
	const allowedHosts = new Set([`127.0.0.1:${DAEMON_PORT}`, `localhost:${DAEMON_PORT}`]);
	const server = createServer((request, response) => {
		if (!allowedHosts.has(String(request.headers.host || "").toLowerCase())) {
			sendDashboardResponse(response, 403, "text/plain; charset=utf-8", "Forbidden");
			return;
		}
		if (request.method !== "GET") {
			sendDashboardResponse(response, 405, "text/plain; charset=utf-8", "Method Not Allowed");
			return;
		}
		const url = new URL(request.url, `http://127.0.0.1:${DAEMON_PORT}`);
		if (url.pathname === "/") {
			sendDashboardResponse(response, 200, "text/html; charset=utf-8", dashboardHtml());
			return;
		}
		if (url.pathname === "/api/history") {
			sendDashboardResponse(response, 200, "application/json; charset=utf-8", JSON.stringify({
				daemon: state,
				history: latestDaemonHistory(store.records),
			}));
			return;
		}
		sendDashboardResponse(response, 404, "text/plain; charset=utf-8", "Not Found");
	});
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(DAEMON_PORT, "127.0.0.1", resolve);
	});
	return server;
}

async function runApprovalDaemon() {
	ensureDaemonState();
	const store = loadDaemonHistory();
	const initialContext = await createDaemonApprovalContext();
	const state = {
		status: "running",
		mqtt: "connecting",
		startedAt: new Date().toISOString(),
		currentUser: initialContext.currentUser.name || initialContext.currentUser.emailPrefix,
		lastScanAt: null,
		lastEventAt: null,
		lastError: null,
	};
	await recoverInterruptedApprovals(initialContext, store, state);
	const server = await startDashboardServer(state, store);
	let mqttClient;
	try {
		await scanDaemonApprovalNotices(initialContext.currentUser, "startup", store, state);
		const { connect } = await import("mqtt");
		const topic = `${MQTT_TOPIC_PREFIX}${initialContext.currentUser.id}/`;
		mqttClient = connect(MQTT_BROKER_URL, { keepalive: 30, reconnectPeriod: 30_000 });
		let work = Promise.resolve();
		const enqueue = (operation) => {
			work = work.then(operation).catch((error) => {
				state.lastError = error.message;
				try {
					appendDaemonHistory(store, state, {
						kind: "system",
						operationId: randomUUID(),
						status: "failed",
						error: error.message,
						terminal: true,
					});
				} catch {
					process.stderr.write(`${error.stack || error.message}\n`);
				}
			});
		};
		mqttClient.on("connect", () => {
			state.mqtt = "connected";
			state.lastError = null;
			mqttClient.subscribe(topic, (error, grants) => {
				if (error || !grants?.length || grants[0].qos === 128) {
					state.mqtt = "subscription-failed";
					state.lastError = error?.message || "MQTT Topic 订阅被拒绝";
					return;
				}
				enqueue(() => scanDaemonApprovalNotices(initialContext.currentUser, "startup-or-reconnect", store, state));
			});
		});
		mqttClient.on("message", (_topic, payload) => {
			const notice = parseMqttNotice(payload);
			if (!notice || !parseApprovalNotice(notice)) return;
			enqueue(async () => {
				const context = await createDaemonApprovalContext();
				if (!sameUser(initialContext.currentUser, context.currentUser)) throw new Error("Chrome 当前账号已变化；重启 daemon 后再继续");
				await processDaemonApproval(context, notice, "mqtt", store, state);
			});
		});
		mqttClient.on("reconnect", () => { state.mqtt = "reconnecting"; });
		mqttClient.on("offline", () => { state.mqtt = "offline"; });
		mqttClient.on("close", () => { state.mqtt = "closed"; });
		mqttClient.on("error", (error) => { state.lastError = error.message; });
		await new Promise((resolve) => {
			let stopping = false;
			const stop = () => {
				if (stopping) return;
				stopping = true;
				state.status = "stopping";
				mqttClient.end(true);
				server.close(resolve);
			};
			process.once("SIGTERM", stop);
			process.once("SIGINT", stop);
		});
	} catch (error) {
		mqttClient?.end(true);
		server.close();
		throw error;
	}
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
					name: "yunxiao-skill",
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

	async fetchRepositoryAppSettings(repoId) {
		return requireData(await this.request("GET", `/api/rd/repositories/${repoId}/app_settings`), "获取仓库应用设置");
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

	async fetchCurrentUser() {
		return requireData(await this.request("GET", "/api/base/user/me"), "获取当前用户");
	}

	async fetchApprovalNotices() {
		const notices = [];
		const pageSize = 100;
		for (let pageNum = 1; ; pageNum += 1) {
			const page = requireData(await this.request("GET", "/api/notice/notices", {
				params: { category: 15, pageNum, pageSize, unread: false },
			}), "获取 MR 评审通知");
			if (!Array.isArray(page.list)) throw new Error("获取 MR 评审通知失败: list 不是数组");
			notices.push(...page.list);
			if (page.isLastPage === true || page.list.length < pageSize || notices.length >= Number(page.total)) break;
		}
		return notices;
	}

	async fetchOpenMergeRequests(authorId) {
		const mergeRequests = [];
		const pageSize = 100;
		for (let pageNum = 1; ; pageNum += 1) {
			const page = requireData(await this.request("GET", "/api/rd/mergeRequests", {
				params: {
					pageNum,
					pageSize,
					status: 1,
					authorId,
					withChecks: false,
					withBindEntity: false,
				},
			}), "获取当前用户未合并 MR");
			if (!Array.isArray(page.list)) throw new Error("获取当前用户未合并 MR 失败: list 不是数组");
			mergeRequests.push(...page.list);
			if (page.list.length < pageSize || mergeRequests.length >= Number(page.total)) break;
		}
		return mergeRequests;
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

	async approveMergeRequest(repoId, mrIid) {
		return requireBusinessSuccess(await this.request(
			"POST",
			`/api/rd/repositories/${repoId}/mergeRequests/${mrIid}/approve`,
		), "批准 MR");
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
	return readValidatedChromeToken(userDataDirs);
}

async function readValidatedChromeToken(userDataDirs = CHROME_USER_DATA_DIRS) {
	const candidates = await readChromeTokenCandidates(userDataDirs);
	if (candidates.length === 0) {
		throw new Error("未在本机 Chrome Local Storage 中找到 one.in.zhihu.com Token");
	}
	for (const candidate of candidates) {
		try {
			await new OneClient(candidate).searchEmployee("yunxiao-auth-check");
			return candidate;
		} catch {
			// Try the next read-only Chrome candidate.
		}
	}
	throw new Error("Chrome Local Storage 中的云效 Token 均无效；请重新登录 one.in.zhihu.com");
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
	assert.deepEqual(parseDateRange("2026-08-01", "2026-08-31"), { from: "2026-08-01", to: "2026-08-31" });
	assert.throws(() => parseDateRange("2026-02-30", "2026-03-01"), /有效日期/);
	assert.throws(() => parseDateRange("2026-09-01", "2026-08-31"), /不能晚于/);
	assert.equal(isMrCreatedInRange({ mrIid: 1, createTime: "2026-08-01 00:00:00" }, { from: "2026-08-01", to: "2026-08-31" }), true);
	assert.equal(isMrCreatedInRange({ mrIid: 1, createTime: "2026-07-31 23:59:59" }, { from: "2026-08-01", to: "2026-08-31" }), false);
	assert.equal(toPublicMergeRequest({ mrIid: 7, title: "MR", createTime: "2026-08-01 12:00:00", targetRepoNameWithNamespace: "Team/Repo" }).url, `${API_BASE}/repos/Team/Repo/merge_requests/7`);
	assert.deepEqual(parseApprovalNotice({ url: `${API_BASE}/repos/Team/Repo/merge_requests/7` }), { repository: "Team/Repo", mrIid: 7 });
	assert.equal(parseApprovalNotice({ url: "https://evil.example/repos/Team/Repo/merge_requests/7" }), null);
	const pendingApprovalMr = {
		status: { code: 1 },
		author: { id: 2 },
		review: { approvalsRequired: 1, approvalsLeft: 1, approvedCount: 0, approvedBy: [], users: [{ id: 1 }] },
		multiReview: null,
	};
	assert.deepEqual(approvalDecision(pendingApprovalMr, 1), { matches: true, reason: "pending-approval" });
	assert.equal(approvalDecision({ ...pendingApprovalMr, review: { ...pendingApprovalMr.review, approvedBy: [{ id: 1 }] } }, 1).reason, "already-approved");
	assert.equal(approvalDecision({ ...pendingApprovalMr, review: { ...pendingApprovalMr.review, approvalsLeft: 0, approvedCount: 1, approvedBy: [{ id: 3 }] } }, 1).reason, "approval-satisfied");
	assert.equal(approvalDecision({ ...pendingApprovalMr, review: null, multiReview: [{ ruleType: "any_approver", approvalsRequired: 1, approvedBy: [], eligibleApprovers: [] }] }, 1).matches, true);
	assert.equal(
		approvalPlanId(1, { from: "2026-08-01", to: "2026-08-31" }, [{ repository: "Team/Repo", repoId: 1, mrIid: 7, sha: "a" }])
			=== approvalPlanId(1, { from: "2026-08-01", to: "2026-08-31" }, [{ repository: "Team/Repo", repoId: 1, mrIid: 7, sha: "b" }]),
		false,
	);
	assert.deepEqual(toPublicQaOwners(null), []);
	assert.deepEqual(toPublicQaOwners({ id: 7, name: "QA", emailPrefix: "qa" }), [{ id: 7, name: "QA", emailPrefix: "qa" }]);
	assert.equal(
		daemonHistoryKey({ repository: "Team/Repo", mrIid: 7, sha: "abc", notification: { id: 8 } }),
		"Team/Repo!7!abc!8",
	);
	assert.deepEqual(parseMqttNotice(Buffer.from('{"notice":{"id":8}}')), { id: 8 });
	assert.equal(parseMqttNotice(Buffer.from("invalid")), null);
	const notificationCalls = [];
	const notificationRequest = {
		repository: "Team/Repo",
		mrIid: 7,
		title: "MR",
		url: `${API_BASE}/repos/Team/Repo/merge_requests/7`,
	};
	assert.deepEqual(sendMacApprovalNotification(notificationRequest, (...args) => {
		notificationCalls.push(args);
		return { status: 0, stderr: "" };
	}, "/opt/terminal-notifier"), { macNotificationSent: true });
	assert.equal(notificationCalls[0][0], "/opt/terminal-notifier");
	assert.deepEqual(notificationCalls[0][1].slice(-2), ["-open", notificationRequest.url]);
	assert.equal(sendMacApprovalNotification(notificationRequest, () => {
		throw new Error("notifications disabled");
	}, "/opt/terminal-notifier").macNotificationSent, false);
	const plist = buildLaunchAgentPlist({
		nodePath: "/opt/node&bin",
		scriptPath: "/tmp/yunxiao.mjs",
		terminalNotifierPath: "/opt/terminal&notifier",
	});
	assert.match(plist, /<string>\/opt\/node&amp;bin<\/string>/);
	assert.match(plist, /<string>\/opt\/terminal&amp;notifier<\/string>/);
	assert.doesNotMatch(plist, /token/i);
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

	const temp = mkdtempSync(join(tmpdir(), "yunxiao-self-test-"));
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
	printJson({ status: "passed", checks: 59 });
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
