/**
 * ChromaDB Example Selector 测试脚本
 *
 * 这个脚本用于验证 ChromaDB 和 Example Selectors 是否正常工作
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();



// 简单的测试数据
const examples = [
  {
    question: "我太开心了！",
    answer: "积极情绪"
  },
  {
    question: "这很糟糕",
    answer: "消极情绪"
  },
  {
    question: "还可以",
    answer: "中性情绪"
  }
];

// 计算余弦相似度
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findMostSimilarExample(input, examples, embeddingsModel) {
  // 获取输入文本的向量
  console.log("2. 正在计算输入文本的向量...");
  const inputVector = await embeddingsModel.embedQuery(input);

  // 获取所有示例的向量
  console.log("3. 正在计算示例文本的向量...");
  const exampleVectors = await Promise.all(
    examples.map(ex => embeddingsModel.embedQuery(ex.question))
  );

  // 计算相似度并找到最相似的
  console.log("4. 正在计算相似度...");
  let maxSimilarity = -1;
  let mostSimilarIndex = 0;

  for (let i = 0; i < exampleVectors.length; i++) {
    const similarity = cosineSimilarity(inputVector, exampleVectors[i]);
    console.log(`   "${examples[i].question}" 相似度: ${similarity.toFixed(4)}`);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarIndex = i;
    }
  }

  return examples[mostSimilarIndex];
}

async function testSimilaritySearch() {
  console.log("🧪 测试文本相似度搜索...\n");

  try {
    // 检查环境变量
    const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      throw new Error("API_KEY 或 OPENAI_API_KEY 环境变量未设置");
    }

    // 测试嵌入模型
    console.log("1. 初始化 OpenAI Embeddings...");
    const embeddingsModel = new OpenAIEmbeddings({
      apiKey: process.env.API_KEY,
      modelName: "text-embedding-3-small",
      configuration: {
          baseURL: process.env.BASE_URL,
       }
    });

    // 测试输入
    const testInput = "我很高兴";
    console.log(`\n📝 输入文本: "${testInput}"`);

    // 查找最相似的示例
    const mostSimilar = await findMostSimilarExample(testInput, examples, embeddingsModel);

    console.log(`\n✅ 最相似的示例:`);
    console.log(`   问题: "${mostSimilar.question}"`);
    console.log(`   答案: "${mostSimilar.answer}"`);

    console.log("\n🎉 测试完成！无需 ChromaDB 服务器。");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);

    if (error.message.includes("API_KEY")) {
      console.log("\n💡 解决方案:");
      console.log("1. 在 .env 文件中添加:");
      console.log("   API_KEY=your_openai_api_key");
      console.log("2. 确保你的 OpenAI 账户有足够的余额");
    }
  }
}

// 运行测试
testSimilaritySearch();