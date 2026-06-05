# VAD Agent Policy

The agent policy file describes what an AI agent may do with a VAD package.

The policy is not a technical sandbox. It is a machine-readable instruction layer that agents should follow when deciding whether to summarize, transform, extract, or act on document content.

## Core action categories

| Action | Description |
|---|---|
| `summarize` | Produce a summary |
| `translate` | Translate content |
| `extract_tasks` | Extract tasks or deadlines |
| `extract_claims` | Extract structured claims |
| `compare_versions` | Compare with previous or related versions |
| `execute_external_action` | Take action outside the document, such as sending, filing, paying, or submitting |
| `legal_interpretation` | Interpret legal meaning |
| `financial_action` | Initiate or recommend payment/investment action |

## Policy values

Each action may be marked as:

- `allowed`
- `forbidden`
- `requires_human_review`
- `warn_only`

## Example

```json
{
  "actions": {
    "summarize": "allowed",
    "translate": "allowed",
    "extract_tasks": "allowed",
    "extract_claims": "allowed",
    "compare_versions": "allowed",
    "execute_external_action": "forbidden",
    "legal_interpretation": "requires_human_review",
    "financial_action": "forbidden"
  },
  "trust_rules": {
    "if_tampered": "read_only_untrusted",
    "if_unsigned": "warn_user",
    "if_unknown_signer": "warn_user"
  }
}
```

## Agent guidance

Agents should read policy before acting.

If trust state and policy conflict, the stricter rule should apply.
