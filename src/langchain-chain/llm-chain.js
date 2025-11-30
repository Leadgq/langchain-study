import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getModel } from "../model/index.js";
import { RunnablePassthrough } from "@langchain/core/runnables";

const model = getModel();
const stringOutputParser = new StringOutputParser();

async function runChain(topic) {
    // 注意点：每个assign中都是并行的 不相互影响
    const templateChatPromptTip = ChatPromptTemplate.fromTemplate("详细写一篇关于 {topic} 的文章。");
    const templateChatPromptSummary = ChatPromptTemplate.fromTemplate("请总结一下下面的文章: {text}");

    const chain = RunnablePassthrough.assign({
        article: templateChatPromptTip.pipe(model).pipe(stringOutputParser),
    }).assign({
        summary: (input) => {
            return templateChatPromptSummary
                .pipe(model)
                .pipe(stringOutputParser)
                .invoke({ text: input.article });
        }
    })

    return await chain.invoke({ topic });
}

const result = await runChain("人工智能的未来");
  console.log("=== 文档处理结果 ===");
  console.log("\n文章:", result.article);
  console.log("\n总结:", result.summary);
   console.log("\n主题:", result.topic);
