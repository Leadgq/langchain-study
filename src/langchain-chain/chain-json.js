import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { getModel } from '../model/index.js';
import { RunnableSequence } from '@langchain/core/runnables'
const model = getModel();

const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个靠谱的{role}"],
    ["human", "{question}"],
]);

const promptTemplate = PromptTemplate.fromTemplate(
    "你的角色为{role}，请回答问题：{question}"
)
const parse = StructuredOutputParser.fromNamesAndDescriptions({
    q: "问题内容",
    a: "回答内容"
});

const chain = RunnableSequence.from([
    promptTemplate,
    model,
    parse,
])

const formatInstructions = parse.getFormatInstructions();

const res = await chain.invoke({ role: "助手", question: `帮我讲个笑话把!!!\n\n${formatInstructions}` })

console.log(res);
