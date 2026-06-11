'use strict';

function renderSummary(packets, meta = {}) {
  const date = meta.date || new Date().toISOString();
  const lines = [];
  lines.push('# DebtOps Triage Summary');
  lines.push('');
  lines.push(`Generated: ${date}`);
  lines.push(`Reports directory: \`${meta.reportsDir || 'reports'}\``);
  lines.push(`Findings parsed: **${meta.findingsCount || 0}**`);
  lines.push(`Fix packets generated: **${packets.length}**`);
  lines.push('');
  lines.push('## Ranked fix queue');
  lines.push('');
  lines.push('| Rank | Risk | Score | Owner | File | Primary issue |');
  lines.push('|---:|---|---:|---|---|---|');
  packets.forEach((packet, index) => {
    lines.push(`| ${index + 1} | ${packet.risk} | ${packet.score} | ${packet.owner || '@unassigned'} | \`${packet.file}\` | ${escapePipe(packet.title)} |`);
  });
  lines.push('');
  lines.push('## How to use');
  lines.push('');
  lines.push('Open a fix packet, paste its patch prompt into Cursor/Codex, then accept only small diffs that satisfy the acceptance checks.');
  return lines.join('\n');
}

function renderFixPacket(packet, rank) {
  const safeName = safePacketName(packet.file, rank);
  const lines = [];
  lines.push(`# FIX_PACKET ${rank}: ${packet.file}`);
  lines.push('');
  lines.push(`Owner: **${packet.owner || '@unassigned'}**`);
  lines.push(`Risk: **${packet.risk}**`);
  lines.push(`Score: **${packet.score}**`);
  lines.push(`Tools: ${packet.tools.join(', ') || 'unknown'}`);
  lines.push(`Primary issue: **${packet.primaryKind}**`);
  lines.push('');
  lines.push('## Problem');
  lines.push(packet.title);
  lines.push('');
  lines.push('## Why it matters');
  lines.push(whyItMatters(packet));
  lines.push('');
  lines.push('## Reproduce');
  lines.push('```bash');
  lines.push(packet.command || 'rerun the relevant audit command');
  lines.push('```');
  lines.push('');
  lines.push('## Allowed changes');
  lines.push('- Keep public APIs and user-facing behavior stable unless the finding explicitly requires a change.');
  lines.push('- Prefer one small helper extraction over broad refactors.');
  lines.push('- Do not introduce new fallback paths, duplicate flows, or hidden config defaults.');
  lines.push('- Do not delete files unless the packet explicitly says the file is dead code.');
  lines.push('');
  lines.push('## Suggested fix');
  lines.push(packet.fixSummary);
  lines.push('');
  lines.push('## Acceptance');
  for (const item of packet.acceptance) lines.push(`- ${item}`);
  lines.push('');
  lines.push('## Evidence');
  for (const finding of packet.findings.slice(0, 8)) {
    lines.push(`- [${finding.tool}/${finding.kind}] ${finding.line ? `L${finding.line}: ` : ''}${finding.message || finding.title}`);
  }
  lines.push('');
  lines.push('## Patch prompt');
  lines.push('');
  lines.push('```text');
  lines.push(renderPatchPrompt(packet));
  lines.push('```');
  lines.push('');
  lines.push('## PR one-liner');
  lines.push('');
  lines.push('```text');
  lines.push(renderPrLine(packet));
  lines.push('```');
  return { filename: `${safeName}.md`, content: lines.join('\n') };
}

function renderIssue(packet, rank, labels = []) {
  const title = `[DebtOps][${packet.risk}] ${packet.file}: ${packet.fixSummary}`;
  const body = [
    `OWNER_TICKET: file=${packet.file} | owner=${packet.owner || '@unassigned'} | reason=${packet.primaryKind} | reproduce_cmds='${packet.command || 'rerun audit'}' | fix_summary='${packet.fixSummary}' | acceptance='metrics change & tests pass' | est=1-2h`,
    '',
    `Source packet rank: ${rank}`,
    '',
    '## Acceptance',
    ...packet.acceptance.map(item => `- ${item}`),
    '',
    '## Patch prompt',
    '```text',
    renderPatchPrompt(packet),
    '```'
  ].join('\n');
  return { title, labels, body };
}

