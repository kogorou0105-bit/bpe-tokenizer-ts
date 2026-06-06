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
- Fall back to UTF-8 byte tokens for characters not seen during training.
- Create a convenient tokenizer object with `createTokenizer`.
- Export and import models with JSON-compatible data.
- Validate serialized model version, mode, vocabulary, and merge rules on import.
- Train, encode, and decode files from the CLI.
- Run tests with Vitest.
- Keep the package entry separate from the runnable demo.

## Installation

Install as a project dependency:

```bash
npm install ts-tokenizer
```

Install the CLI globally:

```bash
npm install -g ts-tokenizer
```

Run the CLI without installing globally by prefixing `tokenize` with `npx --package ts-tokenizer`:

```bash
npx --package ts-tokenizer tokenize train --input corpus.txt --output tokenizer.json --max-merges 100
```

Download the published package tarball:

```bash
npm pack ts-tokenizer
```

If your npm is configured to a private registry, add `--registry https://registry.npmjs.org` to the install, pack, or npx command.

## Development Commands

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

After global installation, the CLI command is `tokenize`.

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

Quick CLI smoke test with the published package:

```bash
printf "banana bandana banana" > corpus.txt
printf "banana 😄" > input.txt
npx --package ts-tokenizer tokenize train --input corpus.txt --output tokenizer.json --max-merges 20
npx --package ts-tokenizer tokenize encode --model tokenizer.json --input input.txt --output ids.json
npx --package ts-tokenizer tokenize decode --model tokenizer.json --input ids.json --output decoded.txt
cat decoded.txt
```

The final output should be:

```text
banana 😄
```

## Project Structure

- `src/bpe.ts`: core BPE training, encode/decode, and tokenizer facade.
- `src/types.ts`: shared tokenizer, model, token, and training result types.
- `src/utf8.ts`: UTF-8 byte fallback helpers and 256-byte base vocabulary constants.
- `src/pairs.ts`: pair keys, pair statistics, most-frequent-pair selection, and pair merging.
- `src/model.ts`: vocabulary lookup plus model import/export.
- `src/cli.ts`: command-line train/encode/decode entry point.
- `src/demo.ts`: runnable learning/demo script.
- `tests/`: Vitest test suite for public entry points and BPE behavior.
- `ROADMAP.md`: follow-up feature directions and architectural next steps.

## Example API

Install the package first:

```bash
npm install ts-tokenizer
```

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
- Pair statistics are recomputed from scratch after every merge.

See `ROADMAP.md` for planned directions and `.note/` for deferred design concerns discovered during development.
