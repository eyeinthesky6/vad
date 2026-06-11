#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { collectFindings } = require('./lib/collect');
const { rankPackets } = require('./lib/triage');
const { writeAuditOutput } = require('./lib/writeOutput');
const { writeDemoReports } = require('./lib/demoReports');
const { loadConfig, DEFAULT_CONFIG } = require('./lib/config');
const { loadCodeowners, applyOwners } = require('./lib/owners');

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
  debtops init

Options:
  --config <file>      Optional config path; defaults to debtops.config.json or .debtopsrc.json
  --reports <dir>      Directory containing semgrep/jscpd/radon/coverage/eslint/tsc/sarif outputs
  --out <dir>          Output directory root
  --limit <n>          Number of fix packets to generate
  --coverage <0-1>     Coverage threshold for coverage.xml
  --no-owners          Skip CODEOWNERS owner inference
`);
}

function runAudit(options = {}) {
  const config = loadConfig(process.cwd(), options.config);
  const reportsDir = options.reports || config.reportsDir;
  const outDir = options.out || config.outputDir;
  const limit = Number(options.limit || config.limit || 20);
  const coverageThreshold = Number(options.coverage || config.coverageThreshold || 0.7);
  const collected = collectFindings({ reportsDir, coverageThreshold });
  let packets = rankPackets(collected.findings, limit, config);
  if (!options['no-owners']) {
    packets = applyOwners(packets, loadCodeowners(process.cwd()), config.defaultOwner);
  }
  const meta = {
    date: new Date().toISOString(),
    reportsDir: collected.reportsDir,
    reportFiles: collected.files.map(file => path.relative(process.cwd(), file)),
    findingsCount: collected.findings.length,
    config: { limit, coverageThreshold }
  };
  const output = writeAuditOutput(packets, meta, { outDir, issueLabels: config.issueLabels });
  console.log(`DebtOps parsed ${collected.findings.length} findings from ${collected.files.length} report files.`);
  console.log(`Generated ${packets.length} fix packets.`);
  console.log(`Summary: ${path.relative(process.cwd(), output.summaryPath)}`);
  console.log(`HTML: ${path.relative(process.cwd(), output.htmlPath)}`);
  console.log(`GitHub issue script: ${path.relative(process.cwd(), output.issueScriptPath)}`);
  return { packets, output, meta };
}

function runDemo() {
  const demoDir = path.join('examples', 'reports');
  writeDemoReports(demoDir);
  return runAudit({ reports: demoDir, out: path.join('docs', 'audit', 'debtops-demo'), limit: 10 });
}

function runInit() {
  const configPath = path.resolve('debtops.config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n', 'utf8');
    console.log(`Created ${path.relative(process.cwd(), configPath)}`);
  } else {
    console.log('debtops.config.json already exists; leaving it unchanged.');
  }
  const reportsDir = path.resolve(DEFAULT_CONFIG.reportsDir);
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log(`Ready. Put reports in ${path.relative(process.cwd(), reportsDir)} and run: node src/cli.js audit`);
}

function main() {
  const args = parseArgs(process.argv);
  const command = args._[0] || 'audit';
  if (args.help || args.h) return printHelp();
  if (command === 'audit') return runAudit(args);
  if (command === 'demo') return runDemo();
  if (command === 'init') return runInit();
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { parseArgs, runAudit, runDemo, runInit };
