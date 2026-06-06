# TypeScript Tokenizer MVP

This repository is an MVP implementation of a learning-oriented BPE tokenizer in TypeScript.

It demonstrates the core tokenizer loop:

```text
text -> initial token ids -> pair statistics -> merge rules -> encode/decode
```

## Current Capabilities

- Train a small BPE model from text with `trainBpe`.
- Learn multiple merge rules with `maxMerges`.
- Encode text with a trained model.
- Decode token ids back to text.
- Create a convenient tokenizer object with `createTokenizer`.
- Export and import models with JSON-compatible data.
- Train, encode, and decode files from the CLI.
- Run tests with Vitest.
- Keep the package entry separate from the runnable demo.

## Commands

Install dependencies:

```bash
npm install
```

Run the demo:

```bash
npm run dev
```

Run the demo with a custom merge count:

```bash
npm run dev -- --max-merges=20
```

Run tests:

```bash
npm test
```

Typecheck and build:

```bash
npm run typecheck
npm run build
```

## CLI

Train a model from a text file:

```bash
npm run cli -- train --input corpus.txt --output tokenizer.json --max-merges 100
# After package installation:
tokenize train --input corpus.txt --output tokenizer.json --max-merges 100
```

Encode a text file into token ids:

```bash
npm run cli -- encode --model tokenizer.json --input input.txt --output ids.json
# After package installation:
tokenize encode --model tokenizer.json --input input.txt --output ids.json
```

Decode token ids back to text:

```bash
npm run cli -- decode --model tokenizer.json --input ids.json --output decoded.txt
# After package installation:
tokenize decode --model tokenizer.json --input ids.json --output decoded.txt
```

## Example API

```ts
import { createTokenizer, trainBpe } from "ts-tokenizer";

const result = trainBpe("banana bandana banana", { maxMerges: 5 });
const tokenizer = createTokenizer(result.model);

const ids = tokenizer.encode("banana");
const text = tokenizer.decode(ids);
const count = tokenizer.count("banana");
const json = tokenizer.toJSON();
```

## MVP Limitations

- This is a teaching-oriented BPE implementation, not a GPT/tiktoken-compatible tokenizer.
- Encoding currently only supports characters present in the training text.
- There is no byte-level fallback yet.
- Pair statistics are recomputed from scratch after every merge.

See `.note/` for deferred design concerns discovered during development.
