'use strict';

const fs = require('fs');
const path = require('path');
const { renderSummary, renderFixPacket, renderIssue, renderHtmlReport } = require('./render');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAuditOutput(packets, meta, opts = {}) {
  const stamp = opts.stamp || new Date().toISOString().replace(/[:.]/g, '-');
  const outRoot = path.resolve(opts.outDir || path.join('docs', 'audit', 'debtops', stamp));
  const packetDir = path.join(outRoot, 'fix-packets');
  const issueDir = path.join(outRoot, 'issues');
  ensureDir(packetDir);
  ensureDir(issueDir);

  fs.writeFileSync(path.join(outRoot, 'summary.md'), renderSummary(packets, meta), 'utf8');
  fs.writeFileSync(path.join(outRoot, 'report.html'), renderHtmlReport(packets, meta), 'utf8');

  const ghCommands = ['#!/usr/bin/env bash', 'set -euo pipefail', '']; 
  packets.forEach((packet, index) => {
    const rank = index + 1;
    const rendered = renderFixPacket(packet, rank);
    fs.writeFileSync(path.join(packetDir, rendered.filename), rendered.content, 'utf8');

    const issue = renderIssue(packet, rank, opts.issueLabels || []);
    const issueFile = `${rendered.filename.replace(/\.md$/, '')}.issue.md`;
    fs.writeFileSync(path.join(issueDir, issueFile), issue.body, 'utf8');
    const labels = issue.labels && issue.labels.length ? ` --label ${shellQuote(issue.labels.join(','))}` : '';
    ghCommands.push(`gh issue create --title ${shellQuote(issue.title)} --body-file ${shellQuote(path.join('issues', issueFile))}${labels}`);
  });

  fs.writeFileSync(path.join(outRoot, 'create-github-issues.sh'), ghCommands.join('\n') + '\n', 'utf8');
  fs.writeFileSync(path.join(outRoot, 'findings.json'), JSON.stringify({ meta, packets }, null, 2), 'utf8');
  return {
    outRoot,
    packetDir,
    issueDir,
    summaryPath: path.join(outRoot, 'summary.md'),
    htmlPath: path.join(outRoot, 'report.html'),
    issueScriptPath: path.join(outRoot, 'create-github-issues.sh')
  };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

module.exports = { writeAuditOutput };
