import { TextDecoder, TextEncoder } from "node:util";

import type { TokenText } from "./types.js";

export const BYTE_VOCABULARY_SIZE = 256;

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8");

export const byteToTokenText = (byte: number): TokenText => String.fromCharCode(byte);

export const textToUtf8TokenTexts = (text: string): TokenText[] => {
  return Array.from(utf8Encoder.encode(text), byteToTokenText);
};

export const tokenTextsToUtf8Bytes = (tokenTexts: readonly TokenText[]): Uint8Array => {
  const byteLength = tokenTexts.reduce((total, tokenText) => total + tokenText.length, 0);
  const bytes = new Uint8Array(byteLength);
  let offset = 0;

  for (const tokenText of tokenTexts) {
    for (let index = 0; index < tokenText.length; index += 1) {
      const byte = tokenText.charCodeAt(index);

      if (byte > 0xff) {
        throw new Error(`Token text contains non-byte character: ${JSON.stringify(tokenText)}`);
      }

      bytes[offset] = byte;
      offset += 1;
    }
  }

  return bytes;
};

export const utf8TokenTextsToText = (tokenTexts: readonly TokenText[]): string => {
  return utf8Decoder.decode(tokenTextsToUtf8Bytes(tokenTexts));
};
