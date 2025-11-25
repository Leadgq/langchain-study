import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
dotenv.config();


const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个专业的翻译人员,你的名字为{name}"],
    ["human", "{question}"],
])

const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});


// 方式1 格式化字符串
// chatPrompt.format({
//     name: "翻译人员",
//     question: "我想吃肉翻译成日语",
// }).then((res) => {
//     return model.invoke(res);
// }).then((res) => {
//     console.log(res.content);
// })

// 方式2 得到消息的数组
chatPrompt.invoke({
    name: "翻译人员",
    question: "我想吃肉翻译成日语",
}).then((res) => {
  console.log(res.toString());
  console.log(res.toChatMessages());
})

// // 方式3 格式化消息数组
// chatPrompt.formatMessages({
//     name: "翻译人员",
//     question: "我想吃肉翻译成日语",
// }).then((res) => {
//     return model.invoke(res);
// }).then((res) => {
//     console.log(res.content);
// })