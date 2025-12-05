import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { createAgent, createMiddleware, summarizationMiddleware, trimMessages } from "langchain"
import { z } from "zod"
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { MemorySaver } from "@langchain/langgraph";

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

const trimMessageHistory = createMiddleware({
    name: "TrimMessages",
    beforeModel: async (state) => {
        // 在模型调用前修剪消息
        const trimmed = await trimMessages(state.messages, {
            strategy: "last",
            maxTokens: 2000,
            startOn: "human",
            endOn: ["human", "tool"],
            tokenCounter: (msgs) => msgs.length,  // 自定义 token 计数器
        });
        return { messages: trimmed };
    },
});

export function createAgentFn(option = {}) {
    const {
        tools = [],
        modelName,
        summaryModelName,
        responseFormat,
        middleWare = []
    } = option;
    if (responseFormat && typeof responseFormat !== "object") {
        throw new Error('please use  object to format responseFormat')
    }
    const checkpointer = new MemorySaver();
    const agent = createAgent({
        model: getModel(modelName),
        tools: tools,
        checkpointer,
        responseFormat: responseFormat || z.object({
            question: z.string().describe("The customer's question"),
            answer: z.string().describe("The assistant's answer"),
        }),
        systemPrompt: `你是一个靠谱的人工智能助手可以回答用户的问题`,
        middleware: [
            summarizationMiddleware({
                model: getModel(summaryModelName),
                trigger: { tokens: 4000 },
                keep: { messages: 25 },
            }),
            trimMessageHistory,
            ...middleWare
        ]
    })
    return agent;
}
