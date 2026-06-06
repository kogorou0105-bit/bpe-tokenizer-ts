import { BYTE_VOCABULARY_SIZE, byteToTokenText } from "./utf8.js";
import type { BpeModel, MergeRule, SerializedBpeModel, TokenId, TokenPair, TokenText } from "./types.js";

export const SERIALIZED_MODEL_VERSION = 1;
export const SERIALIZED_MODEL_MODE = "byte-level-bpe";

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
    version: SERIALIZED_MODEL_VERSION,
    mode: SERIALIZED_MODEL_MODE,
    vocabulary: Array.from(model.idToToken.entries())
      .map(([id, text]) => ({ id, text }))
      .sort((tokenA, tokenB) => tokenA.id - tokenB.id),
    mergeRules: model.mergeRules.map((rule) => ({ ...rule })),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readInteger = (value: unknown, fieldName: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${fieldName}: expected integer.`);
  }

  return value as number;
};

const readNonNegativeInteger = (value: unknown, fieldName: string): number => {
  const integer = readInteger(value, fieldName);

  if (integer < 0) {
    throw new Error(`Invalid ${fieldName}: expected non-negative integer.`);
  }

  return integer;
};

const readPositiveInteger = (value: unknown, fieldName: string): number => {
  const integer = readInteger(value, fieldName);

  if (integer <= 0) {
    throw new Error(`Invalid ${fieldName}: expected positive integer.`);
  }

  return integer;
};

const readTokenText = (value: unknown, fieldName: string): TokenText => {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${fieldName}: expected string.`);
  }

  return value;
};

const readVocabularyEntry = (value: unknown, index: number): { id: TokenId; text: TokenText } => {
  if (!isRecord(value)) {
    throw new Error(`Invalid vocabulary entry at index ${index}: expected object.`);
  }

  return {
    id: readNonNegativeInteger(value.id, `vocabulary[${index}].id`),
    text: readTokenText(value.text, `vocabulary[${index}].text`),
  };
};

const readMergeRule = (value: unknown, index: number): MergeRule => {
  if (!isRecord(value)) {
    throw new Error(`Invalid merge rule at index ${index}: expected object.`);
  }

  return {
    step: readPositiveInteger(value.step, `mergeRules[${index}].step`),
    left: readNonNegativeInteger(value.left, `mergeRules[${index}].left`),
    right: readNonNegativeInteger(value.right, `mergeRules[${index}].right`),
    newTokenId: readNonNegativeInteger(value.newTokenId, `mergeRules[${index}].newTokenId`),
    tokenText: readTokenText(value.tokenText, `mergeRules[${index}].tokenText`),
    count: readPositiveInteger(value.count, `mergeRules[${index}].count`),
  };
};

const validateByteVocabulary = (idToToken: ReadonlyMap<TokenId, TokenText>): void => {
  for (let byte = 0; byte < BYTE_VOCABULARY_SIZE; byte += 1) {
    const tokenText = idToToken.get(byte);
    const expectedTokenText = byteToTokenText(byte);

    if (tokenText === undefined) {
      throw new Error(`Missing byte token id in serialized model: ${byte}`);
    }

    if (tokenText !== expectedTokenText) {
      throw new Error(`Invalid byte token text for id ${byte}: expected ${JSON.stringify(expectedTokenText)}.`);
    }
  }
};

const validateMergeRule = (rule: MergeRule, index: number, idToToken: ReadonlyMap<TokenId, TokenText>): void => {
  if (rule.step !== index + 1) {
    throw new Error(`Invalid merge rule step at index ${index}: expected ${index + 1}.`);
  }

  if (!idToToken.has(rule.left)) {
    throw new Error(`Merge rule ${rule.step} references unknown left token id: ${rule.left}`);
  }

  if (!idToToken.has(rule.right)) {
    throw new Error(`Merge rule ${rule.step} references unknown right token id: ${rule.right}`);
  }

  const newTokenText = idToToken.get(rule.newTokenId);

  if (newTokenText === undefined) {
    throw new Error(`Merge rule ${rule.step} references unknown new token id: ${rule.newTokenId}`);
  }

  const expectedTokenText = getPairText(idToToken, [rule.left, rule.right]);

  if (rule.tokenText !== expectedTokenText) {
    throw new Error(
      `Merge rule ${rule.step} tokenText mismatch: expected ${JSON.stringify(expectedTokenText)}, got ${JSON.stringify(rule.tokenText)}.`,
    );
  }

  if (newTokenText !== rule.tokenText) {
    throw new Error(
      `Merge rule ${rule.step} newTokenId text mismatch: expected ${JSON.stringify(rule.tokenText)}, got ${JSON.stringify(newTokenText)}.`,
    );
  }
};

export const importModel = (serialized: unknown): BpeModel => {
  if (!isRecord(serialized)) {
    throw new Error("Invalid serialized model: expected object.");
  }

  if (serialized.version !== SERIALIZED_MODEL_VERSION) {
    throw new Error(`Unsupported serialized model version: ${String(serialized.version)}`);
  }

  if (serialized.mode !== SERIALIZED_MODEL_MODE) {
    throw new Error(`Unsupported serialized model mode: ${String(serialized.mode)}`);
  }

  if (!Array.isArray(serialized.vocabulary)) {
    throw new Error("Invalid serialized model vocabulary: expected array.");
  }

  if (!Array.isArray(serialized.mergeRules)) {
    throw new Error("Invalid serialized model mergeRules: expected array.");
  }

  const tokenToId = new Map<TokenText, TokenId>();
  const idToToken = new Map<TokenId, TokenText>();

  for (const [index, rawToken] of serialized.vocabulary.entries()) {
    const token = readVocabularyEntry(rawToken, index);

    if (tokenToId.has(token.text)) {
      throw new Error(`Duplicate token text in serialized model: ${JSON.stringify(token.text)}`);
    }

    if (idToToken.has(token.id)) {
      throw new Error(`Duplicate token id in serialized model: ${token.id}`);
    }

    tokenToId.set(token.text, token.id);
    idToToken.set(token.id, token.text);
  }

  validateByteVocabulary(idToToken);

  const mergeRules = serialized.mergeRules.map((rawRule, index) => {
    const rule = readMergeRule(rawRule, index);

    validateMergeRule(rule, index, idToToken);

    return rule;
  });

  return {
    tokenToId,
    idToToken,
    mergeRules,
  };
};
