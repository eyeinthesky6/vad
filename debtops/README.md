# DebtOps

DebtOps turns static-analysis reports into owner-routed, reviewable fix packets for AI-built codebases.

It is for repos where the app mostly works, but the internals are drifting: duplicate flows, stale fallbacks, type errors, dependency alerts, low coverage, complex hot paths, and report folders nobody wants to open.

## What it does

DebtOps reads common report outputs and produces a ranked cleanup queue:

- `summary.md`
- `report.html`
- `fix-packets/*.md`
- `issues/*.issue.md`
- `create-github-issues.sh`
- `findings.json`

Each fix packet includes the owner, problem, why it matters, reproduce command, allowed changes, acceptance checks, evidence, a ready-to-paste Cursor/Codex patch prompt, and a one-line PR brief.

## Supported inputs

Put any of these under `reports/`:

- `semgrep.json`
- `*.sarif` or `*.sarif.json`
- `jscpd.json`
- `radon_cc.txt`
- `coverage.xml`
- `eslint.txt` or ESLint JSON output
- `tsc.txt`
- `npm-audit.json`

## Usage

This folder is currently a repo-local prototype, not an npm-published package yet.

```bash
cd debtops
node src/cli.js init
node src/cli.js demo
node src/cli.js audit --reports examples/reports
npm test
```

After publishing to npm, the intended command becomes:

```bash
npx debtops init
npx debtops audit --reports reports
```

## CODEOWNERS support

DebtOps reads `.github/CODEOWNERS`, `CODEOWNERS`, or `docs/CODEOWNERS` and assigns each packet to the last matching owner. If no owner matches, it uses `defaultOwner` from config.

## Config

Create a local config:

```bash
node src/cli.js init
```

Or copy `debtops.config.example.json` and edit:

```json
{
  "reportsDir": "reports",
  "outputDir": "docs/audit/debtops",
  "limit": 20,
  "coverageThreshold": 0.7,
  "defaultOwner": "@unassigned",
  "issueLabels": ["debtops", "technical-debt"]
}
```

## GitHub issue creation

After an audit run, inspect the generated issue bodies first. Then, from the output folder, run:

```bash
bash create-github-issues.sh
```

This uses the GitHub CLI (`gh`) and creates one issue per fix packet.

## Product principle

DebtOps does not try to become a full coding agent.

It converts report noise into small, bounded fix packets that a human or AI coding tool can act on safely.

## Roadmap

- Direct GitHub API issue creation
- Baseline comparison between two audit runs
- Dead-code and duplicate-file heuristics
- `--changed-only` mode for PRs
- npm publish

## License

MIT
