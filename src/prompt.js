import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
dotenv.config();


// const prompt = PromptTemplate.fromTemplate("你是一个专业的${job},你将${question}翻译")
 



const model = new ChatOpenAI({
    apiKey: process.env.API_KEY, 
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

// prompt.format({
//     job: "日语翻译人员",
//     question: "我想吃肉翻译成日语",
// }).then((res) => {
//     console.log(res);
//     return model.invoke(res);
// }).then((res) => {
//     console.log(res.content);
// })


/**
 *  方式2 构造函数
 *  const prompt = new PromptTemplate({
 *     inputVariables: ["question"],
 *     template: "你是一个专业的翻译人员,你将${question}翻译",
 * })
 *  prompt.format({
 *     question: "我想吃肉翻译成日语",
 * }).then((res) => {
 *     return model.invoke(res);
 * }).then((res) => {
 *     console.log(res.content);
 * })
 */

// const prompt = ChatPromptTemplate.fromMessages([
//     ["system", "你是一个专业的翻译人员"],
//     ["human", "{question}"],
// ])


// prompt.invoke({
//     question: "我想吃肉翻译成日语",
// }).then((res) => {
//     return model.invoke(res);
// }).then((res) => {
//     console.log(res.content);
// })
