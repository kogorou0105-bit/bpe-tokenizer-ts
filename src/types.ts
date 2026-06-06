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
