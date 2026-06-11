'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  reportsDir: 'reports',
  outputDir: 'docs/audit/debtops',
  limit: 20,
  coverageThreshold: 0.7,
  riskThresholds: { high: 18, medium: 9 },
  pathWeights: [
    { pattern: 'src/app|pages|routes|api', weight: 3 },
    { pattern: 'auth|payment|billing|broker|order|trade|risk|ledger|security|policy', weight: 4 },
    { pattern: 'test|spec|fixture|mock|demo|example', weight: -2 },
    { pattern: 'node_modules|dist|build|coverage|\\.next', weight: -5 }
  ],
  issueLabels: ['debtops', 'technical-debt'],
  defaultOwner: '@unassigned',
  commandsByKind: {
    security: 'semgrep --config auto --json --output reports/semgrep.json',
    typecheck: 'npx tsc --noEmit > reports/tsc.txt',
    lint: 'npx eslint . > reports/eslint.txt',
    complexity: 'radon cc -s -a src > reports/radon_cc.txt',
    duplication: 'jscpd --reporters json --output reports',
    coverage: 'pytest --cov=src --cov-report xml:reports/coverage.xml',
    dependency: 'npm audit --json > reports/npm-audit.json',
    generic: 'rerun the source audit command for this report'
  }
};

function loadConfig(cwd = process.cwd(), explicitPath) {
  const candidates = explicitPath
    ? [path.resolve(cwd, explicitPath)]
    : ['debtops.config.json', '.debtopsrc.json'].map(name => path.join(cwd, name));
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    try {
      return deepMerge(DEFAULT_CONFIG, JSON.parse(raw));
    } catch (error) {
      throw new Error(`Could not parse DebtOps config at ${file}: ${error.message}`);
    }
  }
  return { ...DEFAULT_CONFIG };
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

module.exports = { DEFAULT_CONFIG, loadConfig, deepMerge };
