# VAD: Verifiable Agent Document

**VAD is an experimental open proposal for agent-native documents.**

PDF made documents portable by preserving appearance. VAD explores what documents should look like when AI agents become first-class readers, interpreters, and operators.

A VAD package is designed to preserve:

- human-readable content
- machine-readable meaning
- provenance
- permitted agent actions
- hashes and signatures
- trust state
- version history

The goal is not to replace PDF rendering, DOCX editing, EPUB publishing, or legal e-signature systems.

The goal is to define a lightweight, portable, inspectable document package that agents can read without guessing meaning from visual layout.

## Core idea

**PDF preserves how a document looks. VAD preserves what a document means, where it came from, what agents may do with it, and whether it has changed.**

## Status

VAD is currently an experimental concept and preliminary specification.

This repository exists to start discussion, invite contributors, and explore whether agent-native documents need a new open primitive.

It is not production-ready. It is not a legal signing standard. It is not a security guarantee. It is a starting point.

## Proposed structure

A VAD package may begin as an inspectable folder and later be distributed as a single zipped `.vad` file:

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

## Key concepts

### Content

The human-readable body of the document.

### Semantics

Structured claims, entities, dates, obligations, citations, and relationships that agents can consume directly.

### Policy

Rules that tell agents what they may do with the document: summarize, translate, extract tasks, compare versions, or refuse unsafe actions.

### Provenance

Information about who created the document, what tools were used, what sources were used, and what changed over time.

### Signature

Hashes and signatures that make modification detectable.

## Trust states

A VAD document may be:

- `draft`
- `sealed`
- `amended`
- `tampered`
- `untrusted`

Editing is not prevented. Instead, editing changes the hash and breaks trust until the document is re-sealed.

## Why this exists

AI agents increasingly need to read and act on documents.

Most existing formats were designed for humans, printers, editors, or publishers. Agents often have to infer structure, meaning, and intent from layout-heavy files.

VAD asks a simple question:

**What would a portable document format look like if agents were first-class readers?**

## Repository contents

```text
README.md
MANIFESTO.md
SPEC-0.1.md
TRUST-MODEL.md
AGENT-POLICY.md
EXAMPLES.md
CONTRIBUTING.md
LICENSE
/schemas
/examples
/docs
```

## Invitation

This is a preliminary proposal.

Contributors are welcome to challenge the structure, improve the schemas, add examples, build validators, create viewers, or propose alternative approaches.
