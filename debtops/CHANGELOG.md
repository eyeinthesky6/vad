# Changelog

## 0.2.0

- Added config loading from `debtops.config.json` and `.debtopsrc.json`.
- Added `init` command to create local config and reports directory.
- Added CODEOWNERS-based owner inference.
- Added SARIF, ESLint JSON, and npm audit parsing.
- Added dependency finding kind and configurable risk thresholds.
- Added HTML report output.
- Added GitHub issue body generation and `create-github-issues.sh` helper.
- Added per-packet reproduce commands.
- Expanded demo reports and tests.

## 0.1.0

- Added dependency-free Node CLI.
- Added parsers for Semgrep, jscpd, Radon CC, coverage XML, ESLint text, and TypeScript compiler output.
- Added triage ranking by issue type, path risk, and raw score.
- Added markdown summary and fix-packet generation.
- Added demo report generator and sample reports.
- Added parser tests.
