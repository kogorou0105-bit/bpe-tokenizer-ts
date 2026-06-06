# Serialized Model Versioning

## Status

Implemented for the byte-level BPE model format.

## Current Context

The current serialized model format is explicit about its version and tokenizer mode:

```ts
type SerializedBpeModel = {
  version: 1;
  mode: "byte-level-bpe";
  vocabulary: Array<{ id: TokenId; text: TokenText }>;
  mergeRules: MergeRule[];
};
```

`importModel` validates the version, mode, byte vocabulary, duplicate ids/text, merge rule references, and merge rule token text consistency.

## Resolved Problem

Once the tokenizer format changes, old serialized model files may become ambiguous or impossible to load safely.

Likely future changes include:

- Byte-level fallback metadata.
- Special tokens.
- Normalization or pre-tokenization configuration.
- Different merge ranking semantics.
- Package version compatibility constraints.

Without an explicit format version, `importModel` cannot know which behavior a saved model expects.

## When To Revisit

Revisit this when a second real model format exists and migrations are needed.

## Direction

Only add migrations when more than one real format exists.
