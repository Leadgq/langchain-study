import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
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

export function getLocalFilePath(fileName) {
   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   return path.join(__dirname, fileName);
}


export function formateModelMessageToObject(obj) {
    const schema = z.object(obj);
    const parser = StructuredOutputParser.fromZodSchema(schema);
    const formatInstructions = parser.getFormatInstructions();
    return [parser, formatInstructions,]
}

export function readlineChat() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}