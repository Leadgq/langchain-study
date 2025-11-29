import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { getModel, formateModelMessageToObject } from '../model/index.js';
import { RunnableSequence } from '@langchain/core/runnables'
import { z } from 'zod';
const model = getModel();


const [parser, formatInstructions] = formateModelMessageToObject({
    question: z.string().describe("The customer's question"),
    answer: z.string().describe("The AI's answer to the customer's question"),
})

const promptTemplate =  await ChatPromptTemplate.fromMessages([
    ["system", "你是一个靠谱的{role}你要使用{format_instructions}"],
    ["human", "{question}"],
]).partial({ format_instructions: formatInstructions });


const chain = RunnableSequence.from([promptTemplate, model, parser]);

const result = await chain.invoke({ role: "助手", question: "给我说个笑话把！！"});
console.log(result);
