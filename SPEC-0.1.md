# VAD 0.1 Preliminary Specification

Status: Experimental draft

## 1. Purpose

VAD, or Verifiable Agent Document, is a lightweight package format for documents that need to be readable by both humans and AI agents.

The format is designed to preserve content, meaning, provenance, policy, and tamper-evidence.

## 2. Design goals

VAD 0.1 aims to be:

- portable
- inspectable
- agent-readable
- human-readable
- tamper-evident
- version-aware
- simple enough for contributors to implement independently

## 3. Non-goals

VAD 0.1 does not attempt to be:

- a legal e-signature standard
- a PDF renderer
- a DOCX replacement
- a full document editor
- a security guarantee
- a blockchain system
- a production compliance framework

## 4. Package structure

A VAD package is initially represented as a folder:

```text
document.vad/
  vad.json
  content.md
  semantics.json
  policy.json
  provenance.json
  signature.json
  assets/
```

A future version may define a zipped `.vad` container.

## 5. Required files

### `vad.json`

The package manifest. It identifies the document and references other package files.

### `content.md`

The human-readable document body.

### `semantics.json`

Structured meaning for agents, including entities, claims, obligations, dates, citations, and relationships.

### `policy.json`

Agent-use policy describing permitted and restricted actions.

### `provenance.json`

Origin and creation history.

### `signature.json`

Hash and signature metadata. In v0.1, signature values may be placeholders for examples.

## 6. Trust states

VAD 0.1 defines the following trust states:

| State | Meaning |
|---|---|
| `draft` | Editable and unsigned |
| `sealed` | Signed and hash-valid |
| `amended` | New signed version derived from an earlier signed version |
| `tampered` | Hash mismatch after signing |
| `untrusted` | Unknown, invalid, expired, or unsupported signing state |

## 7. Hashing model

Each required file should have a SHA-256 hash recorded in `signature.json`.

A canonical document hash may be computed from the ordered list of required file hashes.

Recommended required-file order:

1. `vad.json`
2. `content.md`
3. `semantics.json`
4. `policy.json`
5. `provenance.json`

The `signature.json` file itself should not be included in the document hash unless a future version defines detached signature behavior.

## 8. Agent behavior

Agents consuming a VAD package should:

1. Read `vad.json`.
2. Check required files exist.
3. Verify file hashes where available.
4. Determine trust state.
5. Read `policy.json` before acting.
6. Use `semantics.json` for structured extraction where possible.
7. Fall back to `content.md` for human-readable context.
8. Refuse or warn when policy or trust state requires it.

## 9. Initial agent actions

VAD 0.1 recognizes these action categories:

- `summarize`
- `translate`
- `extract_tasks`
- `extract_claims`
- `compare_versions`
- `execute_external_action`
- `legal_interpretation`
- `financial_action`

Policy may mark each action as:

- `allowed`
- `forbidden`
- `requires_human_review`
- `warn_only`

## 10. Versioning

A VAD document may include:

- `document_id`
- `version`
- `previous_version_hash`
- `change_summary`

VAD discourages silent overwrites of sealed documents. Amendments should create a new version.

## 11. Open questions

- Should VAD support section-level signatures?
- Should semantics use JSON-LD by default?
- Should zipped `.vad` be required in 0.2?
- How should signer identity be represented?
- How should agents handle partially trusted documents?
- How should VAD relate to EPUB, PDF, C2PA, COSE, and Verifiable Credentials?
