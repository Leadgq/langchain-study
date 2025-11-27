import { getModel } from "../model/index.js"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from '@langchain/core/runnables'

const prompt = new PromptTemplate({
    template: "你是一个专业的{job},将提问的{question}翻译",
    inputVariables: ["job", "question"],
});


const chatModel = getModel();

const strParser = new StringOutputParser();


const chain = RunnableSequence.from([
    prompt,
    chatModel,
    strParser,
]);

async function translate(question) {
    // const template = await prompt.invoke({
    //     job: "英语人员",
    //     question,
    // });
    // const result = await chatModel.invoke(template);
    // const output = await strParser.invoke(result);
    // return output;
    return await chain.invoke({ job: "英语人员", question });
}

const res = await translate('我现在想睡觉了，帮我翻译成英语');
console.log(res);

 