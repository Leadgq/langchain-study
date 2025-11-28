import { getModel } from "../model/index.js"
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from "@langchain/core/output_parsers"

const model = getModel()

const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个靠谱的{role}"],
    ["human", "{question}"],
]);

const structuredParser = StructuredOutputParser.fromNamesAndDescriptions({
    q: "问题内容",
    a: "回答内容"
});

const chatChain = RunnableSequence.from([
    chatPrompt,
    model,
    structuredParser,
])

async function query(params) {
    const result = await chatChain.invoke({ role: params.role, question: params.question })
    console.log(result, typeof result);
}


const formatInstructions = structuredParser.getFormatInstructions();
query({
    role: "助手",
    question: `人工智能用英语怎么说？\n\n${formatInstructions}`
})




