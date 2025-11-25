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

const sysTem = new SystemMessage(" you are a math teacher,your name is :{name},you only answer math questions");


const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", sysTem.content],
    ["human", "{question}"],
])

chatPrompt.invoke({
    name: "math teacher",
    question: "1+1=?",
}).then((res) => {
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})


// no answer
chatPrompt.invoke({
    name: "math teacher",
    question: "what's the dinner for tonight?",
}).then((res) => {
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})