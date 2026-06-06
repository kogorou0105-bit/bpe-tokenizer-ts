# Serialized Model Versioning

## Status

Deferred.

## Current Context

The current serialized model format is intentionally small:

```ts
type SerializedBpeModel = {
  vocabulary: Array<{ id: number; text: string }>;
  mergeRules: MergeRule[];
};
```

This is enough to JSON roundtrip the current learning model and restore `encode` / `decode` behavior.

## Potential Problem

Once the tokenizer format changes, old serialized model files may become ambiguous or impossible to load safely.

Likely future changes include:

- Byte-level fallback metadata.
- Special tokens.
- Normalization or pre-tokenization configuration.
- Different merge ranking semantics.
- Package version compatibility constraints.

Without an explicit format version, `importModel` cannot know which behavior a saved model expects.

## When To Revisit

Revisit this before publishing a stable npm API or before writing model files meant to persist outside the current demo.

## Likely Direction

Add a format version and keep import validation explicit:

```ts
type SerializedBpeModel = {
  version: 1;
  vocabulary: Array<{ id: number; text: string }>;
  mergeRules: MergeRule[];
};
```

Only add migrations when more than one real format exists.
