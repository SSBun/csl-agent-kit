"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const base = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(base, "pilot-manifest.json"), "utf8"));
const records = fs.readFileSync(path.join(base, "pilot-results.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const starts = records.filter(row => row.event === "started");
const results = records.filter(row => row.event === "finished");
assert.equal(starts.length, 36);
assert.equal(results.length, 36);
assert.equal(new Set(starts.map(row => row.id)).size, 36);
assert.deepEqual(starts.map(row => row.id), manifest.schedule.map(row => row.id));
assert.deepEqual(results.map(row => row.id), starts.map(row => row.id));
const digest = crypto.createHash("sha256").update(fs.readFileSync(path.join(base, "pilot-manifest.json"))).digest("hex");
for (const row of starts) assert.equal(row.manifestHash, digest);
for (const row of results) {
  const gold = manifest.scales.find(scale => scale.size === row.size).cases.find(item => item.id === row.caseId);
  const answer = JSON.parse(row.text);
  assert.equal(row.status, "completed");
  assert.deepEqual(answer.answer, gold.answer);
  assert.deepEqual([...answer.sources].sort(), [...gold.sources].sort());
  assert.equal(answer.abstain, gold.answer === null);
  assert.equal(row.grade.success, true);
  assert.equal(row.toolsUsed, row.trace.length);
  assert.ok(row.trace.every(call => ["read", "grep", "find"].includes(call.tool) && !call.error));
  assert.ok(row.trace.every(call => !path.isAbsolute(call.args.path || ".") && !(call.args.path || ".").split("/").includes("..")));
  assert.equal(row.usage.totalTokens, row.usage.input + row.usage.output + row.usage.cacheRead + row.usage.cacheWrite);
}
const median = values => { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
const summarize = rows => {
  const sum = get => rows.reduce((total, row) => total + get(row), 0);
  const success = rows.filter(row => row.grade.success).length;
  const totalTokens = sum(row => row.usage.totalTokens);
  const times = rows.map(row => row.milliseconds).sort((a, b) => a - b);
  return { requests: rows.length, success, totalTokens, meanTokens: totalTokens / rows.length, tokensPerSuccess: totalTokens / success, input: sum(row => row.usage.input), output: sum(row => row.usage.output), cacheRead: sum(row => row.usage.cacheRead), toolCalls: sum(row => row.toolsUsed), toolBytes: sum(row => row.trace.reduce((n, call) => n + call.bytes, 0)), medianSeconds: median(times) / 1000, p95Seconds: times[Math.ceil(times.length * .95) - 1] / 1000, summedSeconds: sum(row => row.milliseconds) / 1000, catalogUSD: sum(row => row.usage.catalogUSD) };
};
const byMethod = Object.fromEntries(["A", "B"].map(method => [method, summarize(results.filter(row => row.method === method))]));
const byScale = Object.fromEntries([50, 200, 1000].map(size => [size, Object.fromEntries(["A", "B"].map(method => [method, summarize(results.filter(row => row.method === method && row.size === size))]))]));
const pairs = manifest.schedule.filter(item => item.method === "A").map(item => ({ size: item.size, caseId: item.caseId, A: results.find(row => row.id === item.id), B: results.find(row => row.id === `${item.size}-${item.caseId}-B`) }));
const byCategory = Object.fromEntries([...new Set(pairs.map(pair => pair.caseId))].map(id => [id, Object.fromEntries(["A", "B"].map(method => [method, summarize(results.filter(row => row.caseId === id && row.method === method))]))]));
const categories = Object.keys(byCategory);
let seed = 73119;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const ratios = [];
for (let sample = 0; sample < 10000; sample++) {
  let a = 0, b = 0;
  for (let i = 0; i < categories.length; i++) {
    const category = categories[Math.floor(random() * categories.length)];
    a += byCategory[category].A.totalTokens; b += byCategory[category].B.totalTokens;
  }
  ratios.push(a / b);
}
ratios.sort((a, b) => a - b);
const costs = byMethod.A.catalogUSD + byMethod.B.catalogUSD;
const report = {
  schema: "memory-index-pilot-analysis/v1", checks: "36个唯一请求及配对顺序、冻结hash、全部答案与来源、工具访问路径和token算术已重新核对", manifestSHA256: digest,
  byMethod, byScale, byCategory,
  paired: pairs.map(pair => ({ size: pair.size, caseId: pair.caseId, tokenRatioAOverB: pair.A.usage.totalTokens / pair.B.usage.totalTokens, timeDifferenceSecondsAminusB: (pair.A.milliseconds - pair.B.milliseconds) / 1000 })),
  exploratoryClusterBootstrap: { unit: "六个问题模板；每次重采样保留同题三个规模", iterations: 10000, tokenRatioAOverB: byMethod.A.totalTokens / byMethod.B.totalTokens, interval95: [ratios[249], ratios[9749]], limitation: "仅六个模板，区间仅描述当前试跑；全成功不能证明总体质量等价或非劣。" },
  catalogEstimate: { pilotUSD: costs, projected432USD: costs * 12, projectionBasis: "仅按相同规模/难度/缓存分布线性外推；不是报价、费用保证或订阅实际账单。", stopThresholdUSD: manifest.config.catalogStopUSD },
  statisticsCorrection: "冻结pilot.cjs的初步report使用偶数样本的上中位数。此分析独立从原始记录以中间两值均值计算标准中位数，原始记录与冻结运行器未改动；正式报告以本文件为准。",
  limitations: ["单模型、每题每规模单次；没有进行正式432次实验。", "语义题仍包含精确对象名，覆盖的是表达变化，不代表无关键词的困难语义召回。", "所有请求成功，无法由本试跑估计困难样本质量差异。", "两组可自由搜索，但实际均先read索引；未比较强制或明确提示search-first的完整索引策略。", "未评估生产首页注入，也没有后台写入或真实用户数据。", "thinking固定medium；SDK reasoning字段均为0，仅表示返回值，不证明服务端没有推理开销。", "耗时包含服务端与网络抖动，p95基于每组18次，精度有限。", "没有隐藏推理正文被写入实验产物。"]
};
fs.writeFileSync(path.join(base, "analysis.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ checks: report.checks, byMethod, byScale, exploratoryClusterBootstrap: report.exploratoryClusterBootstrap, catalogEstimate: report.catalogEstimate }, null, 2));
