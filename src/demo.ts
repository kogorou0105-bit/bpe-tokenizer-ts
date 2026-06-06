import { createTokenizer, getPairText, parsePairKey, sortPairStats, trainBpe } from "./bpe.js";
import type { PairStats } from "./bpe.js";

const text = `A tokenizer begins with a simple question: how should a machine look at language before it can reason about language? People read sentences as flowing ideas, but software needs smaller pieces that can be counted, stored, compared, and transformed. In a large language model, those pieces become token identifiers, and the identifiers become vectors inside the model. This project starts from that doorway. Before we optimize algorithms or publish packages, we want to observe text carefully, character by character, and notice how many small decisions hide inside a plain paragraph. Spaces matter. Punctuation matters. The boundary between two letters can matter. Even a short English passage contains repeated patterns, common pairs, rare combinations, and surprising transitions. By printing neighboring characters, we are not building a full tokenizer yet. We are building intuition. The exercise shows that text is not only a sequence of words, but also a sequence of local relationships. Later, byte pair encoding will use a related idea at a larger scale: find pairs that appear often, merge them, and gradually create useful units. For now, the goal is humble. We take one paragraph, walk through it from left to right, join each character with the next character, and print the result. This makes the invisible mechanics of tokenization feel concrete. A future library can provide polished APIs, strong tests, browser support, and fast encoding, but it still begins with this basic movement through text.`;

const parseMaxMerges = (args: readonly string[]): number => {
  const defaultMaxMerges = 10;
  const optionIndex = args.findIndex((arg) => arg === "--max-merges" || arg.startsWith("--max-merges="));

  if (optionIndex === -1) {
    return defaultMaxMerges;
  }

  const option = args[optionIndex];
  const rawValue = option?.startsWith("--max-merges=") ? option.slice("--max-merges=".length) : args[optionIndex + 1];
  const maxMerges = Number(rawValue);

  if (!Number.isInteger(maxMerges) || maxMerges < 0) {
    throw new Error(`Invalid --max-merges value: ${String(rawValue)}. Expected a non-negative integer.`);
  }

  return maxMerges;
};

const maxMerges = parseMaxMerges(process.argv.slice(2));
const result = trainBpe(text, { maxMerges });
const tokenizer = createTokenizer(result.model);
const decodedText = tokenizer.decode(result.tokenIds);
const encodedText = tokenizer.encode(text);

const printTopPairs = (title: string, stats: PairStats): void => {
  console.log(title);

  for (const [key, count] of sortPairStats(stats).slice(0, 10)) {
    const pair = parsePairKey(key);
    const [left, right] = pair;

    console.log(`[${left}, ${right}] ${JSON.stringify(getPairText(result.model.idToToken, pair))}: ${count}`);
  }
};

console.log(`Total characters: ${Array.from(text).length}`);
console.log(`Configured max merges: ${maxMerges}`);
console.log(`Initial token id sequence length: ${result.initialTokenIds.length}`);
console.log(`Final token id sequence length: ${result.tokenIds.length}`);
console.log(`Vocabulary size: ${result.model.idToToken.size}`);
console.log(`Merge rules learned: ${result.model.mergeRules.length}`);
console.log(`Initial unique token id pairs: ${result.initialPairStats.size}`);
console.log(`Final unique token id pairs: ${result.finalPairStats.size}`);
console.log(`Tokenizer count: ${tokenizer.count(text)}`);
console.log(`Decoded text matches original: ${decodedText === text}`);
console.log(`Re-encoded token ids match training result: ${JSON.stringify(encodedText) === JSON.stringify(result.tokenIds)}`);

printTopPairs("\nTop 10 token id pairs before training:", result.initialPairStats);

console.log("\nMerge rules:");
for (const rule of result.model.mergeRules) {
  console.log(
    `${rule.step}. [${rule.left}, ${rule.right}] ${JSON.stringify(rule.tokenText)} ` +
      `x ${rule.count} -> token ${rule.newTokenId}`,
  );
}

printTopPairs("\nTop 10 token id pairs after training:", result.finalPairStats);
