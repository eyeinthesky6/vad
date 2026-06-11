# DebtOps Release Checklist

DebtOps can be released from the `debtops/` folder.

## Local checks

```bash
cd debtops
npm test
npm run pack:dry
```

## GitHub Actions release

Use the `Publish DebtOps` workflow in the Actions tab.

The workflow checks the package and publishes from the `debtops/` directory.

## Manual release

```bash
cd debtops
npm login
npm publish --access public
```

## Before each release

Update:

- `package.json` version
- `CHANGELOG.md`

Suggested versioning:

- patch for fixes
- minor for compatible features
- major for breaking changes

## Standalone repository move

The package currently lives at `eyeinthesky6/vad/debtops`. Later, copy the complete `debtops/` folder into a fresh repository and keep the same package files.
