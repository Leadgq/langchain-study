import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";

import dotenv from "dotenv";
dotenv.config();

const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

const sysTem = new SystemMessage("你是人工智能你的名字为:{name},你只可以回答数学相关的问题");


const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", sysTem.content],
    ["human", "{question}"],
])

chatPrompt.invoke({
    name: "张三",
    question: "1+1=?",
}).then((res) => {
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})


// no answer
chatPrompt.invoke({
    name: "张三",
    question: "what's the dinner for tonight?",
}).then((res) => {
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})