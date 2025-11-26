import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import path from "path";
import url from "url";
import fs from "fs";
import dotenv from "dotenv";
import { HumanMessage } from "langchain";
dotenv.config();


const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-5.1",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

function getFileBase64() {
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
    // 读取文件内容
    const joinPath = path.join(__dirname, "../assets/AI.png");
    return fs.readFileSync(joinPath, "base64");
}


const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个文件查看人员"],
    new HumanMessage({
        content: [
            { type: "text", text: "请你描述这个文件" },
            { "type": "image_url", "image_url": { "url": `data:image/jpg;base64,${getFileBase64()}` } }
        ]
    }),
])

chatPrompt.invoke().then((res) => {
    return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})
