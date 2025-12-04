import { MarkdownTextSplitter } from "@langchain/textsplitters"
import { Document } from "@langchain/core/documents";
import fs from "fs";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import path from "path";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getModel, getLocalFilePath } from "../model/index.js";
import { createAgent, summarizationMiddleware, tool, trimMessages } from "langchain"
import { MemorySaver } from "@langchain/langgraph"
import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";


// markdown 向量位置
const vectorStorePath = getLocalFilePath("../assets/vectorStore.json");

const mainModel = getModel();
const summaryModel = getModel();
const checkpointer = new MemorySaver();


const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.API_KEY,
    model: "text-embedding-3-small",
    dimensions: 512,
    configuration: {
        baseURL: process.env.BASE_URL,
    }
});

function getMakerDownPath() {
    const makerDownPath = getLocalFilePath("../assets/makerDown.md");
    return {
        makerDownContent: fs.readFileSync(makerDownPath, "utf-8"),
        makerDownPath,
    }
}

async function splitMakerDown() {
    const { makerDownContent, makerDownPath } = getMakerDownPath();
    const document = new Document({
        pageContent: makerDownContent,
        metadata: { source: makerDownPath },
    });
    const markdownSplitter = new MarkdownTextSplitter({
        chunkSize: 200,
        chunkOverlap: 100,
    });
    const chunks = await markdownSplitter.splitDocuments([document]);
    return chunks;
}

async function loadVectorStore() {
    try {
        if (!fs.existsSync(vectorStorePath)) {
            return null;
        }
        const data = JSON.parse(fs.readFileSync(vectorStorePath, "utf-8"));

        const documents = data.vectors.map((item) =>
            new Document({
                pageContent: item.content,
                metadata: { embedding: item.embedding }, // 将向量存储在元数据中
            })
        );

        const vectorStore = new MemoryVectorStore(embeddings);

        await vectorStore.addDocuments(documents)

        return vectorStore;
    }
    catch (error) {
        console.error("加载失败:", error);
        return null;
    }
}

async function saveVectorStore(vectorStore) {
    try {
        const indexData = {
            vectors: vectorStore.memoryVectors,  // 向量数据
            docstore: vectorStore.docstore       // 文档存储
        };

        // 确保目录存在
        const dir = path.dirname(vectorStorePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(vectorStorePath, JSON.stringify(indexData, null, 2));
        console.log(`✓ 向量存储已保存到: ${vectorStorePath}`);
    } catch (error) {
        console.error("保存向量存储失败:", error);
    }

}

async function vectorizeMarkdown() {
    try {
        let vectorStore = await loadVectorStore();

        if (vectorStore) {
            console.log('已存在向量存储');
            const retriever = vectorStore.asRetriever({ k: 3 });
            return { vectorStore, retriever };
        }

        const chunks = await splitMakerDown();

        vectorStore = await MemoryVectorStore.fromDocuments(
            chunks,
            embeddings,
        );
        console.log('向量化完毕');

        await saveVectorStore(vectorStore);
        console.log('保存完毕');
        const retriever = vectorStore.asRetriever({ k: 3 });
        return { vectorStore, retriever };
    } catch (error) {
        console.error("向量化失败:", error);
        return null;
    }
}

const queryMarkdown = tool(async ({ question }) => {
    const { retriever } = await vectorizeMarkdown();
    const relevantDocs = await retriever.invoke(question);
    return relevantDocs
        .map(doc => doc.pageContent)
        .join('\n---\n');
}, {
    name: 'query_markdown',
    description: '查询文档',
    schema: z.object({
        question: z.string().describe("用户的问题"),
    })
});

const agent = createAgent({
    model: mainModel,
    tools: [queryMarkdown],
    systemPrompt: `你是一个文档查看助手，
    你可以根据用户的问题查看文档内容。
    请你根据文档的内容回答用户的问题。如果文档中没有相关内容，
    请回答“文档中没有相关内容”。`,
    checkpointer,
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
            messages: await trimMessages(state.messages, {
                strategy: "last",
                maxTokens: 2000,
                startOn: "human",
                endOn: ["human", "tool"],
                tokenCounter: (msgs) => msgs.length,
            }),
        };
    },
});

const userId = "user-123";

async function runChat(userInput) {
    const result = await agent.invoke(
        { messages: [{ role: "user", content: userInput }] },
        { configurable: { thread_id: userId } }
    );
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content;
}

const response = await runChat("vue3那年发布,并且介绍一下vue3的新特性");
console.log(response);
