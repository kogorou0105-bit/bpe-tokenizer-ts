import { BYTE_VOCABULARY_SIZE, byteToTokenText, textToUtf8TokenTexts, utf8TokenTextsToText } from "./utf8.js";
import { countPairStats, findMostFrequentPair, mergePair } from "./pairs.js";
import { exportModel, getPairText, getTokenText } from "./model.js";
import type { BpeModel, BpeTrainingOptions, BpeTrainingResult, MergeRule, TokenId, Tokenizer, TokenText } from "./types.js";

export type {
  BpeModel,
  BpeTrainingOptions,
  BpeTrainingResult,
  MergeRule,
  PairKey,
  PairStats,
  SerializedBpeModel,
  TokenId,
  TokenPair,
  TokenText,
  Tokenizer,
} from "./types.js";
export { exportModel, getPairText, getTokenText, importModel } from "./model.js";
export { countPairStats, createPairKey, findMostFrequentPair, mergePair, parsePairKey, sortPairStats } from "./pairs.js";

export const encode = (text: string, model: BpeModel): TokenId[] => {
  let tokenIds = textToUtf8TokenTexts(text).map((tokenText, index) => {
    const tokenId = model.tokenToId.get(tokenText);

    if (tokenId === undefined) {
      throw new Error(`Missing byte token at byte ${index}: ${tokenText.charCodeAt(0)}`);
    }

    return tokenId;
  });

  for (const rule of model.mergeRules) {
    tokenIds = mergePair(tokenIds, [rule.left, rule.right], rule.newTokenId);
  }

  return tokenIds;
};

export const decode = (tokenIds: readonly TokenId[], model: BpeModel): string => {
  return utf8TokenTextsToText(tokenIds.map((tokenId) => getTokenText(model.idToToken, tokenId)));
};

export const createTokenizer = (model: BpeModel): Tokenizer => {
  return {
    encode: (text) => encode(text, model),
    decode: (tokenIds) => decode(tokenIds, model),
    count: (text) => encode(text, model).length,
    toJSON: () => exportModel(model),
  };
};

export const trainBpe = (text: string, options: BpeTrainingOptions): BpeTrainingResult => {
  const tokenToId = new Map<TokenText, TokenId>();
  const idToToken = new Map<TokenId, TokenText>();
  let nextTokenId: TokenId = 0;

  const getOrCreateTokenId = (tokenText: TokenText): TokenId => {
    const existingTokenId = tokenToId.get(tokenText);

    if (existingTokenId !== undefined) {
      return existingTokenId;
    }

    const tokenId = nextTokenId;
    nextTokenId += 1;
    tokenToId.set(tokenText, tokenId);
    idToToken.set(tokenId, tokenText);

    return tokenId;
  };

  for (let byte = 0; byte < BYTE_VOCABULARY_SIZE; byte += 1) {
    getOrCreateTokenId(byteToTokenText(byte));
  }

  let tokenIds = textToUtf8TokenTexts(text).map((tokenText) => getOrCreateTokenId(tokenText));
  const initialTokenIds = [...tokenIds];
  const initialPairStats = countPairStats(tokenIds);
  let currentPairStats = initialPairStats;
  const mergeRules: MergeRule[] = [];

  for (let step = 0; step < options.maxMerges; step += 1) {
    const mostFrequentPair = findMostFrequentPair(currentPairStats);

    if (mostFrequentPair === undefined) {
      break;
    }

    const [left, right] = mostFrequentPair.pair;
    const tokenText = getPairText(idToToken, mostFrequentPair.pair);
    const newTokenId = getOrCreateTokenId(tokenText);

    tokenIds = mergePair(tokenIds, mostFrequentPair.pair, newTokenId);
    mergeRules.push({
      step: step + 1,
      left,
      right,
      newTokenId,
      tokenText,
      count: mostFrequentPair.count,
    });
    currentPairStats = countPairStats(tokenIds);
  }

  const model: BpeModel = {
    tokenToId,
    idToToken,
    mergeRules,
  };

  return {
    model,
    initialTokenIds,
    tokenIds,
    initialPairStats,
    finalPairStats: currentPairStats,
  };
};
