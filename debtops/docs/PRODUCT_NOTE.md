# DebtOps Product Note

DebtOps turns static-analysis report noise into ranked, reviewable fix packets for AI-built codebases.

The first audience is solo founders and small teams using AI coding tools who now have code that works on the surface but is hard to safely change.

Most audit tools stop at findings. DebtOps starts after findings: it groups, ranks, and writes bounded cleanup packets that are safe to review.

## Non-goals

- Not a full coding agent
- Not a scanner replacement
- Not dashboard-first

## Wedge

A local CLI that emits markdown. No account, backend, or repo permissions needed.

## Future version

A GitHub App that comments on a repo audit with the top fix packets and can optionally open issues.
