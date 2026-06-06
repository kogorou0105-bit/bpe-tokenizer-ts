# Future Risk Notes

This directory records potential future problems discovered during tokenizer development.

These notes are not immediate implementation tasks. They exist to keep the current code simple while preserving context for later decisions.

## Format

Use one Markdown file per potential issue:

```text
.note/001-short-kebab-title.md
.note/002-another-risk.md
```

Create a subdirectory only when one issue needs multiple artifacts, experiments, or references.

## Notes

- [001 - Pair Key Ambiguity](./001-pair-key-ambiguity.md)
- [002 - Overlapping Pair Merge](./002-overlapping-pair-merge.md)
- [003 - Token Text Id Reuse](./003-token-text-id-reuse.md)
- [004 - Unknown Character Encoding](./004-unknown-character-encoding.md)
- [005 - Serialized Model Versioning](./005-serialized-model-versioning.md)
