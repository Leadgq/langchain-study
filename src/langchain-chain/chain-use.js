import { RunnablePassthrough } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getModel } from "../model/index.js"

const model = getModel();
// 文档处理示例
async function documentProcessingExample() {


  const outputParser = new StringOutputParser();

  // 定义各种处理步骤
  const summarizePrompt = ChatPromptTemplate.fromTemplate(
    "总结以下文档，限制在100字以内：\n\n{document}"
  );
  
  const extractKeywordsPrompt = ChatPromptTemplate.fromTemplate(
    "从以下文档中提取5个关键词：\n\n{document}"
  );
  
  const translatePrompt = ChatPromptTemplate.fromTemplate(
    "将以下文本翻译成英文：\n\n{text}"
  );

  // 创建文档处理链
  const documentProcessingChain = RunnablePassthrough.assign({
    summary: summarizePrompt.pipe(model).pipe(outputParser),
    keywords: extractKeywordsPrompt.pipe(model).pipe(outputParser),
    originalDocument: (input) => input.document
  }).assign({
    translatedSummary: async (input) => {
      const translationChain = translatePrompt.pipe(model).pipe(outputParser);
      return await translationChain.invoke({
        text: input.summary
      });
    }
  });

  const sampleDocument = `
    人工智能是计算机科学的一个分支，它企图了解智能的实质，
    并生产出一种新的能以人类智能相似的方式做出反应的智能机器，
    该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。
    人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大，
    可以设想，未来人工智能带来的科技产品，将会是人类智慧的“容器”。
  `;

  const result = await documentProcessingChain.invoke({
    document: sampleDocument
  });

  console.log("=== 文档处理结果 ===");
  console.log("原始文档长度:", result.originalDocument.length);
  console.log("\n摘要:", result.summary);
  console.log("\n关键词:", result.keywords);
  console.log("\n英文摘要:", result.translatedSummary);
}

documentProcessingExample().catch(console.error);