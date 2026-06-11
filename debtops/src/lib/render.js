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
  lines.push('| Rank | Risk | Score | File | Primary issue |');
  lines.push('|---:|---|---:|---|---|');
  packets.forEach((packet, index) => {
    lines.push(`| ${index + 1} | ${packet.risk} | ${packet.score} | \`${packet.file}\` | ${escapePipe(packet.title)} |`);
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
  lines.push('## Allowed changes');
  lines.push('- Keep public APIs and user-facing behavior stable unless the finding explicitly requires a change.');
  lines.push('- Prefer one small helper extraction over broad refactors.');
  lines.push('- Do not introduce new fallback paths, duplicate auth flows, or hidden config defaults.');
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

function renderPatchPrompt(packet) {
  return [
    `You are fixing one bounded technical-debt packet in ${packet.file}.`,
    `Problem: ${packet.title}`,
    `Fix summary: ${packet.fixSummary}.`,
    'Rules:',
    '- Make the smallest safe change.',
    '- Preserve public API and behavior unless needed for the finding.',
    '- Do not create new parallel implementations, fallback config paths, or duplicate owners.',
    '- Add or adjust focused tests if the change touches behavior.',
    'Acceptance:',
    ...packet.acceptance.map(item => `- ${item}`),
    'Return a concise diff summary and commands run.'
  ].join('\n');
}

function renderPrLine(packet) {
  return `PR: ${packet.file} — ${packet.fixSummary} | risk: ${packet.risk} | cmds-run: relevant audit + tests | before->after: finding count decreases | acceptance: tests & CI green`;
}

function whyItMatters(packet) {
  const map = {
    security: 'Security findings can become production incidents or compliance blockers, especially in AI-built repos where risky patterns get copied.',
    typecheck: 'Type drift makes future AI edits risky because the compiler is no longer a trustworthy guardrail.',
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

module.exports = { renderSummary, renderFixPacket, renderPatchPrompt, renderPrLine, safePacketName };
