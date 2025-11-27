import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

const model =  new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});


export function getModel(){
    return model;
}

