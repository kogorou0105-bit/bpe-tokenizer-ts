# Unknown Character Encoding

## Status

Deferred.

## Current Context

The current `encode` implementation starts from individual characters and looks each character up in the trained model vocabulary.

If a character was not present in the training text, encoding throws an error.

This keeps the current learning implementation simple and makes unsupported input obvious.

## Potential Problem

A useful tokenizer must handle text that was not present in the training corpus.

If the initial vocabulary only contains characters seen during training, then new input can fail on unseen characters, emoji, symbols, or languages.

## When To Revisit

Revisit this when the project moves from the learning demo toward a reusable npm API that accepts arbitrary user input.

## Likely Direction

Choose one explicit strategy:

- Byte-level fallback, where all UTF-8 bytes are representable from the beginning.
- A configured initial alphabet that includes expected input characters.
- An `<UNK>` token for unsupported text, if lossy encoding is acceptable.

For LLM-style tokenizers, byte-level fallback is likely the most useful direction because it allows arbitrary Unicode text to be encoded without losing information.
