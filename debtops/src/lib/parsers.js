'use strict';

const pathLike = /(?:[A-Za-z]:\\\\)?[\w./\\\\-]+\.(?:js|jsx|ts|tsx|py|json|yml|yaml|go|rs|java|rb|php)/g;

function normalizePath(input) {
  if (!input) return 'unknown';
  return String(input).replace(/\\\\/g, '/').replace(/^\.\//, '');
}

function addFinding(findings, finding) {
  if (!finding || !finding.file) return;
  findings.push({
    tool: finding.tool || 'unknown',
    kind: finding.kind || 'code-quality',
    file: normalizePath(finding.file),
    line: finding.line || null,
    title: finding.title || finding.message || 'Code debt finding',
    message: finding.message || finding.title || '',
    severity: finding.severity || 'medium',
    rawScore: Number.isFinite(finding.rawScore) ? finding.rawScore : 1,
    evidence: finding.evidence || ''
  });
}

function parseSemgrepJson(text) {
  const findings = [];
  if (!text || !text.trim()) return findings;
  let data;
  try { data = JSON.parse(text); } catch (_) { return findings; }
  for (const item of data.results || []) {
    const extra = item.extra || {};
    addFinding(findings, {
      tool: 'semgrep',
      kind: 'security',
      file: item.path,
      line: item.start && item.start.line,
      title: extra.message || item.check_id || 'Semgrep finding',
      message: extra.message || item.check_id || '',
      severity: String(extra.severity || 'medium').toLowerCase(),
      rawScore: severityWeight(extra.severity || 'medium') + 2,
      evidence: item.check_id || ''
    });
  }
  return findings;
}

function parseJscpdJson(text) {
  const findings = [];
  if (!text || !text.trim()) return findings;
  let data;
  try { data = JSON.parse(text); } catch (_) { return findings; }
  const duplicates = data.duplicates || data.clones || [];
  for (const clone of duplicates) {
    const first = clone.firstFile || clone.first || clone.a || {};
    const second = clone.secondFile || clone.second || clone.b || {};
    const lines = clone.lines || clone.duplicationAStart || 0;
    for (const fileObj of [first, second]) {
      const file = fileObj.name || fileObj.path || fileObj.sourceId;
      if (!file) continue;
      addFinding(findings, {
        tool: 'jscpd',
        kind: 'duplication',
        file,
        line: fileObj.start || (fileObj.startLoc && fileObj.startLoc.line) || null,
        title: 'Duplicate code clone detected',
        message: `Duplicate code clone${lines ? ` around ${lines} lines` : ''}`,
        severity: Number(lines) > 80 ? 'high' : 'medium',
        rawScore: Math.max(2, Math.min(8, Math.ceil(Number(lines || 20) / 20))),
        evidence: clone.format || ''
      });
    }
  }
  return findings;
}

function parseRadonCc(text) {
  const findings = [];
  if (!text) return findings;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*[A-Z]\s+(.+?\.py):(\d+):\d+\s+(\w+)\s+-\s+([A-F])\s+\((\d+)\)/);
    if (!match) continue;
    const file = match[1];
    const lineNo = Number(match[2]);
    const name = match[3];
    const grade = match[4];
    const cc = Number(match[5]);
    if (cc < 8) continue;
    addFinding(findings, {
      tool: 'radon',
      kind: 'complexity',
      file,
      line: lineNo,
      title: `High complexity in ${name}`,
      message: `Cyclomatic complexity ${cc} (${grade})`,
      severity: cc >= 15 ? 'high' : 'medium',
      rawScore: Math.min(10, Math.ceil(cc / 2)),
      evidence: line.trim()
    });
  }
  return findings;
}

function parseCoverageXml(text, threshold = 0.7) {
  const findings = [];
  if (!text) return findings;
  const classRegex = /<class\b[^>]*filename="([^"]+)"[^>]*line-rate="([^"]+)"[^>]*>/g;
  let match;
  while ((match = classRegex.exec(text)) !== null) {
    const file = match[1];
    const rate = Number(match[2]);
    if (Number.isFinite(rate) && rate < threshold) {
      const percent = Math.round(rate * 100);
      addFinding(findings, {
        tool: 'coverage',
        kind: 'coverage',
        file,
        title: `Low test coverage (${percent}%)`,
        message: `Coverage is ${percent}%, below ${Math.round(threshold * 100)}% threshold`,
        severity: rate < 0.4 ? 'high' : 'medium',
        rawScore: Math.ceil((threshold - rate) * 10),
        evidence: `line-rate=${rate}`
      });
    }
  }
  return findings;
}

function parseEslintText(text) {
  const findings = [];
  if (!text) return findings;
  const lines = text.split(/\r?\n/);
  let currentFile = null;
  for (const line of lines) {
    const fileOnly = line.trim().match(/^(.+\.(?:js|jsx|ts|tsx))$/);
    if (fileOnly && !line.includes(':')) {
      currentFile = fileOnly[1];
      continue;
    }
    const stylish = line.match(/^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([@\w/-]+)$/);
    if (stylish && currentFile) {
      addFinding(findings, {
        tool: 'eslint',
        kind: 'lint',
        file: currentFile,
        line: Number(stylish[1]),
        title: stylish[4].trim(),
        message: `${stylish[3]} ${stylish[5]}`,
        severity: stylish[3] === 'error' ? 'high' : 'medium',
        rawScore: stylish[3] === 'error' ? 4 : 2,
        evidence: line.trim()
      });
      continue;
    }
    const compact = line.match(/^(.+\.(?:js|jsx|ts|tsx)):(\d+):(\d+):\s+(error|warning)\s+(.+?)\s+([@\w/-]+)$/);
    if (compact) {
      addFinding(findings, {
        tool: 'eslint',
        kind: 'lint',
        file: compact[1],
        line: Number(compact[2]),
        title: compact[5].trim(),
        message: `${compact[4]} ${compact[6]}`,
        severity: compact[4] === 'error' ? 'high' : 'medium',
        rawScore: compact[4] === 'error' ? 4 : 2,
        evidence: line.trim()
      });
    }
  }
  return findings;
}

function parseTscText(text) {
  const findings = [];
  if (!text) return findings;
  const regex = /(.+\.(?:ts|tsx))\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    addFinding(findings, {
      tool: 'tsc',
      kind: 'typecheck',
      file: match[1],
      line: Number(match[2]),
      title: `${match[4]} ${match[5]}`,
      message: match[5],
      severity: 'high',
      rawScore: 5,
      evidence: match[0]
    });
  }
  return findings;
}

function parseGenericText(text, tool = 'generic') {
  const findings = [];
  if (!text) return findings;
  const files = new Set(text.match(pathLike) || []);
  for (const file of files) {
    addFinding(findings, {
      tool,
      kind: 'generic',
      file,
      title: 'Referenced in report output',
      message: 'File appeared in report output but no parser-specific finding was extracted',
      severity: 'low',
      rawScore: 1,
      evidence: ''
    });
  }
  return findings;
}

function severityWeight(severity) {
  const s = String(severity || '').toLowerCase();
  if (['critical', 'error'].includes(s)) return 9;
  if (['high'].includes(s)) return 7;
  if (['warning', 'medium', 'moderate'].includes(s)) return 4;
  if (['info', 'low'].includes(s)) return 2;
  return 3;
}

module.exports = {
  normalizePath,
  parseSemgrepJson,
  parseJscpdJson,
  parseRadonCc,
  parseCoverageXml,
  parseEslintText,
  parseTscText,
  parseGenericText,
  severityWeight
};
