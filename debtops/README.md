# DebtOps

DebtOps turns static-analysis reports into safe, reviewable fix packets for AI-built codebases.

It is for repos where the app mostly works, but the internals are drifting: duplicate flows, stale fallbacks, type errors, low coverage, complex hot paths, and report folders nobody wants to open.

## What it does

DebtOps reads common report outputs and produces a ranked cleanup queue:

- `docs/audit/debtops/<timestamp>/summary.md`
- `docs/audit/debtops/<timestamp>/fix-packets/*.md`
- `docs/audit/debtops/<timestamp>/findings.json`

Each fix packet includes the problem, why it matters, allowed changes, acceptance checks, evidence, a ready-to-paste Cursor/Codex patch prompt, and a one-line PR brief.

## Supported inputs in v0.1

Put any of these under `reports/`:

- `semgrep.json`
- `jscpd.json`
- `radon_cc.txt`
- `coverage.xml`
- `eslint.txt`
- `tsc.txt`

## Usage

This folder is currently a repo-local prototype, not an npm-published package yet.

```bash
cd debtops
node src/cli.js demo
node src/cli.js audit --reports examples/reports
```

After publishing to npm, the intended command becomes:

```bash
npx debtops audit --reports reports
```

## Example fix packet

```text
You are fixing one bounded technical-debt packet in src/auth/login.ts.
Problem: Duplicate code clone detected + 1 related
Fix summary: centralize shared logic and replace clones.
Rules:
- Make the smallest safe change.
- Preserve public API and behavior unless needed for the finding.
- Do not create new parallel implementations or fallback config paths.
- Add or adjust focused tests if the change touches behavior.
```

## Product principle

DebtOps does not try to become a full coding agent.

It converts report noise into small, bounded fix packets that a human or AI coding tool can act on safely.

## Roadmap

- GitHub issue creation from fix packets
- SARIF support
- Ownership inference via CODEOWNERS
- Dead-code and duplicate-file heuristics
- `--changed-only` mode for PRs
- HTML report

## License

MIT
