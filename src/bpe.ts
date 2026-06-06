export type TokenId = number;
export type TokenText = string;
export type TokenPair = readonly [TokenId, TokenId];
export type PairKey = `${TokenId},${TokenId}`;
export type PairStats = Map<PairKey, number>;

export type MergeRule = {
  step: number;
  left: TokenId;
  right: TokenId;
  newTokenId: TokenId;
  tokenText: TokenText;
  count: number;
};

export type BpeTrainingOptions = {
  maxMerges: number;
};

export type BpeModel = {
  tokenToId: ReadonlyMap<TokenText, TokenId>;
  idToToken: ReadonlyMap<TokenId, TokenText>;
  mergeRules: readonly MergeRule[];
};

export type SerializedBpeModel = {
  vocabulary: Array<{
    id: TokenId;
    text: TokenText;
  }>;
  mergeRules: MergeRule[];
};

export type BpeTrainingResult = {
  model: BpeModel;
  initialTokenIds: TokenId[];
  tokenIds: TokenId[];
  initialPairStats: PairStats;
  finalPairStats: PairStats;
};

export type Tokenizer = {
  encode(text: string): TokenId[];
  decode(tokenIds: readonly TokenId[]): string;
  count(text: string): number;
  toJSON(): SerializedBpeModel;
};

export const createPairKey = (left: TokenId, right: TokenId): PairKey => `${left},${right}`;

export const parsePairKey = (key: PairKey): TokenPair => {
  const parts = key.split(",");

  if (parts.length !== 2) {
    throw new Error(`Invalid pair key: ${key}`);
  }

  const left = Number(parts[0]);
  const right = Number(parts[1]);

  if (!Number.isInteger(left) || !Number.isInteger(right)) {
    throw new Error(`Invalid pair key: ${key}`);
  }

  return [left, right];
};

export const getTokenText = (idToToken: ReadonlyMap<TokenId, TokenText>, tokenId: TokenId): TokenText => {
  const tokenText = idToToken.get(tokenId);

  if (tokenText === undefined) {
    throw new Error(`Unknown token id: ${tokenId}`);
  }

  return tokenText;
};

export const getPairText = (idToToken: ReadonlyMap<TokenId, TokenText>, [left, right]: TokenPair): TokenText => {
  return `${getTokenText(idToToken, left)}${getTokenText(idToToken, right)}`;
};

export const countPairStats = (ids: readonly TokenId[]): PairStats => {
  const stats: PairStats = new Map();

  for (let index = 0; index < ids.length - 1; index += 1) {
    const left = ids[index];
    const right = ids[index + 1];

    if (left === undefined || right === undefined) {
      continue;
    }

    const key = createPairKey(left, right);
    stats.set(key, (stats.get(key) ?? 0) + 1);
  }

  return stats;
};

export const sortPairStats = (stats: PairStats): Array<readonly [PairKey, number]> => {
  return Array.from(stats.entries()).sort(([pairA, countA], [pairB, countB]) => {
    if (countA !== countB) {
      return countB - countA;
    }

    return pairA.localeCompare(pairB);
  });
};

export const findMostFrequentPair = (stats: PairStats): { pair: TokenPair; count: number } | undefined => {
  const mostFrequent = sortPairStats(stats)[0];

  if (mostFrequent === undefined) {
    return undefined;
  }

  const [key, count] = mostFrequent;

  return {
    pair: parsePairKey(key),
    count,
  };
};

export const mergePair = (ids: readonly TokenId[], pair: TokenPair, newTokenId: TokenId): TokenId[] => {
  const [targetLeft, targetRight] = pair;
  const mergedIds: TokenId[] = [];

  for (let index = 0; index < ids.length; ) {
    const current = ids[index];
    const next = ids[index + 1];

    if (current === undefined) {
      break;
    }

    if (current === targetLeft && next === targetRight) {
      mergedIds.push(newTokenId);
      index += 2;
      continue;
    }

    mergedIds.push(current);
    index += 1;
  }

  return mergedIds;
};

export const encode = (text: string, model: BpeModel): TokenId[] => {
  let tokenIds = Array.from(text).map((character, index) => {
    const tokenId = model.tokenToId.get(character);

    if (tokenId === undefined) {
      throw new Error(`Unknown token text at character ${index}: ${JSON.stringify(character)}`);
    }

    return tokenId;
  });

  for (const rule of model.mergeRules) {
    tokenIds = mergePair(tokenIds, [rule.left, rule.right], rule.newTokenId);
  }

  return tokenIds;
};

export const decode = (tokenIds: readonly TokenId[], model: BpeModel): string => {
  return tokenIds.map((tokenId) => getTokenText(model.idToToken, tokenId)).join("");
};

export const exportModel = (model: BpeModel): SerializedBpeModel => {
  return {
    vocabulary: Array.from(model.idToToken.entries())
      .map(([id, text]) => ({ id, text }))
      .sort((tokenA, tokenB) => tokenA.id - tokenB.id),
    mergeRules: model.mergeRules.map((rule) => ({ ...rule })),
  };
};

export const importModel = (serialized: SerializedBpeModel): BpeModel => {
  const tokenToId = new Map<TokenText, TokenId>();
  const idToToken = new Map<TokenId, TokenText>();

  for (const token of serialized.vocabulary) {
    if (tokenToId.has(token.text)) {
      throw new Error(`Duplicate token text in serialized model: ${JSON.stringify(token.text)}`);
    }

    if (idToToken.has(token.id)) {
      throw new Error(`Duplicate token id in serialized model: ${token.id}`);
    }

    tokenToId.set(token.text, token.id);
    idToToken.set(token.id, token.text);
  }

  return {
    tokenToId,
    idToToken,
    mergeRules: serialized.mergeRules.map((rule) => ({ ...rule })),
  };
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

  let tokenIds = Array.from(text).map((character) => getOrCreateTokenId(character));
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
