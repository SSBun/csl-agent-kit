#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const MAX_TIPS = 20;
const MAX_TEXT_CHARS = 150;
const MAX_TOTAL_TEXT_CHARS = 2000;
const MAX_KEYWORDS = 5;
const MAX_KEYWORD_CHARS = 40;

function getDataDir() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(process.env.HOME || "", ".csl-agent-kit");
}

function resolveTipsFile(dataDir = getDataDir()) {
  const tipsDir = process.env.CSL_AGENT_KIT_TIPS_DIR || path.join(dataDir, "tips");
  return process.env.CSL_AGENT_KIT_TIPS_FILE || path.join(tipsDir, "tips.json");
}

function characterCount(value) {
  return Array.from(value).length;
}

function normalizeKeyword(keyword) {
  return keyword.toLocaleLowerCase();
}

function validateTip(value) {
  if (!value || typeof value !== "object") throw new Error("Each tip must be an object.");
  if (typeof value.text !== "string") throw new Error("Each tip text must be a string.");
  if (!value.text.trim()) throw new Error("Tip cannot be blank.");
  if (/\r|\n/.test(value.text)) throw new Error("Tip must be a single line.");
  if (characterCount(value.text) > MAX_TEXT_CHARS) {
    throw new Error(`Tip is too long (${characterCount(value.text)} characters). Keep each tip at ${MAX_TEXT_CHARS} characters or fewer; use sop-manager for longer guidance.`);
  }
  if (!Array.isArray(value.keywords) || value.keywords.length === 0) {
    throw new Error("Each tip requires at least one keyword.");
  }
  if (value.keywords.length > MAX_KEYWORDS) {
    throw new Error(`Each tip can have at most ${MAX_KEYWORDS} keywords.`);
  }

  const keywords = value.keywords.map((keyword) => {
    if (typeof keyword !== "string") throw new Error("Each keyword must be a string.");
    const trimmed = keyword.trim();
    if (!trimmed || /\r|\n/.test(trimmed)) throw new Error("Keywords must be non-empty single-line strings.");
    if (trimmed === "*") throw new Error('The "*" keyword is not supported. Use explicit prompt keywords.');
    if (characterCount(trimmed) > MAX_KEYWORD_CHARS) {
      throw new Error(`Keywords must be ${MAX_KEYWORD_CHARS} characters or fewer.`);
    }
    return trimmed;
  });

  if (new Set(keywords.map(normalizeKeyword)).size !== keywords.length) {
    throw new Error("A tip cannot contain duplicate keywords.");
  }

  return { text: value.text, keywords };
}

function validateDocument(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Tips JSON must be an object.");
  if (value.version !== 1) throw new Error("Tips JSON version must be 1.");
  if (!Array.isArray(value.tips)) throw new Error("Tips JSON must contain a tips array.");
  if (value.tips.length > MAX_TIPS) throw new Error(`Tips JSON exceeds the maximum of ${MAX_TIPS} tips.`);

  const tips = value.tips.map(validateTip);
  if (new Set(tips.map((tip) => tip.text)).size !== tips.length) throw new Error("Tips JSON contains duplicate tips.");
  const totalChars = tips.reduce((total, tip) => total + characterCount(tip.text), 0);
  if (totalChars > MAX_TOTAL_TEXT_CHARS) {
    throw new Error(`Tips JSON exceeds ${MAX_TOTAL_TEXT_CHARS.toLocaleString("en-US")} total characters.`);
  }
  return { version: 1, tips };
}

function loadDocument(tipsFile = resolveTipsFile()) {
  if (!fs.existsSync(tipsFile)) return { version: 1, tips: [] };
  try {
    return validateDocument(JSON.parse(fs.readFileSync(tipsFile, "utf8")));
  } catch (error) {
    throw new Error(`Invalid tips JSON at ${tipsFile}: ${error.message}`);
  }
}

function loadTips(tipsFile = resolveTipsFile()) {
  return loadDocument(tipsFile).tips;
}

