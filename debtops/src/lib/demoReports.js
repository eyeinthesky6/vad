'use strict';

const fs = require('fs');
const path = require('path');

function writeDemoReports(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'semgrep.json'), JSON.stringify({
    results: [
      {
        check_id: 'project.rule.request-guard',
        path: 'src/app/api/payments/route.ts',
        start: { line: 42 },
        extra: { severity: 'HIGH', message: 'Route mutates important state without explicit guard' }
      }
    ]
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'jscpd.json'), JSON.stringify({
    duplicates: [
      {
        format: 'typescript',
        lines: 64,
        firstFile: { name: 'src/shared/customerFormA.ts', start: 12 },
        secondFile: { name: 'src/shared/customerFormB.ts', start: 10 }
      }
    ]
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'radon_cc.txt'), [
    'src/risk/policy_manager.py',
    '    F src/risk/policy_manager.py:88:0 evaluate_policy - D (21)',
    '    M src/risk/policy_manager.py:155:4 PolicyManager.apply - C (13)'
  ].join('\n'));
  fs.writeFileSync(path.join(dir, 'coverage.xml'), [
    '<coverage line-rate="0.71">',
    '  <packages><package name="src"><classes>',
    '    <class filename="src/ledger/journal.py" line-rate="0.41"/>',
    '  </classes></package></packages>',
    '</coverage>'
  ].join('\n'));
  fs.writeFileSync(path.join(dir, 'eslint.txt'), [
    'src/components/AuthGate.tsx',
    '  11:7  error  React Hook useEffect has a missing dependency  react-hooks/exhaustive-deps'
  ].join('\n'));
  fs.writeFileSync(path.join(dir, 'npm-audit.json'), JSON.stringify({
    vulnerabilities: {
      examplepkg: { severity: 'high', fixAvailable: true }
    }
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'tool.sarif'), JSON.stringify({
    version: '2.1.0',
    runs: [
      {
        tool: { driver: { name: 'GenericScanner', rules: [{ id: 'project/rule', name: 'Project rule' }] } },
        results: [
          {
            ruleId: 'project/rule',
            level: 'warning',
            message: { text: 'Project rule matched this file' },
            locations: [{ physicalLocation: { artifactLocation: { uri: 'src/app/page.tsx' }, region: { startLine: 20 } } }]
          }
        ]
      }
    ]
  }, null, 2));
}

module.exports = { writeDemoReports };
