import { createAgent, tool } from "langchain"
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers"
import z from "zod"
import { getModel } from "../model/index.js"

const model = getModel();

const outputParser = new StringOutputParser();


const ResponseSchema = z.object({
    question: z.string().describe("The customer's question"),
    answer: z.string().describe("The AI's answer to the customer's question"),
});


const writeArticle = tool(
    async ({ topic }) => {
        const promptTemplate = ChatPromptTemplate.fromTemplate(
            "详细写一篇关于 {topic} 的文章。"
        );
        const chain = promptTemplate.pipe(model).pipe(outputParser);
        return await chain.invoke({ topic });
    },
    {
        name: "write_article",
        description: "写一篇关于指定主题的文章",
        schema: z.object({
            topic: z.string().describe("文章的主题"),
        }),
    }
)

const summarizeArticle = tool(
    async ({ article }) => {
        const promptTemplate = ChatPromptTemplate.fromTemplate(
            "请总结以下文章的主要内容：{article}"
        );
        const chain = promptTemplate.pipe(model).pipe(outputParser);
        return await chain.invoke({ article });
    },
    {
        name: "summarize_article",
        description: "总结一篇文章的主要内容",
        schema: z.object({
            article: z.string().describe("要总结的文章"),
        }),
    }
)



const agent = createAgent({
    model: getModel(),
    tools: [writeArticle, summarizeArticle],
    systemPrompt: `你是一个内容专家。
  1. 首先使用 write_article 工具写一篇详细的文章
  2. 然后使用 summarize_article 工具总结这篇文章`,
   responseFormat: ResponseSchema,
})

 const res = await agent.invoke({
     messages: [{ role: "user", content: "请处理主题：人工智能的未来" }],
})

const content = res.messages.at(-1)?.content;

// 如果是字符串，尝试解析
if (typeof content === 'string') {
  try {
    const result = JSON.parse(content);
    console.log(result.question);
    console.log(result.answer);
  } catch (e) {
    console.log(content.replace(/\\n/g, '\n'));
  }
}