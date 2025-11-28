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

generatePersonInfo('什么是ai?');