'use strict';

const fs = require('fs');
const path = require('path');
const { renderSummary, renderFixPacket } = require('./render');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAuditOutput(packets, meta, opts = {}) {
  const stamp = opts.stamp || new Date().toISOString().replace(/[:.]/g, '-');
  const outRoot = path.resolve(opts.outDir || path.join('docs', 'audit', 'debtops', stamp));
  const packetDir = path.join(outRoot, 'fix-packets');
  ensureDir(packetDir);

  fs.writeFileSync(path.join(outRoot, 'summary.md'), renderSummary(packets, meta), 'utf8');
  packets.forEach((packet, index) => {
    const rendered = renderFixPacket(packet, index + 1);
    fs.writeFileSync(path.join(packetDir, rendered.filename), rendered.content, 'utf8');
  });
  fs.writeFileSync(path.join(outRoot, 'findings.json'), JSON.stringify({ meta, packets }, null, 2), 'utf8');
  return { outRoot, packetDir, summaryPath: path.join(outRoot, 'summary.md') };
}

module.exports = { writeAuditOutput };
