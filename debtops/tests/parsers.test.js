'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseSemgrepJson,
  parseSarifJson,
  parseJscpdJson,
  parseRadonCc,
  parseCoverageXml,
  parseEslintText,
  parseTscText,
  parseNpmAuditJson
} = require('../src/lib/parsers');
const { rankPackets } = require('../src/lib/triage');
const { parseCodeowners, inferOwner } = require('../src/lib/owners');

test('parses semgrep json', () => {
  const findings = parseSemgrepJson(JSON.stringify({
    results: [{
      path: 'src/a.ts',
      start: { line: 3 },
      check_id: 'x.y',
      extra: { severity: 'HIGH', message: 'route finding' }
    }]
  }));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'security');
  assert.equal(findings[0].file, 'src/a.ts');
});

test('parses sarif json', () => {
  const findings = parseSarifJson(JSON.stringify({
    runs: [{
      tool: { driver: { name: 'GenericScanner', rules: [{ id: 'rule/a', name: 'Rule A' }] } },
      results: [{
        ruleId: 'rule/a',
        level: 'warning',
        message: { text: 'rule matched' },
        locations: [{ physicalLocation: { artifactLocation: { uri: 'src/a.ts' }, region: { startLine: 8 } } }]
      }]
    }]
  }));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].tool, 'GenericScanner');
  assert.equal(findings[0].file, 'src/a.ts');
});

test('parses jscpd duplicates', () => {
  const findings = parseJscpdJson(JSON.stringify({
    duplicates: [{
      lines: 50,
      firstFile: { name: 'src/a.ts' },
      secondFile: { name: 'src/b.ts' }
    }]
  }));
  assert.equal(findings.length, 2);
  assert.equal(findings[0].kind, 'duplication');
});

test('parses radon complexity', () => {
  const findings = parseRadonCc('    F src/risk.py:10:0 run - D (19)');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'complexity');
});

test('parses coverage xml below threshold', () => {
  const findings = parseCoverageXml('<class filename="src/x.py" line-rate="0.32"/>', 0.7);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'coverage');
});

test('parses eslint stylish, eslint json, tsc, and npm audit', () => {
  assert.equal(parseEslintText('src/a.ts\n  1:2  error  nope  no-rule').length, 1);
  assert.equal(parseEslintText(JSON.stringify([{ filePath: 'src/a.ts', messages: [{ line: 1, severity: 2, message: 'nope', ruleId: 'x' }] }])).length, 1);
  assert.equal(parseTscText('src/a.ts(1,2): error TS2322: Type mismatch').length, 1);
  assert.equal(parseNpmAuditJson(JSON.stringify({ vulnerabilities: { examplepkg: { severity: 'high', fixAvailable: true } } })).length, 1);
});

test('ranks packets by grouped file risk', () => {
  const packets = rankPackets([
    { tool: 'semgrep', kind: 'security', file: 'src/app/api/payments/route.ts', title: 'route finding', rawScore: 8 },
    { tool: 'coverage', kind: 'coverage', file: 'tests/helper.ts', title: 'low', rawScore: 2 }
  ]);
  assert.equal(packets[0].file, 'src/app/api/payments/route.ts');
  assert.equal(packets[0].risk, 'high');
});

test('infers owner from CODEOWNERS rules', () => {
  const rules = parseCodeowners('src/app/** @app-team\nsrc/risk/** @risk-team');
  assert.equal(inferOwner('src/app/page.tsx', rules), '@app-team');
  assert.equal(inferOwner('src/risk/policy.py', rules), '@risk-team');
  assert.equal(inferOwner('README.md', rules, '@fallback'), '@fallback');
});
