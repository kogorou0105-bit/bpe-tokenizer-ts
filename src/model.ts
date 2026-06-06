import type { BpeModel, SerializedBpeModel, TokenId, TokenPair, TokenText } from "./types.js";

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
