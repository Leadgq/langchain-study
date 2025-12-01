import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import dotenv from "dotenv";
dotenv.config();



export function getModel(modelName) {
    return new ChatOpenAI({
        apiKey: process.env.API_KEY,
        model: modelName || "gpt-4o-mini",
        configuration: {
            baseURL: process.env.BASE_URL,
        },
    });
}

export function formateModelMessageToObject(obj) {
    const schema = z.object(obj);
    const parser = StructuredOutputParser.fromZodSchema(schema);
    const formatInstructions = parser.getFormatInstructions();
    return [parser, formatInstructions,]
}

