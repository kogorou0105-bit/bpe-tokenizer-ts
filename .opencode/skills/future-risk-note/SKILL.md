---
name: future-risk-note
description: Use when tokenizer development reveals a future risk, design caveat, scalability concern, or deferred problem that should be recorded in .note/ without implementing a solution now.
---

# Future Risk Note

Use this skill when a change exposes a likely future problem, but the current implementation should remain simple.

The goal is to preserve engineering context without prematurely adding abstractions, compatibility layers, or optimizations.

## What To Record

Record issues such as:

- A current data structure that is safe now but may break after a later feature.
- A performance concern that is irrelevant at current scale but likely relevant for large corpora.
- A correctness edge case that is outside the current milestone.
- A design tradeoff that should not be solved until there is concrete pressure.
- A behavior that is intentionally simple for learning or debugging.

Do not use this skill for ordinary TODOs that should be implemented immediately.

## File Location

Store notes under:

```text
.note/
```

Use one Markdown file per potential issue:

```text
.note/001-short-kebab-title.md
.note/002-another-risk.md
```

Keep `.note/README.md` as the index.

Start with a single Markdown file. Only create a subdirectory when one risk needs multiple artifacts such as experiments, screenshots, or generated data.

## Note Template

```markdown
# Short Risk Title

## Status

Deferred.

## Current Context

Describe what the code does now and why it is acceptable for the current stage.

## Potential Problem

Describe how this can break, become ambiguous, become slow, or become hard to maintain later.

## When To Revisit

List the concrete condition that should trigger a revisit.

## Likely Direction

Describe the likely solution direction without implementing it now.
```

## Rules

- Keep notes concrete and tied to current code.
- Do not add production code just to satisfy a future concern.
- Prefer documenting the revisit trigger over designing a complete system early.
- If the risk becomes current work, update the note status instead of leaving stale context behind.
- After adding a new note, update `.note/README.md`.
