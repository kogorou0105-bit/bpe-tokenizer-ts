# Pair Key Ambiguity

## Status

Addressed for the current demo.

## Current Context

The first character-pair frequency demo used a minimal structure:

```ts
type PairStats = Map<string, number>;
```

It means:

```text
character pair -> occurrence count
```

For the original character-level experiment, this was enough. Each pair was formed by joining two neighboring characters, then the map counted how often that joined pair appeared.

Example:

```text
banana
```

Adjacent pairs:

```text
ba
an
na
an
na
```

Stats:

```text
ba -> 1
an -> 2
na -> 2
```

## Potential Problem

That structure would become unsafe once the implementation stopped working with single characters and started working with merged tokens.

For example, these two token pairs are different:

```text
["a", "bc"]
["ab", "c"]
```

But if the key is created by simple string concatenation, both become:

```text
"abc"
```

That would make the map count two different pairs as if they were the same pair.

## When To Revisit

Revisit this if pair keys are ever derived from raw token text again.

The current implementation avoids this specific ambiguity by assigning every token a numeric id first, then counting adjacent id pairs:

```ts
type TokenId = number;
type PairKey = `${TokenId},${TokenId}`;
type PairStats = Map<PairKey, number>;
```

Because the pair key is built from numeric ids with a delimiter, `[1, 23]` and `[12, 3]` remain distinct.

## Likely Direction

If the implementation needs richer metadata later, store a safer representation that keeps the two sides of the pair explicit:

```ts
type Token = string;

type PairStat = {
  left: Token;
  right: Token;
  count: number;
};

type PairStats = Map<string, PairStat>;
```

The map key should use a delimiter that cannot be confused with normal token concatenation, or another stable encoding strategy:

```ts
const pairKey = (left: string, right: string): string => `${left}\u0000${right}`;
```

Then:

```text
["a", "bc"] -> "a\0bc"
["ab", "c"] -> "ab\0c"
```

These keys remain distinct.

## Related Later Concerns

- Unicode handling: `Array.from(text)` iterates code points better than `text[index]`, but full grapheme clusters such as emoji sequences may still need more careful handling.
- Tie breaking: when two pairs have the same count, the current demo sorts alphabetically only for stable output. Real BPE training may need deterministic rules based on merge order.
- Performance: recomputing all pair counts after every merge is simple but may become slow for large corpora.
- Special tokens: future tokenizer logic must avoid accidentally splitting reserved tokens such as end-of-text markers.