function renderPatchPrompt(packet) {
  return [
    `You are fixing one bounded technical-debt packet in ${packet.file}.`,
    `Owner: ${packet.owner || '@unassigned'}`,
    `Problem: ${packet.title}`,
    `Fix summary: ${packet.fixSummary}.`,
    'Rules:',
    '- Make the smallest safe change.',
    '- Preserve public API and behavior unless needed for the finding.',
    '- Do not create new parallel implementations, fallback config paths, or duplicate owners.',
    '- Add or adjust focused tests if the change touches behavior.',
    'Acceptance:',
    ...packet.acceptance.map(item => `- ${item}`),
    `Reproduce/check command: ${packet.command || 'rerun the relevant audit command'}`,
    'Return a concise diff summary and commands run.'
  ].join('\n');
}

function renderPrLine(packet) {
  return `PR: ${packet.file} — ${packet.fixSummary} | owner: ${packet.owner || '@unassigned'} | risk: ${packet.risk} | cmds-run: ${packet.command || 'relevant audit + tests'} | before->after: finding count decreases | acceptance: tests & CI green`;
}

function renderHtmlReport(packets, meta = {}) {
  const rows = packets.map((packet, index) => `<tr><td>${index + 1}</td><td>${esc(packet.risk)}</td><td>${packet.score}</td><td>${esc(packet.owner || '@unassigned')}</td><td><code>${esc(packet.file)}</code></td><td>${esc(packet.title)}</td></tr>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DebtOps Report</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:32px;background:#f7f7f8;color:#172033}main{max-width:1100px;margin:auto;background:white;border:1px solid #ddd;border-radius:10px;padding:24px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #eee;padding:10px;text-align:left;vertical-align:top}th{background:#fafafa}code{font-size:12px}.meta{color:#555}.risk-high{font-weight:700}</style>
</head>
<body><main>
<h1>DebtOps Triage Report</h1>
<p class="meta">Generated ${esc(meta.date || new Date().toISOString())}. Parsed ${Number(meta.findingsCount || 0)} findings.</p>
<table><thead><tr><th>#</th><th>Risk</th><th>Score</th><th>Owner</th><th>File</th><th>Issue</th></tr></thead><tbody>${rows}</tbody></table>
</main></body></html>`;
}

function whyItMatters(packet) {
  const map = {
    security: 'Security findings can become production incidents or compliance blockers, especially in AI-built repos where risky patterns get copied.',
    typecheck: 'Type drift makes future AI edits risky because the compiler is no longer a trustworthy guardrail.',
    dependency: 'Dependency vulnerabilities are usually fixable but easy to ignore until CI or production forces the issue.',
    lint: 'Lint debt often hides inconsistent imports, dead paths, and small errors that compound during AI-assisted edits.',
    complexity: 'Complex functions are where AI patches most often break behavior because too many branches share one owner.',
    duplication: 'Duplicate logic creates multiple owners for one behavior; one fix lands while the other clone silently drifts.',
    coverage: 'Untested code becomes scary to simplify, so debt survives and every patch requires guesswork.',
    generic: 'This file appeared in audit output and needs manual isolation before broader cleanup.'
  };
  return map[packet.primaryKind] || map.generic;
}

function safePacketName(file, rank) {
  const cleaned = file.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100);
  return `${String(rank).padStart(2, '0')}-${cleaned || 'unknown'}`;
}

function escapePipe(text) {
  return String(text || '').replace(/\|/g, '\\|');
}

function esc(text) {
  return String(text || '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

module.exports = { renderSummary, renderFixPacket, renderIssue, renderPatchPrompt, renderPrLine, renderHtmlReport, safePacketName };
