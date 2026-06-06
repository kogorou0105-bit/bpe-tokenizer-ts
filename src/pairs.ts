import type { PairKey, PairStats, TokenId, TokenPair } from "./types.js";

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
