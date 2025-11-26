import { ChatOpenAI } from "@langchain/openai";
import { DocxLoader } from  "@langchain/community/document_loaders/fs/docx";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import path from "path";
import url from "url";
import fs from "fs";
import dotenv from "dotenv";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
dotenv.config();


// 对话模型，用于图片分析和文档处理
const model = new ChatOpenAI({
    apiKey: process.env.API_KEY,
    model: "gpt-4o-mini", // 或者其他对话模型
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


// 图片识别函数
async function analyzeImage() {
    try {
        const messages = [
            new SystemMessage("你是一个文件查看人员，请详细描述你看到的图片内容"),
            new HumanMessage({
                content: [
                    { type: "text", text: "请你描述这个文件" },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": `data:image/jpg;base64,${getFileBase64()}`
                        }
                    }
                ]
            })
        ];

        const response = await model.invoke(messages);
        console.log("图片分析结果:", response.content);
        return response.content;
    } catch (error) {
        console.error("图片分析失败:", error);
    }
}

function getFileAddress() {
   const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
    // 读取文件内容 - 注意：文件应该是真正的 .docx 格式
    const joinPath = path.join(__dirname, "../assets/question2.docx");
    return joinPath
}

// 文档分析函数
async function analyzeDocument() {
    try {
        const docPath = getFileAddress();
        const loader = new DocxLoader(docPath);
        const documents = await loader.load();

        if (documents && documents.length > 0) {
            const documentContent = documents[0].pageContent;

            const chatPrompt = ChatPromptTemplate.fromMessages([
                ["system", "你是一个文档分析人员，请分析和总结文档内容"],
                ["human", `请分析以下文档内容：\n\n{documentContent}`],
            ])

            const prompt = await chatPrompt.invoke({ documentContent });
            const response = await model.invoke(prompt);
            console.log("文档分析结果:", response.content);
            return response.content;
        } else {
            console.log("文档内容为空");
            return null;
        }
    } catch (error) {
        console.error("文档分析失败:", error);
        return null;
    }
}


// 主函数：执行文件识别和图片生成
async function runCompleteDemo() {
    console.log("=== LangChain 多模态处理演示 ===");

    // 1. 分析现有图片
    console.log("\n=== 1. 分析现有图片 ===");
    await analyzeImage();

    // 2. 分析文档
    console.log("\n=== 2. 分析文档 ===");
    await analyzeDocument();
}


runCompleteDemo();

