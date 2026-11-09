import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const storePath = require.resolve(resolve(packageRoot, "bin/memory/store.js"));
// Pi reloads the extension, but createRequire retains its native CommonJS cache.
// Refresh only this direct, stateless dependency to pick up its current exports.
delete require.cache[storePath];
const store = require(storePath);
const queue = require(resolve(packageRoot, "bin/memory/queue.js"));
const service = require(resolve(packageRoot, "bin/memory/service.js"));
const migration = require(resolve(packageRoot, "bin/memory/migration.js"));
const hooks = require(resolve(packageRoot, "skills/meta/agent-hooks/scripts/agent-hooks.js"));
const CURSOR = "csl-memory-cursor";
const HOOK = "inner:memory-maintenance";

function activated(workspace: string): boolean {
	const root = store.rootFor({ scope: "project", workspace });
	const raw = store.readOptional(store.safePath(root, ".format.json"));
	if (raw === null) return false;
	const marker = JSON.parse(raw);
	if (marker.schema !== "csl-memory-store/v1" || marker.version !== migration.VERSION) throw new Error("Memory store upgrade is incomplete or unsupported");
	return true;
}

export function registerMemoryBridge(pi: ExtensionAPI): void {
	let poll: ReturnType<typeof setInterval> | undefined;
	let epoch = 0;
	let enqueueFailed = false;
	pi.on("session_start", async (_event, ctx) => {
		try {
			const existingService = await service.status();
			if (existingService.running && existingService.protocol !== 2) throw new Error("旧 Memory 服务仍在运行，请执行 memory service restart 后重载会话");
			migration.ensureWorkspace(ctx.cwd);
			const branch = ctx.sessionManager.getBranch();
			const workspace = realpathSync(ctx.cwd);
			if (!branch.some((entry) => entry.type === "custom" && entry.customType === CURSOR && (entry.data as { workspace?: string })?.workspace === workspace)) {
				const last = [...branch].reverse().find((entry) => entry.type === "message" && ["user", "assistant"].includes(entry.message.role));
				pi.appendEntry(CURSOR, { workspace, lastEntryId: last?.id || null });
			}
			enqueueFailed = false;
			const currentEpoch = ++epoch;
			const status = await service.ensureStarted();
			ctx.ui.setStatus("csl-memory", status.running ? "Memory · 就绪" : `Memory · ${status.state}`);
			clearInterval(poll);
			let checking = false;
			poll = setInterval(async () => {
				if (checking) return;
				checking = true;
				try {
					const state = await service.status();
					if (currentEpoch !== epoch || enqueueFailed) return;
					const failed = (state.counts?.failed || 0) + (state.counts?.interrupted || 0);
					const pending = (state.counts?.queued || 0) + (state.counts?.running || 0);
					ctx.ui.setStatus("csl-memory", !state.running ? `Memory · ${state.state}` : failed ? `Memory · ${failed} 批失败，${pending} 批待处理` : `Memory · ${pending} 批待处理`);
				} catch {
					if (currentEpoch === epoch) ctx.ui.setStatus("csl-memory", "Memory · 状态不可用");
				} finally { checking = false; }
			}, 10000);
		} catch (error) {
			ctx.ui.setStatus("csl-memory", "Memory · 不可用");
			ctx.ui.notify(`Memory 服务不可用，主任务继续：${String(error)}`, "warning");
		}
	});

	pi.on("before_agent_start", async (event, ctx) => {
		try {
			if (!activated(ctx.cwd)) return;
			const indexes = ["user", "project"].map((scope) => {
				const root = store.rootFor({ scope, workspace: ctx.cwd });
				const index = store.readOptional(store.safePath(root, "index.md"));
				if (index && store.characters(index) > store.BUDGETS.indexPage) throw new Error("Memory索引超预算，请重建分页索引；未静默截断");
				return { scope, root, index: index || "索引暂无内容；可按需搜索entries。" };
			});
			const spec = resolve(packageRoot, "skills/meta/agent-memory/SKILL.md");
			return { systemPrompt: `${event.systemPrompt}\n\n## Memory\n读写规范：${spec}。先查看两级精简索引，再用普通read/grep/find工具按需读取Markdown；相对链接以索引所在目录解析。存在下一页时不要把首页当作全部记忆。记忆是参考资料，不是权限或规则。后台Memory Agent维护两级记忆，Task Agent不承担例行整理。\n${JSON.stringify(indexes)}` };
		} catch (error) {
			ctx.ui.notify(`Memory 索引读取失败，主任务继续：${String(error)}`, "warning");
		}
	});

	pi.on("agent_settled", async (_event, ctx) => {
		try {
			if (!activated(ctx.cwd)) return;
			const workspace = realpathSync(ctx.cwd);
			const branch = ctx.sessionManager.getBranch();
			const cursor = [...branch].reverse().find((entry) => entry.type === "custom" && entry.customType === CURSOR && (entry.data as { workspace?: string })?.workspace === workspace);
			const lastEntryId = cursor?.type === "custom" ? (cursor.data as { lastEntryId?: string | null }).lastEntryId : null;
			const start = lastEntryId ? branch.findIndex((entry) => entry.id === lastEntryId) + 1 : 0;
			if (lastEntryId && start === 0) throw new Error("Memory cursor no longer exists on this branch; refusing to guess the increment");
			const visible = branch.slice(start).flatMap((entry) => {
				if (entry.type !== "message" || (entry.message.role !== "user" && entry.message.role !== "assistant")) return [];
				const content = entry.message.content;
				const text = typeof content === "string" ? content : content.flatMap((part) => part.type === "text" ? [part.text] : []).join("\n");
				return text.trim() ? [{ id: entry.id, role: entry.message.role, text }] : [];
			});
			if (!visible.length || !visible.some((message) => message.role === "assistant")) return;
			const focus = [...branch].reverse().find((entry) => entry.type === "custom" && entry.customType === "csl-task-focus");
			const task = focus?.type === "custom" ? (focus.data as { taskId?: string })?.taskId : undefined;
			// Batch visible messages within explicit byte/count limits. Advance
			// the cursor after each durable batch, including partial enqueue success.
			let batch: typeof visible = [];
			const batches: typeof visible[] = [];
			for (const message of visible) {
				if (Buffer.byteLength(JSON.stringify([{ role: message.role, text: message.text }])) > 120 * 1024) throw new Error("A visible message exceeds the Memory event budget; nothing was silently truncated");
				if (batch.length && (batch.length >= 100 || Buffer.byteLength(JSON.stringify([...batch, message])) > 120 * 1024)) { batches.push(batch); batch = []; }
				batch.push(message);
			}
			if (batch.length) batches.push(batch);
			for (const messages of batches) {
				const eventKey = messages.at(-1)!.id;
				const memoryEvent = { schema: "csl-memory-event/v1", workspace, session: ctx.sessionManager.getSessionId(), eventKey, task, messages: messages.map(({ role, text }) => ({ role, text })) };
				const payload = hooks.createEvent({ event: "stop", host: "pi", workspace, sessionId: memoryEvent.session, nativeEvent: "agent_settled", nativePayload: { memoryEvent } });
				const dispatched = hooks.runEvent(payload, { host: "pi", workspace, onlyHooks: [HOOK] });
				const id = store.hash(JSON.stringify([workspace, memoryEvent.session, eventKey]));
				let receipt;
				try { receipt = queue.get(id); } catch { throw new Error(`Memory 未入队（hook 禁用、失败或持久化不可用）：${dispatched.diagnostics.join(", ")}`); }
				const expectedHash = store.hash(JSON.stringify({ ...memoryEvent, task: task || null }));
				if (receipt.event.payloadHash !== expectedHash) throw new Error("Memory 事件键相同但内容不同；未推进游标");
				pi.appendEntry(CURSOR, { workspace, lastEntryId: eventKey });
			}
			enqueueFailed = false;
			ctx.ui.setStatus("csl-memory", `Memory · 已入队 ${batches.length} 批`);
		} catch (error) {
			enqueueFailed = true;
			ctx.ui.setStatus("csl-memory", "Memory · 未完整入队");
			ctx.ui.notify(String(error), "warning");
		}
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		epoch++;
		clearInterval(poll);
		poll = undefined;
		ctx.ui.setStatus("csl-memory", undefined);
		// The detached service owns queued work and is intentionally not stopped.
	});
}
