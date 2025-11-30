# ChromaDB Example Selector 学习指南

这个项目展示了如何使用 ChromaDB 作为向量数据库来实现 LangChain 的 Example Selectors 功能。Example Selectors 是 Few-shot Learning 中的核心组件，能够智能地选择最相关的训练示例。

## 📋 目录

- [什么是 Example Selectors？](#什么是-example-selectors)
- [为什么选择 ChromaDB？](#为什么选择-chromadb)
- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [示例说明](#示例说明)
- [核心概念](#核心概念)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🔍 什么是 Example Selectors？

Example Selectors（示例选择器）是 LangChain 中的一个重要组件，用于：

1. **动态示例选择**: 根据输入自动选择最相关的训练示例
2. **Few-shot Learning**: 为大语言模型提供上下文示例，提高回答质量
3. **相似度匹配**: 基于语义相似度找到最佳匹配的示例

### 工作原理

```
输入查询 → 向量化 → 相似度搜索 → 选择Top-K示例 → 构建Few-shot Prompt
```

## 🎯 为什么选择 ChromaDB？

ChromaDB 是一个优秀的向量数据库选择：

- **易用性**: 简单的 API，无需复杂的配置
- **性能**: 快速的向量搜索和相似度计算
- **集成**: 与 LangChain 完美集成
- **本地运行**: 支持本地部署，保护数据隐私
- **开源**: 完全免费，无厂商锁定

## 🛠️ 环境准备

### 1. 安装依赖

确保你的项目中已安装必要的依赖：

```bash
pnpm install langchain @langchain/community @langchain/openai chromadb dotenv
```

### 2. 启动 ChromaDB

在运行示例之前，需要启动 ChromaDB 服务：

```bash
# 安装 ChromaDB (如果还没安装)
pip install chromadb

# 启动 ChromaDB 服务
chroma run --host localhost --port 8000```

### 3. 配置环境变量

创建 `.env` 文件并添加你的 OpenAI API Key：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 快速开始

### 基础使用

```javascript
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SemanticSimilarityExampleSelector } from "langchain/selectors";

// 1. 定义示例数据
const examples = [
  { input: "苹果", output: "一种红色的水果" },
  { input: "香蕉", output: "一种黄色的热带水果" },
  // ... 更多示例
];

// 2. 创建向量存储
const embeddings = new OpenAIEmbeddings();
const vectorStore = await Chroma.fromTexts(
  examples.map(ex => ex.input),
  examples,
  embeddings,
  {
    collectionName: "my-examples",
    url: "http://localhost:8000"
  }
);

// 3. 创建示例选择器
const selector = new SemanticSimilarityExampleSelector({
  vectorStore,
  k: 2, // 返回最相似的2个示例
  inputKeys: ["input"]
});

// 4. 使用选择器
const selectedExamples = await selector.selectExamples({
  input: "橙子"
});
```

### 运行完整示例

```bash
# 确保ChromaDB在运行
chroma run --host localhost --port 8000

# 在另一个终端运行示例
node src/chroma_example_selector.js
```

## 📖 示例说明

### 1. 基础示例 (`basicExampleSelector`)

展示最简单的语义相似度示例选择器：
- 创建水果和蔬菜的示例
- 根据输入选择最相似的2个示例
- 直观展示相似度匹配效果

### 2. 进阶示例 (`advancedExampleSelector`)

展示更复杂的问答场景：
- 创建技术问答示例对
- 自定义配置（相似度阈值、返回数量）
- 处理更复杂的语义查询

### 3. 实际应用 (`promptTemplateIntegration`)

展示如何与Prompt模板集成：
- 情感分析任务
- 动态构建Few-shot Prompt
- 实际的AI应用场景

## 🧠 核心概念

### SemanticSimilarityExampleSelector

主要的示例选择器类，参数说明：

```javascript
const selector = new SemanticSimilarityExampleSelector({
  vectorStore,        // 向量存储实例
  k: 3,              // 返回最相似的示例数量
  inputKeys: ["input"], // 用于匹配的输入字段
  similarityThreshold: 0.7 // 相似度阈值（可选）
});
```

### Chroma 向量存储

```javascript
const vectorStore = await Chroma.fromTexts(
  texts,            // 文本数组
  metadatas,        // 对应的元数据
  embeddings,       // 嵌入模型
  {
    collectionName: "my-collection", // 集合名称
    url: "http://localhost:8000"     // ChromaDB地址
  }
);
```

### 方法说明

- `selectExamples(input)`: 根据输入选择最相似的示例
- `addExample(example)`: 添加新的示例到向量存储
- `deleteCollection()`: 删除整个集合

## 💡 最佳实践

### 1. 示例质量

- **多样性**: 确保示例覆盖不同的场景和模式
- **质量优先**: 选择高质量的示例而不是数量
- **平衡性**: 保持不同类别的示例数量平衡

```javascript
// 好的示例设计
const goodExamples = [
  { input: "今天天气真好", sentiment: "积极" },
  { input: "这个产品太糟糕了", sentiment: "消极" },
  { input: "还可以吧", sentiment: "中性" }
];
```

### 2. 参数调优

- **K值选择**: 根据任务复杂度调整返回的示例数量
- **相似度阈值**: 避免选择不相关的示例
- **嵌入模型**: 根据语言和任务选择合适的嵌入模型

```javascript
// 根据任务调整参数
const selector = new SemanticSimilarityExampleSelector({
  vectorStore,
  k: task === "simple" ? 2 : 5,  // 简单任务用2个示例，复杂任务用5个
  similarityThreshold: 0.75       // 设置合理的相似度阈值
});
```

### 3. 性能优化

- **批量处理**: 一次性添加多个示例
- **缓存**: 重复使用向量存储连接
- **集合管理**: 合理组织不同任务的集合

```javascript
// 批量添加示例
const examples = [/* 大量示例 */];
await Promise.all(
  examples.map(example => vectorStore.addTexts([example.input], [example]))
);
```

## ❓ 常见问题

### Q1: ChromaDB 连接失败

**问题**: `Error: connect ECONNREFUSED 127.0.0.1:8000`

**解决方案**:
1. 确保 ChromaDB 服务正在运行
2. 检查端口号是否正确
3. 确认防火墙设置

```bash
# 启动 ChromaDB
chroma run --host localhost --port 8000

# 或指定不同的端口
chroma run --host localhost --port 8001
```

### Q2: OpenAI API 错误

**问题**: API key 无效或配额不足

**解决方案**:
1. 检查 `.env` 文件中的 API key
2. 确认 OpenAI 账户余额充足
3. 验证 API key 权限

```env
# .env 文件
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Q3: 向量存储创建失败

**问题**: `Collection already exists` 错误

**解决方案**:
1. 使用不同的集合名称
2. 删除现有集合重新创建
3. 连接到现有集合而不是创建新的

```javascript
// 方案1: 使用不同的集合名
const vectorStore = await Chroma.fromTexts(
  texts, metadatas, embeddings,
  { collectionName: "new-collection-name" }
);

// 方案2: 连接到现有集合
const vectorStore = new Chroma(embeddings, {
  collectionName: "existing-collection",
  url: "http://localhost:8000"
});
```

### Q4: 相似度结果不理想

**问题**: 选择的示例与输入不相关

**解决方案**:
1. 改进示例质量和多样性
2. 调整相似度阈值
3. 尝试不同的嵌入模型
4. 增加示例数量

```javascript
// 调整参数提高匹配质量
const selector = new SemanticSimilarityExampleSelector({
  vectorStore,
  k: 1,                      // 减少返回数量，只返回最相似的
  similarityThreshold: 0.85  // 提高相似度阈值
});
```

### Q5: 内存使用过高

**问题**: 处理大量示例时内存不足

**解决方案**:
1. 分批处理示例
2. 使用更小的嵌入模型
3. 定期清理不需要的集合
4. 考虑使用 ChromaDB 的持久化存储

## 🔧 进阶技巧

### 1. 多集合管理

为不同任务创建独立的集合：

```javascript
const sentimentStore = await Chroma.fromTexts(/* 情感分析示例 */);
const qaStore = await Chroma.fromTexts(/* 问答示例 */);
const translationStore = await Chroma.fromTexts(/* 翻译示例 */);
```

### 2. 动态更新示例

运行时添加新的示例：

```javascript
// 添加新的示例
await selector.vectorStore.addTexts(
  ["新的输入文本"],
  [{ input: "新的输入文本", output: "新的输出结果" }]
);
```

### 3. 自定义相似度计算

实现自定义的相似度计算逻辑：

```javascript
class CustomExampleSelector extends SemanticSimilarityExampleSelector {
  async selectExamples(input) {
    const examples = await super.selectExamples(input);
    // 添加自定义的过滤或排序逻辑
    return examples.filter(/* 自定义条件 */);
  }
}
```

## 📚 相关资源

- [LangChain Example Selectors 文档](https://python.langchain.com/docs/modules/model_io/prompts/example_selectors/)
- [ChromaDB 官方文档](https://docs.trychroma.com/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Few-shot Learning 最佳实践](https://arxiv.org/abs/2009.14177)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个示例项目！

---

**提示**: 如果遇到问题，请先检查 ChromaDB 服务是否正常运行，以及 OpenAI API Key 是否正确配置。