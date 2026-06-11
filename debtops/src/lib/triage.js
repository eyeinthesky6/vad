'use strict';

const DEFAULT_PATH_WEIGHTS = [
  { pattern: 'src/app|pages|routes|api', weight: 3 },
  { pattern: 'auth|payment|billing|broker|order|trade|risk|ledger|security|policy', weight: 4 },
  { pattern: 'test|spec|fixture|mock|demo|example', weight: -2 },
  { pattern: 'node_modules|dist|build|coverage|\\.next', weight: -5 }
];

const KIND_WEIGHTS = {
  security: 8,
  typecheck: 6,
  dependency: 7,
  lint: 3,
  complexity: 5,
  duplication: 4,
  coverage: 4,
  generic: 1
};

const KIND_FIX = {
  security: 'tighten validation or remove risky pattern',
  typecheck: 'restore contract/type boundary',
  dependency: 'upgrade or pin vulnerable dependency safely',
  lint: 'fix rule violation without changing behavior',
  complexity: 'extract helper and reduce branch nesting',
  duplication: 'centralize shared logic and replace clones',
  coverage: 'add focused tests for boundary and error paths',
  generic: 'inspect report and isolate actionable issue'
};

function pathWeight(file, config = {}) {
  const weights = config.pathWeights || DEFAULT_PATH_WEIGHTS;
  return weights.reduce((sum, item) => {
    try { return sum + (new RegExp(item.pattern, 'i').test(file) ? Number(item.weight || 0) : 0); }
    catch (_) { return sum; }
  }, 0);
}

function groupFindings(findings, config = {}) {
  const grouped = new Map();
  for (const finding of findings) {
    const key = finding.file;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(finding);
  }
  return [...grouped.entries()].map(([file, items]) => makePacket(file, items, config));
}

function makePacket(file, findings, config = {}) {
  const tools = unique(findings.map(f => f.tool));
  const kinds = unique(findings.map(f => f.kind));
  const top = [...findings].sort((a, b) => scoreFinding(b) - scoreFinding(a))[0];
  const score = Math.round(findings.reduce((sum, f) => sum + scoreFinding(f), 0) + pathWeight(file, config));
  const thresholds = config.riskThresholds || { high: 18, medium: 9 };
  const risk = score >= thresholds.high ? 'high' : score >= thresholds.medium ? 'medium' : 'low';
  const primaryKind = top.kind;
  return {
    id: makeStableId(file, primaryKind),
    file,
    score,
    risk,
    tools,
    kinds,
    primaryKind,
    title: buildTitle(file, findings, top),
    fixSummary: KIND_FIX[primaryKind] || KIND_FIX.generic,
    acceptance: buildAcceptance(primaryKind, file),
    command: (config.commandsByKind && config.commandsByKind[primaryKind]) || 'rerun the source audit command for this report',
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
    security: ['Security finding is gone or marked not-applicable with rationale'],
    typecheck: ['TypeScript/typecheck error count decreases for this file'],
    dependency: ['Dependency audit no longer reports this package as a top finding'],
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

function makeStableId(file, kind) {
  return `${kind}:${file}`.toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').slice(0, 120);
}

function rankPackets(findings, limit = 20, config = {}) {
  return groupFindings(findings, config)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .slice(0, limit);
}

module.exports = { rankPackets, groupFindings, scoreFinding, pathWeight, makeStableId };
