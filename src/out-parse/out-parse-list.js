import { CommaSeparatedListOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from "@langchain/core/prompts"
import { getModel } from "../model/index.js";
import { RunnableSequence } from '@langchain/core/runnables';


const model = getModel();

const parser = new CommaSeparatedListOutputParser();

const formatInstruction = parser.getFormatInstructions();

const template2 = new PromptTemplate({
     template:'请生成5个{text},\n\n{formatInstructions}',
     inputVariables: ['text'],
     partialVariables:{
        formatInstructions :formatInstruction
     }
})

const template = await PromptTemplate.fromTemplate('请生成5个{text},\n\n{formatInstructions}').
partial({
    formatInstructions: formatInstruction
});

const chain = RunnableSequence.from([template, model, parser]);

const chain2 = RunnableSequence.from([template2, model, parser]);
const response = await chain.invoke({ text: "电影" });

const response2 = await chain2.invoke({ text: "水果" });
console.log(response);
console.log(response2);

