# TypeScript Tokenizer 项目介绍

这个项目计划做一个 TypeScript 版本的 tokenizer npm 库。它面向正在构建 LLM 应用的人：前端开发者、Node.js 服务端开发者、Edge Runtime 使用者，以及所有想理解“文本为什么会变成 token”的人。

## 从 LLM 说起

大语言模型看起来像是在阅读文字，但它本质上并不直接处理字符串。

对模型来说，文本需要经过这样一条路径：

```text
人类文本 -> token -> token id -> embedding 向量 -> 模型计算
```

例如：

```text
"Hello world" -> [15339, 1917]
```

这里的 `[15339, 1917]` 就是模型真正接收的数字序列。Tokenizer 负责完成最前面的转换：把人类写的文本变成模型能处理的 token id。

## Token 是什么

Token 是文本被切分后的基本单位。

它可能是：

- 一个完整单词，比如 `hello`
- 一个子词，比如 `token` 和 `izer`
- 一个标点，比如 `,`
- 一个空格或带空格的片段，比如 ` world`
- 一个中文字、emoji 或字节片段

LLM 的 token 不一定等于自然语言里的“词”。这也是很多人刚接触 token 时最容易困惑的地方。

## Tokenizer 是什么

Tokenizer 是文本和 token id 之间的转换器。

它通常至少提供三个能力：

```ts
encode(text: string): number[]
decode(tokens: number[]): string
count(text: string): number
```

也就是说：

```text
encode: 文本 -> token id 数组
decode: token id 数组 -> 文本
count: 统计一段文本会占用多少 token
```

在 LLM 应用里，这些能力非常实用：

- 发送请求前估算 token 成本
- 判断 prompt 是否超过上下文窗口
- 对聊天记录进行安全截断
- 在浏览器里实时显示 token 预算
- 在 Edge Runtime 里避免依赖 Python 或 Rust 原生包

## 为什么需要 BPE

BPE 是 Byte Pair Encoding 的缩写，最早来自压缩算法，后来成为 NLP 和 LLM tokenizer 中常见的子词切分方案。

它解决的是一个折中问题。

如果按字符切：

```text
internationalization -> i n t e r n a t i o n a l i z a t i o n
```

序列会很长，模型处理成本变高。

如果按完整单词切：

```text
internationalization -> <UNK>
```

遇到词表里没有的词，就可能无法处理。

BPE 的思路是：

```text
常见片段合并成更大的 token
罕见词拆成更小的 token
```

一个简化例子：

```text
l o w
l o w e r
l o w e s t
```

如果 `l + o` 经常一起出现，就合并成 `lo`；如果 `lo + w` 经常一起出现，就合并成 `low`。

最后可能得到：

```text
low
low er
low est
```

这样，常见词可以更短，罕见词也不会完全无法表示。

## BNF 和 tokenizer 的关系

BNF，全称 Backus-Naur Form，是一种描述语法规则的形式。它常用于编程语言、DSL、配置文件和协议格式。

例如：

```bnf
<expr> ::= <number> | <expr> "+" <expr>
```

BNF 关心的是：什么样的 token 排列才是合法结构。

Tokenizer 关心的是：如何把文本切成 token。

两者的关系可以这样理解：

```text
文本 -> tokenizer -> token 序列 -> parser/grammar/BNF -> AST 或结构化结果
```

如果我们做的是 LLM tokenizer，重点通常是 token、token id、词表、BPE、特殊 token 和 encode/decode。

如果我们做的是编程语言或 DSL 解析器，BNF、parser 和 AST 会变得更重要。

## 这个项目要做什么

这个项目的目标是做一个清晰、可靠、易用的 TypeScript tokenizer npm 库。

优先目标：

- 提供简单 API：`encode`、`decode`、`count`
- 支持 Node.js、浏览器和 Edge Runtime
- 先对齐一种明确的 BPE 编码，而不是一开始做大而全
- 用测试保证和目标 tokenizer 行为一致
- 正确处理 Unicode、emoji、中英文混排和特殊 token
- 控制词表加载方式，避免浏览器包体积过大

非优先目标：

- 一开始就支持所有模型
- 一开始就实现完整 parser 或 BNF 语法系统
- 过早追求复杂插件化架构

## 预期 API 草案

```ts
import { createTokenizer } from "ts-tokenizer";

const tokenizer = await createTokenizer("example-bpe");

const tokens = tokenizer.encode("Hello, 我想写一个 tokenizer");
const text = tokenizer.decode(tokens);
const count = tokenizer.count(text);
```

更底层的 API 可能包括：

```ts
tokenizer.encodeToTokens(text)
tokenizer.encodeWithSpecialTokens(text)
tokenizer.decodeToken(tokenId)
tokenizer.isSpecialToken(tokenId)
```

## 面向谁

这个库适合：

- 做 AI 聊天产品的前端工程师
- 需要在服务端预估 token 成本的 Node.js 开发者
- 需要在 Cloudflare Workers、Vercel Edge 等环境中处理 prompt 的开发者
- 想学习 tokenizer、BPE、LLM 工程基础设施的人

## 一句话总结

这个项目不是为了让大模型变聪明，而是为了让应用在调用大模型之前，先准确理解一段文本会如何被模型“看见”。

Tokenizer 是 LLM 应用工程化的入口：它帮助我们计算 token、控制上下文、截断 prompt、估算成本，并把人类文本稳定地转换成模型需要的数字序列。
