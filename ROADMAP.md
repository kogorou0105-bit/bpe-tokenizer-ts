# Roadmap

This project is still a learning-oriented BPE tokenizer, but the next work should keep the core small and make each capability explicit.

## Near Term

- Add a serialized model `version` field before treating JSON model files as stable.
- Strengthen `importModel` validation, especially byte vocabulary and merge rule references.
- Add `vocabSize` as a higher-level training option in addition to raw `maxMerges`.
- Add `tokenizer.tokenize(text)` or an inspection helper that returns token ids with token text.
- Cover empty input, single-byte input, Chinese text, emoji, and malformed model files in tests.

## Training Quality

- Support training from multiple documents without creating merge pairs across document boundaries.
- Define special token behavior, such as BOS/EOS/PAD/UNK if the project needs them.
- Decide whether normalization or pre-tokenization belongs in this package.
- Add model metadata for training options, byte-level mode, and future compatibility.

## Performance

- Avoid recomputing all pair statistics after every merge for large corpora.
- Consider a priority queue or indexed pair occurrences when training size makes it necessary.
- Add benchmark scripts before optimizing implementation details.

## API And CLI

- Add batch encode/decode helpers only after the single-text API is stable.
- Support stdin/stdout in the CLI for pipeline usage.
- Consider batch file processing after CLI file commands remain stable.
- Separate public API exports from internal helpers if external consumers grow.
