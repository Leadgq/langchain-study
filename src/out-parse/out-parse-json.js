import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables'
import { PromptTemplate } from '@langchain/core/prompts';
import { getModel } from "../model/index.js"
import { z } from 'zod';

const personSchema = z.object({
    question: z.string().describe("The customer's question"),
    answer: z.string().describe("The AI's answer to the customer's question"),
});

const parser = StructuredOutputParser.fromZodSchema(personSchema);

const formatInstructions = parser.getFormatInstructions();

const prompt = new PromptTemplate({
    template: `you're a helpful AI assistant. you will answer this {description} {format_instructions}`,
    inputVariables: ['description'],
    partialVariables: { format_instructions: formatInstructions },
});

const model = getModel();
// Way one
const chain = prompt.pipe(model).pipe(parser);

// Way two: Also you can use the way to create the chain
// const chain = RunnableSequence.from([prompt, model, parser]);

async function generatePersonInfo(description) {
    const result = await chain.invoke({ description });
    console.log("Generated Person Info:", result);
}

generatePersonInfo('你好，我想知道你是男是女');

// async function streamWithJsonParser(description) {
//     const rawStream = await prompt.pipe(model).stream({ description });
    
//     let bufferedJson = '';
    
//     for await (const chunk of rawStream) {
//         const content = chunk.content;
//         // process.stdout.write(content); // 实时显示
//         bufferedJson += content;
//     }
    
//     // 如果是前后端交互，需要返回bufferedJson 而不是解析之后的，这么做的目的是为了我们好看结果
//      return await parser.invoke(bufferedJson);
// }

// streamWithJsonParser('什么是ai?').then((res) => {
//     console.log(res);
// });
