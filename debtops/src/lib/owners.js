'use strict';

const fs = require('fs');
const path = require('path');

const CODEOWNERS_CANDIDATES = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

function loadCodeowners(cwd = process.cwd()) {
  for (const relative of CODEOWNERS_CANDIDATES) {
    const full = path.join(cwd, relative);
    if (!fs.existsSync(full)) continue;
    return parseCodeowners(fs.readFileSync(full, 'utf8'));
  }
  return [];
}

function parseCodeowners(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split(/\s+/))
    .filter(parts => parts.length >= 2)
    .map(([pattern, ...owners]) => ({ pattern, owners }));
}

function inferOwner(file, rules = [], fallback = '@unassigned') {
  const normalized = String(file || '').replace(/\\/g, '/');
  let owner = fallback;
  for (const rule of rules) {
    if (matchesCodeownerPattern(normalized, rule.pattern)) owner = rule.owners.join(', ');
  }
  return owner;
}

function applyOwners(packets, rules, fallback) {
  return packets.map(packet => ({ ...packet, owner: inferOwner(packet.file, rules, fallback) }));
}

function matchesCodeownerPattern(file, pattern) {
  if (!pattern) return false;
  let p = pattern.replace(/\\/g, '/');
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p += '**';
  const regex = globToRegex(p);
  return regex.test(file) || regex.test('/' + file);
}

function globToRegex(glob) {
  let out = '^';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    const next = glob[i + 1];
    if (char === '*' && next === '*') {
      out += '.*';
      i++;
    } else if (char === '*') {
      out += '[^/]*';
    } else if (char === '?') {
      out += '.';
    } else {
      out += escapeRegex(char);
    }
  }
  out += '$';
  return new RegExp(out);
}

function escapeRegex(char) {
  return /[|\\{}()[\]^$+*?.]/.test(char) ? `\\${char}` : char;
}

module.exports = { loadCodeowners, parseCodeowners, inferOwner, applyOwners, matchesCodeownerPattern };
