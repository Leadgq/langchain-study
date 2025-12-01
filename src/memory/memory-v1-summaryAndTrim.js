import { createAgent, summarizationMiddleware, trimMessages } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { getModel } from "../model/index.js";
import { z } from "zod";


const checkPointer = new MemorySaver();

// They're use the same model,because I'm poor
const mainModel = getModel("gpt-4o");

const summaryModel = getModel();


const agent = createAgent({
    model: mainModel,
    tools: [],
    systemPrompt: "你是一个专业的助手，能够回答用户的问题。",
    checkpointer: checkPointer,
    responseFormat: z.object({
        question: z.string().describe("The customer's question"),
        answer: z.string().describe("The assistant's answer"),
    }),
    middleware: [
        // 先对消息进行总结
        summarizationMiddleware({
            model: summaryModel,
            trigger: { tokens: 1000 },
            keep: { messages: 25 },
        })
    ],
    preModelHook: async (state) => {
        return {
            // 对消息进行裁剪，保留最后2000个token
            messages: await trimMessages(state.messages, {
                strategy: "last",
                maxTokens: 5000,
                startOn: "human",
                endOn: ["human", "tool"],
                tokenCounter: (msgs) => msgs.length,
            }),
        };
    },
});


async function longConversation(userId) {

    await agent.invoke(
        { messages: [{ role: "user", content: "给人工智能的未来，简单介绍一下" }] },
        { configurable: { thread_id: userId } }
    );


    await agent.invoke(
        { messages: [{ role: "user", content: "再写一篇关于 AI 的文章，简单介绍一下" }] },
        { configurable: { thread_id: userId } }
    );


    const res = await agent.invoke(
        { messages: [{ role: "user", content: "总结我们之前讨论的所有话题" }] },
        { configurable: { thread_id: userId } }
    );

    console.log(res.messages.at(-1)?.content);
    const lastStrategy = res.messages.at(-1)?.strategy;
    if (typeof lastStrategy === "string") {
        const result = JSON.parse(lastStrategy);
        console.log(result);
    }
}

await longConversation("user_123");