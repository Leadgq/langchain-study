import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.API_KEY,
        model: "text-embedding-3-small",
        dimensions: 512,
        configuration: {
            baseURL: process.env.BASE_URL,
        }
    });

    // ===== 第一次：创建并保存 =====
    console.log("1. 创建向量存储并添加文档...");
    const vectorStore = new FaissStore(embeddings, {});

    const documents = [
        new Document({
            pageContent: "Python是一门编程语言",
            metadata: { source: "wiki" },
        }),
        new Document({
            pageContent: "JavaScript用于网络开发",
            metadata: { source: "wiki" },
        }),
    ];

    await vectorStore.addDocuments(documents);
    console.log("✓ 文档已添加\n");

    // 保存到磁盘
    console.log("2. 保存向量存储到磁盘...");
    await vectorStore.save("./faiss_index");
    console.log("✓ 保存成功！生成的文件:");

    // 显示生成的文件
    const files = fs.readdirSync("./faiss_index");
    files.forEach(file => {
        const stats = fs.statSync(`./faiss_index/${file}`);
        console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("3. 测试搜索（使用新创建的向量存储）");
    console.log("=".repeat(50));

    const results1 = await vectorStore.similaritySearch("Python", 1);
    console.log(`搜索结果: ${results1[0].pageContent}\n`);

    // ===== 第二次：从磁盘加载 =====
    console.log("=".repeat(50));
    console.log("4. 重新加载向量存储（从磁盘）");
    console.log("=".repeat(50));

    const loadedStore = await FaissStore.load("./faiss_index", embeddings);
    console.log("✓ 向量存储已从磁盘加载\n");

    // 使用加载的向量存储进行搜索
    const results2 = await loadedStore.similaritySearch("JavaScript", 1);
    console.log(`搜索结果: ${results2[0].pageContent}\n`);

    // ===== 验证数据一致性 =====
    console.log("=".repeat(50));
    console.log("5. 验证数据一致性");
    console.log("=".repeat(50));

    const allResults = await loadedStore.similaritySearch("语言", 2);
    console.log("所有文档:");
    allResults.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.pageContent}`);
    });
}

main().catch(console.error);