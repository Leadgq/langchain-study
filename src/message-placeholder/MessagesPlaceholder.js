import { MessagesPlaceholder } from '@langchain/core/prompts';
import {  ChatPromptTemplate }  from  "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();


const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

const  chatPrompt  =  ChatPromptTemplate.fromMessages([
     ["system", "You are a helpful assistant that translates {input_language} to {output_language}."],
     new  MessagesPlaceholder("history"),
     ['ai', '私は肉を食べたいです。'],
])


chatPrompt.invoke({
    input_language: "English",
    output_language: "Japanese",
    history: [
        {
            role: "human",
            content: "I want to eat meat.",
        }
    ],
}).then((res) => {
    console.log(res.toChatMessages());
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})