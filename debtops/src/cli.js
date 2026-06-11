#!/usr/bin/env node
'use strict';

const path = require('path');
const { collectFindings } = require('./lib/collect');
const { rankPackets } = require('./lib/triage');
const { writeAuditOutput } = require('./lib/writeOutput');
const { writeDemoReports } = require('./lib/demoReports');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(token);
  }
  return args;
}

function printHelp() {
  console.log(`DebtOps - turn audit noise into safe fix packets

Usage:
  debtops audit --reports reports --out docs/audit/debtops
  debtops demo

Options:
  --reports <dir>      Directory containing semgrep/jscpd/radon/coverage/eslint/tsc outputs
  --out <dir>          Output directory root
  --limit <n>          Number of fix packets to generate (default: 20)
  --coverage <0-1>     Coverage threshold for coverage.xml (default: 0.70)
`);
}

function runAudit(options = {}) {
  const reportsDir = options.reports || 'reports';
  const outDir = options.out || undefined;
  const limit = Number(options.limit || 20);
  const coverageThreshold = Number(options.coverage || 0.7);
  const collected = collectFindings({ reportsDir, coverageThreshold });
  const packets = rankPackets(collected.findings, limit);
  const meta = {
    date: new Date().toISOString(),
    reportsDir: collected.reportsDir,
    reportFiles: collected.files.map(file => path.relative(process.cwd(), file)),
    findingsCount: collected.findings.length
  };
  const output = writeAuditOutput(packets, meta, { outDir });
  console.log(`DebtOps parsed ${collected.findings.length} findings from ${collected.files.length} report files.`);
  console.log(`Generated ${packets.length} fix packets.`);
  console.log(`Summary: ${path.relative(process.cwd(), output.summaryPath)}`);
  return { packets, output, meta };
}

function runDemo() {
  const demoDir = path.join('examples', 'reports');
  writeDemoReports(demoDir);
  return runAudit({ reports: demoDir, out: path.join('docs', 'audit', 'debtops-demo'), limit: 10 });
}

function main() {
  const args = parseArgs(process.argv);
  const command = args._[0] || 'audit';
  if (args.help || args.h) return printHelp();
  if (command === 'audit') return runAudit(args);
  if (command === 'demo') return runDemo();
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { parseArgs, runAudit, runDemo };
