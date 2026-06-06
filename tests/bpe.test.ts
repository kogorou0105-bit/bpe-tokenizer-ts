import { describe, expect, it } from "vitest";

import { createTokenizer, decode, encode, exportModel, importModel, mergePair, trainBpe } from "../src/bpe.js";

describe("BPE training", () => {
  it("learns up to maxMerges merge rules", () => {
    const result = trainBpe("abababab", { maxMerges: 2 });

    expect(result.model.mergeRules).toHaveLength(2);
    expect(result.model.mergeRules.map((rule) => rule.tokenText)).toEqual(["ab", "abab"]);
  });

  it("does not merge when maxMerges is zero", () => {
    const result = trainBpe("abab", { maxMerges: 0 });

    expect(result.model.mergeRules).toHaveLength(0);
    expect(result.tokenIds).toEqual(result.initialTokenIds);
  });

  it("decodes trained token ids back to the original text", () => {
    const text = "banana bandana";
    const result = trainBpe(text, { maxMerges: 4 });

    expect(decode(result.tokenIds, result.model)).toBe(text);
  });

  it("encodes the training text to the same final token ids", () => {
    const text = "token token token";
    const result = trainBpe(text, { maxMerges: 5 });

    expect(encode(text, result.model)).toEqual(result.tokenIds);
  });

  it("falls back to UTF-8 bytes for characters outside the training text", () => {
    const result = trainBpe("abc", { maxMerges: 1 });
    const text = "abcd😄";
    const encoded = encode(text, result.model);

    expect(encoded).toContain("d".charCodeAt(0));
    expect(encoded).toEqual(expect.arrayContaining([0xf0, 0x9f, 0x98, 0x84]));
    expect(decode(encoded, result.model)).toBe(text);
  });
});

describe("model serialization", () => {
  it("exports the expected JSON-compatible model shape", () => {
    const result = trainBpe("abababab", { maxMerges: 2 });

    const serialized = exportModel(result.model);

    expect(serialized.version).toBe(1);
    expect(serialized.mode).toBe("byte-level-bpe");
    expect(serialized.vocabulary).toHaveLength(258);
    expect(serialized.vocabulary[0]).toEqual({ id: 0, text: "\0" });
    expect(serialized.vocabulary[97]).toEqual({ id: 97, text: "a" });
    expect(serialized.vocabulary[98]).toEqual({ id: 98, text: "b" });
    expect(serialized.vocabulary[256]).toEqual({ id: 256, text: "ab" });
    expect(serialized.vocabulary[257]).toEqual({ id: 257, text: "abab" });
    expect(serialized.mergeRules).toEqual([
      {
        step: 1,
        left: 97,
        right: 98,
        newTokenId: 256,
        tokenText: "ab",
        count: 4,
      },
      {
        step: 2,
        left: 256,
        right: 256,
        newTokenId: 257,
        tokenText: "abab",
        count: 3,
      },
    ]);
  });

  it("preserves encode and decode behavior after JSON roundtrip", () => {
    const text = "banana bandana banana";
    const result = trainBpe(text, { maxMerges: 5 });
    const serialized = exportModel(result.model);
    const restoredModel = importModel(JSON.parse(JSON.stringify(serialized)));

    const encoded = encode(text, restoredModel);

    expect(encoded).toEqual(result.tokenIds);
    expect(decode(encoded, restoredModel)).toBe(text);
  });

  it("rejects duplicate token ids", () => {
    const result = trainBpe("abc", { maxMerges: 1 });
    const serialized = exportModel(result.model);
    const duplicateId = serialized.vocabulary[0]?.id;
    const tokenText = serialized.vocabulary[1]?.text;

    expect(duplicateId).toBeDefined();
    expect(tokenText).toBeDefined();
    expect(() =>
      importModel({
        ...serialized,
        vocabulary: [...serialized.vocabulary, { id: duplicateId as number, text: `${tokenText as string}-duplicate` }],
      }),
    ).toThrow(/Duplicate token id/);
  });

  it("rejects duplicate token text", () => {
    const result = trainBpe("abc", { maxMerges: 1 });
    const serialized = exportModel(result.model);
    const tokenId = serialized.vocabulary[0]?.id;
    const tokenText = serialized.vocabulary[0]?.text;

    expect(tokenId).toBeDefined();
    expect(tokenText).toBeDefined();
    expect(() =>
      importModel({
        ...serialized,
        vocabulary: [...serialized.vocabulary, { id: (tokenId as number) + 100, text: tokenText as string }],
      }),
    ).toThrow(/Duplicate token text/);
  });

  it("rejects unsupported serialized model versions", () => {
    const serialized = exportModel(trainBpe("abc", { maxMerges: 1 }).model);

    expect(() => importModel({ ...serialized, version: 2 })).toThrow(/Unsupported serialized model version/);
  });

  it("rejects unsupported serialized model modes", () => {
    const serialized = exportModel(trainBpe("abc", { maxMerges: 1 }).model);

    expect(() => importModel({ ...serialized, mode: "character-bpe" })).toThrow(/Unsupported serialized model mode/);
  });

  it("rejects serialized models missing byte vocabulary entries", () => {
    const serialized = exportModel(trainBpe("abc", { maxMerges: 1 }).model);

    expect(() =>
      importModel({
        ...serialized,
        vocabulary: serialized.vocabulary.filter((token) => token.id !== 0),
      }),
    ).toThrow(/Missing byte token id/);
  });

  it("rejects merge rules that reference unknown token ids", () => {
    const serialized = exportModel(trainBpe("abab", { maxMerges: 1 }).model);
    const [firstRule] = serialized.mergeRules;

    expect(firstRule).toBeDefined();
    expect(() =>
      importModel({
        ...serialized,
        mergeRules: [{ ...(firstRule as NonNullable<typeof firstRule>), left: 9999 }],
      }),
    ).toThrow(/unknown left token id/);
  });

  it("rejects merge rules whose token text does not match the merged pair", () => {
    const serialized = exportModel(trainBpe("abab", { maxMerges: 1 }).model);
    const [firstRule] = serialized.mergeRules;

    expect(firstRule).toBeDefined();
    expect(() =>
      importModel({
        ...serialized,
        mergeRules: [{ ...(firstRule as NonNullable<typeof firstRule>), tokenText: "ba" }],
      }),
    ).toThrow(/tokenText mismatch/);
  });
});

