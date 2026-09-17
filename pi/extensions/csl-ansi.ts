import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Container, Text, truncateToWidth, visibleWidth, wrapTextWithAnsi, type Component } from "@earendil-works/pi-tui";

const sgrPattern = /\x1b\[([0-9;]*)m/g;
const simpleStyles = new Set([0, 1, 2, 3, 4, 7, 9, 22, 23, 24, 27, 29, 39, 49]);

function normalizeSgr(parameters: string): string {
	const codes = parameters.split(";").map((value) => value === "" ? 0 : Number(value));
	for (let i = 0; i < codes.length; i++) {
		const code = codes[i];
		if (code === 38 || code === 48) {
			const mode = codes[++i];
			const count = mode === 5 ? 1 : mode === 2 ? 3 : 0;
			if (!count) throw new Error("扩展颜色须使用 38/48;5;N 或 38/48;2;R;G;B。");
			for (let channel = 0; channel < count; channel++) {
				const value = codes[++i];
				if (!Number.isInteger(value) || value < 0 || value > 255) {
					throw new Error("ANSI 颜色值必须是 0～255 的整数，且参数完整。");
				}
			}
			continue;
		}
		if (!simpleStyles.has(code) &&
			!(code >= 30 && code <= 37) && !(code >= 40 && code <= 47) &&
			!(code >= 90 && code <= 97) && !(code >= 100 && code <= 107)) {
			throw new Error("包含不支持的 ANSI SGR 样式。");
		}
	}
	return `\x1b[${codes.join(";")}m`;
}

function validateAnsi(value: unknown): { ansi: string; plain: string } {
	if (typeof value !== "string") throw new Error("text 必须是 ANSI 字符串。");
	if (new TextEncoder().encode(value).length > 32768 || value.split("\n").length > 200) {
		throw new Error("输入上限为 32 KiB、200 行（含 ANSI 序列）。");
	}
	// Remove only recognized SGR sequences before checking the remaining text.
	// Any other escape, C0/C1 control, Tab, CR or bidi control fails closed.
	const plain = value.replace(sgrPattern, "");
	if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/u.test(plain)) {
		throw new Error("只允许 ANSI SGR 样式、可显示文本和 LF 换行；禁止光标移动、清屏、OSC、Tab 等控制指令。");
	}
	const ansi = value.replace(sgrPattern, (_match, parameters: string) => normalizeSgr(parameters));
	if (new TextEncoder().encode(ansi).length > 32768) {
		throw new Error("规范化后的 ANSI 内容超过 32 KiB，请缩短输入。");
	}
	return { ansi, plain };
}

function ansiComponent(ansi: string): Component {
	const requiredWidth = Math.max(1, ...ansi.split("\n").map(visibleWidth));
	// Use Pi's SGR state tracker across LF without introducing soft wraps.
	const lines = wrapTextWithAnsi(ansi, requiredWidth);
	return {
		render(width) {
			if (width <= 0) return [];
			const rendered = lines.map((line) => `\x1b[0m${truncateToWidth(line, width, "")}\x1b[0m`);
			if (requiredWidth > width) {
				rendered.unshift(truncateToWidth(`右侧已裁切：内容需要 ${requiredWidth} 列，请加宽终端。`, width, ""));
			}
			return rendered;
		},
		invalidate() {},
	};
}

const ansiTool = defineTool({
	name: "render_ansi",
	label: "ANSI",
	renderShell: "self",
	description: "Render ANSI-styled monospace text directly in the Pi TUI without images or files. Pass text containing actual ESC characters (JSON: \\u001b), not literal backslash-x1b text. Supports SGR reset, bold, dim, italic, underline, inverse, strikethrough, standard/bright colors, 256 colors and RGB foreground/background using semicolon parameters. Rejects non-SGR terminal controls, OSC, cursor movement, clearing, blink, hidden text, tabs and CR. Preserve alignment with spaces and LF. Maximum 32 KiB including escapes and 200 lines. Narrow terminals clip with a warning, not wrapping. Non-TUI clients receive plain text.",
	promptSnippet: "Render ANSI-styled text and aligned character diagrams directly in the terminal",
	promptGuidelines: [
		"Use render_ansi for colored terminal text or character diagrams. Pass ANSI SGR sequences directly in text (JSON escape \\u001b), with spaces and LF newlines, instead of images or shell output.",
	],
	parameters: Type.Object({
		text: Type.String({ description: "Text with ANSI SGR escape sequences; use \\u001b in JSON for ESC." }),
	}),
	async execute(_toolCallId, params) {
		const { ansi, plain } = validateAnsi(params.text);
		return {
			content: [{ type: "text", text: plain }],
			details: { ansi },
		};
	},
	renderCall() {
		return new Container();
	},
	renderResult(result) {
		try {
			return ansiComponent(validateAnsi(result.details?.ansi).ansi);
		} catch {
			// Never interpolate untrusted result/error text into the TUI.
			return new Text("无法显示 ANSI 内容：输入无效或工具执行失败。", 0, 0);
		}
	},
});

export default function (pi: ExtensionAPI) {
	pi.registerTool(ansiTool);
}
