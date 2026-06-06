import { describe, expect, it } from "vitest";

import { createTokenizer, decode, encode, exportModel, importModel, trainBpe } from "./index.js";

describe("package entry", () => {
  it("exports the public tokenizer API", () => {
    const text = "banana bandana banana";
    const result = trainBpe(text, { maxMerges: 5 });
    const tokenizer = createTokenizer(importModel(JSON.parse(JSON.stringify(exportModel(result.model)))));

    expect(encode(text, result.model)).toEqual(result.tokenIds);
    expect(decode(result.tokenIds, result.model)).toBe(text);
    expect(tokenizer.encode(text)).toEqual(result.tokenIds);
    expect(tokenizer.decode(result.tokenIds)).toBe(text);
  });
});
