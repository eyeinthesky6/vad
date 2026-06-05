# VAD Trust Model

VAD treats documents as editable files whose trust state changes when content changes.

The goal is not to prevent editing. The goal is to make modification visible and machine-actionable.

## Principles

1. Any file can be edited.
2. Editing a sealed VAD package should change its hash.
3. A changed hash should break trust until re-sealed.
4. Agents should act only according to both trust state and policy.
5. Human-readable access may remain available even when agent trust is broken.

## Trust states

### Draft

The package is editable and unsigned.

Recommended agent behavior:

- May read
- May summarize with warning
- Should not execute external actions

### Sealed

The package has valid hashes and signatures.

Recommended agent behavior:

- May read
- May summarize
- May extract structured claims
- May act only if policy allows

### Amended

The package is a new signed version derived from a previous signed version.

Recommended agent behavior:

- May read
- May compare against previous version
- May act according to current valid policy

### Tampered

One or more hashes do not match the signed state.

Recommended agent behavior:

- May read human-visible content
- Must warn user
- Must not execute external actions
- Must not treat semantic claims as trusted

### Untrusted

The package has an unknown, unsupported, expired, or invalid signing state.

Recommended agent behavior:

- May read with warning
- Should not execute external actions
- Should not rely on claims for high-stakes decisions

## Whole-document signatures

VAD 0.1 begins with whole-document hashing and signing.

## Future: section-level signatures

Future versions may allow important sections or claims to be signed independently.

This would allow a document to remain partially trusted when non-critical sections change.
