'use strict';

const PATH_WEIGHTS = [
  [/src\/app|pages|routes|api/i, 3],
  [/auth|payment|billing|broker|order|trade|risk|ledger|security|policy/i, 4],
  [/test|spec|fixture|mock|demo|example/i, -2],
  [/node_modules|dist|build|coverage|\.next/i, -5]
];

const KIND_WEIGHTS = {
  security: 8,
  typecheck: 6,
  lint: 3,
  complexity: 5,
  duplication: 4,
  coverage: 4,
  generic: 1
};

const KIND_FIX = {
  security: 'tighten validation or remove risky pattern',
  typecheck: 'restore contract/type boundary',
  lint: 'fix rule violation without changing behavior',
  complexity: 'extract helper and reduce branch nesting',
  duplication: 'centralize shared logic and replace clones',
  coverage: 'add focused tests for boundary and error paths',
  generic: 'inspect report and isolate actionable issue'
};

function pathWeight(file) {
  return PATH_WEIGHTS.reduce((sum, [regex, weight]) => sum + (regex.test(file) ? weight : 0), 0);
}

function groupFindings(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    const key = finding.file;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(finding);
  }
  return [...grouped.entries()].map(([file, items]) => makePacket(file, items));
}

function makePacket(file, findings) {
  const tools = unique(findings.map(f => f.tool));
  const kinds = unique(findings.map(f => f.kind));
  const top = [...findings].sort((a, b) => scoreFinding(b) - scoreFinding(a))[0];
  const score = Math.round(findings.reduce((sum, f) => sum + scoreFinding(f), 0) + pathWeight(file));
  const risk = score >= 18 ? 'high' : score >= 9 ? 'medium' : 'low';
  const primaryKind = top.kind;
  return {
    file,
    score,
    risk,
    tools,
    kinds,
    primaryKind,
    title: buildTitle(file, findings, top),
    fixSummary: KIND_FIX[primaryKind] || KIND_FIX.generic,
    acceptance: buildAcceptance(primaryKind, file),
    findings: findings.sort((a, b) => scoreFinding(b) - scoreFinding(a))
  };
}

function scoreFinding(finding) {
  return (KIND_WEIGHTS[finding.kind] || 1) + (finding.rawScore || 1);
}

function buildTitle(file, findings, top) {
  const more = findings.length > 1 ? ` + ${findings.length - 1} related` : '';
  return `${top.title}${more}`;
}

function buildAcceptance(kind, file) {
  const generic = [
    'Existing tests pass',
    'No unrelated files changed',
    `Fix is limited to ${file} or directly shared helper files`
  ];
  const byKind = {
    security: ['Semgrep finding is gone or marked not-applicable with rationale'],
    typecheck: ['TypeScript/typecheck error count decreases for this file'],
    lint: ['ESLint is clean for this file'],
    complexity: ['Max function complexity in this file is reduced or justified'],
    duplication: ['Duplicate clone group is removed from jscpd output'],
    coverage: ['File coverage improves or missing branch is explicitly tested'],
    generic: ['Report output is re-run and this file is no longer a top offender']
  };
  return [...(byKind[kind] || byKind.generic), ...generic];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function rankPackets(findings, limit = 20) {
  return groupFindings(findings)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .slice(0, limit);
}

module.exports = { rankPackets, groupFindings, scoreFinding };
