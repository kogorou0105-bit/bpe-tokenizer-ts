# Unknown Character Encoding

## Status

Implemented with UTF-8 byte-level fallback.

## Current Context

The `encode` implementation starts from UTF-8 bytes, and trained models include all 256 single-byte tokens in their base vocabulary.

If a character was not present in the training text, encoding can still represent it as its UTF-8 byte sequence.

## Resolved Problem

A useful tokenizer must handle text that was not present in the training corpus.

If the initial vocabulary only contains characters seen during training, then new input can fail on unseen characters, emoji, symbols, or languages.

## Remaining Considerations

Serialized model versioning is still tracked separately. Future model-format changes should make the byte-level assumption explicit.

## Chosen Direction

The tokenizer uses byte-level fallback, where all UTF-8 bytes are representable from the beginning.

This is useful for LLM-style tokenizers because arbitrary Unicode text can be encoded without losing information.