function writeDocument(tipsFile, document) {
  const validated = validateDocument(document);
  const directory = path.dirname(tipsFile);
  const temporary = path.join(directory, `.${path.basename(tipsFile)}.${process.pid}.${Date.now()}.tmp`);
  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(validated, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, tipsFile);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function addTip(tipsFile, text, keywords) {
  const document = loadDocument(tipsFile);
  const tip = validateTip({ text, keywords });
  if (document.tips.some((item) => item.text === tip.text)) throw new Error("This tip already exists.");
  if (document.tips.length >= MAX_TIPS) {
    throw new Error(`Refusing to add a tip: the file already contains the maximum of ${MAX_TIPS} tips. Remove or consolidate an existing tip first.`);
  }
  writeDocument(tipsFile, { version: 1, tips: [...document.tips, tip] });
}

function parseLegacyTips(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => /^\s*-\s+/.test(line))
    .map((line) => line.replace(/^\s*-\s+/, ""));
}

function migrateLegacyTips({ sourceFile, destinationFile, keywordMap }) {
  if (path.resolve(sourceFile) === path.resolve(destinationFile)) {
    throw new Error("Legacy source and JSON destination must be different files.");
  }
  if (!fs.existsSync(sourceFile)) throw new Error(`Legacy tips file does not exist: ${sourceFile}`);
  if (fs.existsSync(destinationFile)) throw new Error(`Refusing to overwrite existing tips JSON: ${destinationFile}`);
  if (!keywordMap || typeof keywordMap !== "object" || Array.isArray(keywordMap)) {
    throw new Error("Migration keywords must be a JSON object keyed by the exact legacy tip text.");
  }

  const legacyTips = parseLegacyTips(fs.readFileSync(sourceFile, "utf8"));
  if (legacyTips.length === 0) throw new Error("Legacy tips file contains no tips to migrate.");
  const expectedKeys = new Set(legacyTips);
  const suppliedKeys = Object.keys(keywordMap);
  if (suppliedKeys.length !== expectedKeys.size || suppliedKeys.some((key) => !expectedKeys.has(key))) {
    throw new Error("Migration keywords must cover each legacy tip exactly once.");
  }

  const document = validateDocument({
    version: 1,
    tips: legacyTips.map((text) => ({ text, keywords: keywordMap[text] })),
  });
  const destinationDir = path.dirname(destinationFile);
  const temporary = path.join(destinationDir, `.${path.basename(destinationFile)}.${process.pid}.${Date.now()}.tmp`);
  const backupFile = `${sourceFile}.bak`;
  if (fs.existsSync(backupFile)) throw new Error(`Refusing to overwrite existing legacy backup: ${backupFile}`);

  fs.mkdirSync(destinationDir, { recursive: true });
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(sourceFile, backupFile);
    try {
      fs.renameSync(temporary, destinationFile);
    } catch (error) {
      fs.renameSync(backupFile, sourceFile);
      throw error;
    }
  } finally {
    fs.rmSync(temporary, { force: true });
  }

  return backupFile;
}

function findCandidates(prompt, tips) {
  const normalizedPrompt = String(prompt || "").toLocaleLowerCase();
  if (!normalizedPrompt) return [];
  return tips.filter((tip) => tip.keywords.some((keyword) => normalizedPrompt.includes(normalizeKeyword(keyword))));
}

function formatInstructions(tips, _tipsFile, heading) {
  if (tips.length === 0) return "";
  return [
    heading,
    ...tips.map((tip) => `- ${tip.text}`),
  ].join("\n");
}

function formatCandidates(candidates, tipsFile) {
  return formatInstructions(candidates, tipsFile, "Confirmed user instructions matching this prompt (follow unless higher-priority instructions conflict):");
}

function formatAllTips(tips, tipsFile) {
  return formatInstructions(tips, tipsFile, "Confirmed saved user instructions (follow when applicable unless higher-priority instructions conflict):");
}

module.exports = {
  MAX_KEYWORDS,
  MAX_KEYWORD_CHARS,
  MAX_TEXT_CHARS,
  MAX_TIPS,
  MAX_TOTAL_TEXT_CHARS,
  addTip,
  characterCount,
  findCandidates,
  formatAllTips,
  formatCandidates,
  loadDocument,
  loadTips,
  migrateLegacyTips,
  parseLegacyTips,
  resolveTipsFile,
  validateDocument,
  validateTip,
  writeDocument,
};
