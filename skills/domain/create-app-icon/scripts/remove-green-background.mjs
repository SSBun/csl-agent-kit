#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const OUTPUT_SIZE = 1024;
const KEY_DISTANCE = 24;
const REQUIRED_UNIFORM_BORDER = 0.9;

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});

async function main() {
	const { values } = parseArgs({
		options: {
			input: { type: "string" },
			output: { type: "string" },
			"self-test": { type: "boolean", default: false },
		},
		strict: true,
	});
	const sharp = await loadSharp();

	if (values["self-test"]) {
		await runSelfTest(sharp);
		return;
	}

	const input = resolve(required(values, "input"));
	const output = resolve(required(values, "output"));
	const result = await removeGreenBackground(sharp, input, output);
	console.log(`Wrote ${output}`);
	console.log(`Key color: ${toHex(result.key)}`);
	console.log(`Transparent pixels: ${result.transparent}/${result.total}`);
	console.log(`Visible pixels: ${result.visible}/${result.total}`);
}

async function loadSharp() {
	try {
		return (await import("sharp")).default;
	} catch (error) {
		if (error?.code === "ERR_MODULE_NOT_FOUND") {
			throw new Error("The sharp dependency is missing. Run `npm install` from the CSL Agent Kit package root.");
		}
		throw error;
	}
}

function required(values, name) {
	const value = values[name];
	if (typeof value !== "string" || value.length === 0) throw new Error(`Missing --${name}`);
	return value;
}

async function removeGreenBackground(sharp, input, output) {
	if (!existsSync(input)) throw new Error(`Input image not found: ${input}`);
	if (input === output) throw new Error("Input and output paths must differ.");
	if (extname(output).toLowerCase() !== ".png") throw new Error("--output must end in .png");
	if (existsSync(output)) throw new Error(`Output already exists: ${output}`);

	const { data, info } = await sharp(input)
		.rotate()
		.toColourspace("srgb")
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	if (info.width !== info.height) throw new Error("The approved source must be square.");
	if (info.channels !== 4) throw new Error("Could not decode the source as RGBA pixels.");

	const border = sampleBorder(data, info);
	validateKey(border);
	const rgba = removeKey(data, info, border.key);
	const outputBuffer = await sharp(rgba, { raw: info })
		.resize(OUTPUT_SIZE, OUTPUT_SIZE)
		.png()
		.toBuffer();
	const result = await inspectOutput(sharp, outputBuffer);

	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, outputBuffer, { flag: "wx" });
	return { key: border.key, ...result };
}

function sampleBorder(data, { width, height, channels }) {
	const band = Math.max(1, Math.floor(Math.min(width, height) / 128));
	const red = [];
	const green = [];
	const blue = [];

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			if (x >= band && x < width - band && y >= band && y < height - band) continue;
			const offset = (y * width + x) * channels;
			red.push(data[offset]);
			green.push(data[offset + 1]);
			blue.push(data[offset + 2]);
		}
	}

	const key = [median(red), median(green), median(blue)];
	let nearKey = 0;
	for (let index = 0; index < red.length; index += 1) {
		const distance = Math.max(
			Math.abs(red[index] - key[0]),
			Math.abs(green[index] - key[1]),
			Math.abs(blue[index] - key[2]),
		);
		if (distance <= KEY_DISTANCE) nearKey += 1;
	}
	return { key, uniformRatio: nearKey / red.length };
}

function validateKey({ key, uniformRatio }) {
	const [red, green, blue] = key;
	if (green < 200 || green - Math.max(red, blue) < 160) {
		throw new Error(`The sampled border is not a pure green key (${toHex(key)}). Regenerate the source.`);
	}
	if (uniformRatio < REQUIRED_UNIFORM_BORDER) {
		throw new Error(`Only ${(uniformRatio * 100).toFixed(1)}% of border pixels match the key. Regenerate a flatter background.`);
	}
}

function removeKey(data, { width, height, channels }, key) {
	const output = Buffer.from(data);
	const keyExcess = key[1] - Math.min(key[0], key[2]);

	for (let offset = 0; offset < output.length; offset += channels) {
		const red = output[offset];
		const green = output[offset + 1];
		const blue = output[offset + 2];
		const sourceAlpha = output[offset + 3] / 255;
		const keyDistance = Math.max(
			Math.abs(red - key[0]),
			Math.abs(green - key[1]),
			Math.abs(blue - key[2]),
		);
		const otherMaximum = Math.max(red, blue);
		const greenExcess = Math.max(0, green - Math.min(red, blue));
		let matte = 1;

		if (keyDistance <= KEY_DISTANCE) {
			matte = 0;
		} else if (greenExcess > 0 && green >= otherMaximum * 0.6) {
			matte = clamp(1 - greenExcess / keyExcess, 0, 1);
			if (matte < 0.02) matte = 0;
			if (matte > 0.98) matte = 1;
		}

		const alpha = matte * sourceAlpha;
		if (alpha === 0) {
			output[offset] = 0;
			output[offset + 1] = 0;
			output[offset + 2] = 0;
			output[offset + 3] = 0;
			continue;
		}

		if (matte < 1) {
			output[offset] = unblend(red, key[0], matte);
			output[offset + 1] = unblend(green, key[1], matte);
			output[offset + 2] = unblend(blue, key[2], matte);
		}
		output[offset + 3] = Math.round(alpha * 255);
	}

	return output;
}

async function inspectOutput(sharp, buffer) {
	const metadata = await sharp(buffer).metadata();
	if (metadata.format !== "png" || metadata.width !== OUTPUT_SIZE || metadata.height !== OUTPUT_SIZE || !metadata.hasAlpha) {
		throw new Error("The transparent master failed PNG, size, or alpha validation.");
	}

	const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const total = info.width * info.height;
	let transparent = 0;
	let visible = 0;
	for (let offset = 3; offset < data.length; offset += info.channels) {
		if (data[offset] <= 8) transparent += 1;
		if (data[offset] >= 32) visible += 1;
	}
	const corners = [
		3,
		(info.width - 1) * info.channels + 3,
		(info.height - 1) * info.width * info.channels + 3,
		(total - 1) * info.channels + 3,
	];
	if (corners.some((offset) => data[offset] > 8)) throw new Error("The transparent master has an opaque corner.");
	if (transparent / total < 0.05) throw new Error("The transparent master contains too little transparent background.");
	if (visible / total < 0.01) throw new Error("The transparent master contains no usable visible subject.");
	return { total, transparent, visible };
}

async function runSelfTest(sharp) {
	const directory = mkdtempSync(join(tmpdir(), "create-app-icon-"));
	const input = join(directory, "source.png");
	const output = join(directory, "result.png");
	try {
		const subject = await sharp({
			create: { width: 128, height: 128, channels: 3, background: "#6633ff" },
		}).png().toBuffer();
		await sharp({
			create: { width: 256, height: 256, channels: 3, background: "#00ff00" },
		}).composite([{ input: subject, left: 64, top: 64 }]).png().toFile(input);
		await removeGreenBackground(sharp, input, output);
		console.log("Self-test passed: transparent 1024×1024 PNG with a visible subject.");
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

function median(values) {
	values.sort((left, right) => left - right);
	return values[Math.floor(values.length / 2)];
}

function unblend(value, key, alpha) {
	return Math.round(clamp((value - key * (1 - alpha)) / alpha, 0, 255));
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function toHex([red, green, blue]) {
	return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
