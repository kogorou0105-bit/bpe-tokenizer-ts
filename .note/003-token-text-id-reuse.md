# Token Text Id Reuse

## Status

Deferred.

## Current Context

The current training demo keeps one id per token text:

```ts
const tokenToId = new Map<TokenText, TokenId>();
const idToToken = new Map<TokenId, TokenText>();
```

When a merge creates `leftText + rightText`, `getOrCreateTokenId` either returns the existing id for that text or creates a new id.

This keeps the vocabulary easy to understand during the learning phase.

## Potential Problem

In a fuller BPE implementation, merge rules are ordered operations, not only a set of final token strings.

If two different merge paths ever produce the same token text, reusing the existing token id may hide the fact that the new merge rule was learned from a different pair.

This may affect future encode behavior if the project needs to match a specific tokenizer reference exactly.

## When To Revisit

Revisit this when implementing `encode` from learned merge rules, especially if the encoder is expected to match an external BPE implementation.

## Likely Direction

Keep the current one-id-per-token-text model until there is a concrete compatibility target.

When compatibility matters, define whether merge rules should always create fresh symbols or whether token text identity is enough for the tokenizer model.

Add tests with repeated and ambiguous merge paths before changing the model.
