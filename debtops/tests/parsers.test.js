'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseSemgrepJson,
  parseJscpdJson,
  parseRadonCc,
  parseCoverageXml,
  parseEslintText,
  parseTscText
} = require('../src/lib/parsers');
const { rankPackets } = require('../src/lib/triage');

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

test('parses eslint stylish and tsc compact output', () => {
  assert.equal(parseEslintText('src/a.ts\n  1:2  error  nope  no-rule').length, 1);
  assert.equal(parseTscText('src/a.ts(1,2): error TS2322: Type mismatch').length, 1);
});

test('ranks packets by grouped file risk', () => {
  const packets = rankPackets([
    { tool: 'semgrep', kind: 'security', file: 'src/app/api/payments/route.ts', title: 'route finding', rawScore: 8 },
    { tool: 'coverage', kind: 'coverage', file: 'tests/helper.ts', title: 'low', rawScore: 2 }
  ]);
  assert.equal(packets[0].file, 'src/app/api/payments/route.ts');
  assert.equal(packets[0].risk, 'high');
});
