"use strict";

const TITLE = "近期上下文";
const SUMMARY = "最近7个UTC自然日的用户意图与必要背景；不是执行授权。";
const DAYS = 7;
function window(now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  const first = new Date(Date.parse(`${today}T00:00:00Z`) - (DAYS - 1) * 86400000).toISOString().slice(0, 10);
  return { first, today };
}
function day(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value ? value.slice(0, 10) : null;
}
function filter(body, now = Date.now()) {
  const { first, today } = window(now);
  return body.split(/\r?\n/).filter(line => {
    const match = /^- \[(\d{4}-\d{2}-\d{2})\] \S/.exec(line);
    if (!match) return false;
    const date = new Date(`${match[1]}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === match[1] && match[1] >= first && match[1] <= today;
  }).join("\n");
}
function matches(entry) { return entry.id === "temp" && !entry.legacy && entry.title === TITLE && entry.summary === SUMMARY; }
function kind(entry, scope) {
  if (scope !== "project") return null;
  return ["context", "lessons"].includes(entry.id) ? entry.id : matches(entry) ? "temp" : null;
}
module.exports = { TITLE, SUMMARY, DAYS, window, day, filter, matches, kind };
