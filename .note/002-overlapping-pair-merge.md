# Overlapping Pair Merge

## Status

Deferred.

## Current Context

The current demo performs one merge for the most frequent token id pair.

The merge scans the token id sequence from left to right. When it finds the target pair, it emits the new token id and advances by two positions. This means merged pairs are non-overlapping.

Example:

```text
tokens: [1, 1, 1]
target pair: [1, 1]
new token: 2
```

Current behavior:

```text
[1, 1, 1] -> [2, 1]
```

It does not also merge the overlapping second pair at positions 1 and 2.

## Potential Problem

When the project moves from a single educational merge to repeated BPE training, overlapping pair behavior must remain deterministic and should match the intended BPE reference behavior.

If this is left implicit, future tests may become confusing for inputs with repeated tokens such as:

```text
aaa
aaaa
abababa
```

## When To Revisit

Revisit this when multi-step BPE merge training is introduced, or when adding tests for repeated-character inputs.

## Likely Direction

Keep left-to-right non-overlapping replacement unless a target tokenizer specification requires another behavior.

Add explicit tests for repeated inputs so the behavior is documented by examples.
