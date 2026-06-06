#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

import { createTokenizer, exportModel, importModel, trainBpe } from "./index.js";
import type { SerializedBpeModel, TokenId } from "./index.js";

type Command = "train" | "encode" | "decode";

type ParsedArgs = {
  command: Command;
  options: Map<string, string>;
};

const usage = `Usage:
  tokenize train --input <text-file> --output <model-json> [--max-merges <n>]
  tokenize encode --model <model-json> --input <text-file> [--output <ids-json>]
  tokenize decode --model <model-json> --input <ids-json> [--output <text-file>]

Examples:
  tokenize train --input corpus.txt --output tokenizer.json --max-merges 100
  tokenize encode --model tokenizer.json --input input.txt --output ids.json
  tokenize decode --model tokenizer.json --input ids.json --output decoded.txt`;

const parseArgs = (args: readonly string[]): ParsedArgs => {
  const [command, ...rest] = args;

  if (command !== "train" && command !== "encode" && command !== "decode") {
    throw new Error(usage);
  }

  const options = new Map<string, string>();

  for (let index = 0; index < rest.length; index += 1) {
    const option = rest[index];

    if (option === undefined || !option.startsWith("--")) {
      throw new Error(`Invalid argument: ${String(option)}\n\n${usage}`);
    }

    const inlineValueIndex = option.indexOf("=");

    if (inlineValueIndex !== -1) {
      options.set(option.slice(2, inlineValueIndex), option.slice(inlineValueIndex + 1));
      continue;
    }

    const value = rest[index + 1];

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}\n\n${usage}`);
    }

    options.set(option.slice(2), value);
    index += 1;
  }

  return { command, options };
};

const requireOption = (options: ReadonlyMap<string, string>, name: string): string => {
  const value = options.get(name);

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required option --${name}\n\n${usage}`);
  }

  return value;
};

const parseMaxMerges = (options: ReadonlyMap<string, string>): number => {
  const rawValue = options.get("max-merges") ?? "10";
  const maxMerges = Number(rawValue);

  if (!Number.isInteger(maxMerges) || maxMerges < 0) {
    throw new Error(`Invalid --max-merges value: ${rawValue}. Expected a non-negative integer.`);
  }

  return maxMerges;
};

const readJson = async <T>(path: string): Promise<T> => {
  return JSON.parse(await readFile(path, "utf8")) as T;
};

const writeOutput = async (options: ReadonlyMap<string, string>, content: string): Promise<void> => {
  const output = options.get("output");

  if (output === undefined) {
    process.stdout.write(content);
    return;
  }

  await writeFile(output, content);
};

const parseTokenIds = (value: unknown): TokenId[] => {
  if (!Array.isArray(value) || !value.every((item) => Number.isInteger(item))) {
    throw new Error("Token id input must be a JSON array of integers.");
  }

  return value as TokenId[];
};

const run = async (): Promise<void> => {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === "train") {
    const input = requireOption(options, "input");
    const output = requireOption(options, "output");
    const text = await readFile(input, "utf8");
    const result = trainBpe(text, { maxMerges: parseMaxMerges(options) });

    await writeFile(output, `${JSON.stringify(exportModel(result.model), null, 2)}\n`);
    return;
  }

  if (command === "encode") {
    const model = importModel(await readJson<SerializedBpeModel>(requireOption(options, "model")));
    const tokenizer = createTokenizer(model);
    const text = await readFile(requireOption(options, "input"), "utf8");

    await writeOutput(options, `${JSON.stringify(tokenizer.encode(text))}\n`);
    return;
  }

  const model = importModel(await readJson<SerializedBpeModel>(requireOption(options, "model")));
  const tokenizer = createTokenizer(model);
  const tokenIds = parseTokenIds(await readJson<unknown>(requireOption(options, "input")));

  await writeOutput(options, tokenizer.decode(tokenIds));
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
