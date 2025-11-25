import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
dotenv.config();


const prompt = new PromptTemplate({
    inputVariables: ["question"],
    template: "你是一个专业的翻译人员,你将${question}翻译",
})

const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

// prompt.format({
//     question: "我想吃肉翻译成日语",
// }).then((res) => {
//     return model.invoke(res);
// }).then((res) => {
//     console.log(res.content);
// })
 
prompt.invoke({
    question: "我想吃肉翻译成日语",
}).then((res) => {
    console.log(res);
    return model.invoke(res.value);
}).then((res) => {
    console.log(res.content);
})