describe("createTokenizer", () => {
  it("wraps encode, decode, count, and toJSON", () => {
    const text = "token token token";
    const result = trainBpe(text, { maxMerges: 5 });
    const tokenizer = createTokenizer(result.model);

    expect(tokenizer.encode(text)).toEqual(encode(text, result.model));
    expect(tokenizer.decode(result.tokenIds)).toBe(decode(result.tokenIds, result.model));
    expect(tokenizer.count(text)).toBe(tokenizer.encode(text).length);
    expect(tokenizer.toJSON()).toEqual(exportModel(result.model));
  });

  it("can be created from an imported model", () => {
    const text = "banana bandana banana";
    const result = trainBpe(text, { maxMerges: 5 });
    const restoredModel = importModel(JSON.parse(JSON.stringify(exportModel(result.model))));
    const tokenizer = createTokenizer(restoredModel);

    expect(tokenizer.encode(text)).toEqual(result.tokenIds);
    expect(tokenizer.decode(result.tokenIds)).toBe(text);
  });
});

describe("mergePair", () => {
  it("merges every non-overlapping target pair", () => {
    const tokenIds = [1, 1, 1, 1];
    const pairToMerge = [1, 1] as const;
    const newTokenId = 2;

    expect(mergePair(tokenIds, pairToMerge, newTokenId)).toEqual([2, 2]);
  });

  it("does not reuse a token that was already consumed by a merge", () => {
    const tokenIds = [1, 1, 1];
    const pairToMerge = [1, 1] as const;
    const newTokenId = 2;

    // The possible pairs are positions (0, 1) and (1, 2), but they overlap.
    // After merging positions (0, 1), the token at position 1 has been consumed.
    expect(mergePair(tokenIds, pairToMerge, newTokenId)).toEqual([2, 1]);
  });
});
