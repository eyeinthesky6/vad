'use strict';

const fs = require('fs');
const path = require('path');
const {
  parseSemgrepJson,
  parseSarifJson,
  parseJscpdJson,
  parseRadonCc,
  parseCoverageXml,
  parseEslintText,
  parseTscText,
  parseNpmAuditJson,
  parseGenericText
} = require('./parsers');

const DEFAULT_REPORTS_DIR = 'reports';

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch (_) { return null; }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out.sort();
}

function parseReportFile(filePath, options = {}) {
  const text = safeRead(filePath);
  if (text === null) return [];
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.endsWith('.sarif') || normalized.endsWith('.sarif.json')) return parseSarifJson(text);
  if (normalized.includes('semgrep') && normalized.endsWith('.json')) return parseSemgrepJson(text);
  if (normalized.includes('jscpd') && normalized.endsWith('.json')) return parseJscpdJson(text);
  if (normalized.includes('npm-audit') || normalized.includes('npm_audit') || normalized.includes('audit.json')) return parseNpmAuditJson(text);
  if (normalized.includes('radon') && normalized.includes('cc')) return parseRadonCc(text);
  if (normalized.includes('coverage') && normalized.endsWith('.xml')) return parseCoverageXml(text, options.coverageThreshold);
  if (normalized.includes('eslint')) return parseEslintText(text);
  if (normalized.includes('tsc') || normalized.includes('typescript')) return parseTscText(text);
  if (normalized.endsWith('.txt') || normalized.endsWith('.log')) return parseGenericText(text, path.basename(filePath));
  return [];
}

function collectFindings(opts = {}) {
  const reportsDir = path.resolve(opts.reportsDir || DEFAULT_REPORTS_DIR);
  const files = listFiles(reportsDir);
  const findings = [];
  for (const file of files) findings.push(...parseReportFile(file, opts));
  return { findings, files, reportsDir };
}

module.exports = { collectFindings, parseReportFile, listFiles };
