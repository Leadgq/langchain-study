import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import z from "zod"
import { getModel } from "../model/index.js";

const checkPointer = new MemorySaver();
const model = getModel();

const agent = createAgent({
    model: model,
    tools: [],
    systemPrompt: "你是一个专业的助手，能够回答用户的问题。",
    checkpointer: checkPointer,
    responseFormat: z.object({
        question: z.string().describe("The customer's question"),
        answer: z.string().describe("The AI's answer to the customer's question"),
    })
})

const userId = "user_one";

const result = await agent.invoke(
    {
        messages: [{ role: "user", content: "my name is gary" }],
    },
    {
        configurable: {
            thread_id: userId,
        }
    }
)

console.log(result.messages.at(-1).content);

const result2 = await agent.invoke(
    {
        messages: [{ role: "user", content: "what is my name?" }],
    },
    {
        configurable: {
            thread_id: userId,
        }
    }
)

console.log(result2.messages.at(-1).content);

