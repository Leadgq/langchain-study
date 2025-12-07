import { Document } from "@langchain/core/documents";
import {
    RecursiveCharacterTextSplitter,
    TokenTextSplitter,
    CharacterTextSplitter,
    SupportedTextSplitterLanguages,
    LatexTextSplitter,
    MarkdownTextSplitter
} from "@langchain/textsplitters"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getModel } from "../model/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const model = getModel();
const outputParser = new StringOutputParser();


function getJapaneseText() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const japaneseText = fs.readFileSync(path.join(__dirname, "../assets/Japanese.text"), "utf-8");
    return japaneseText;
}

class textSplitter {
    constructor() {
        this.llm = model;
        // 分句器
        this.sentenceSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 0,
            separators: ["\n\n", "\n", "。", "！", "？", "．"], // 中日文句末标点
        });
        // 段落分割器
        this.paragraphSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1500,
            chunkOverlap: 100,
            separators: ["\n\n", "\n", "。", "！", "？"],
        });
    }
    analyzeTextComplexity(text) {
        const features = {
            sentenceCount: text.split(/[。！？\.!?]/).length,
            hasTechnicalTerms: /[A-Za-z]{3,}|[Ａ-Ｚａ-ｚ]{3,}/.test(text),
            hasNumbers: /[\d]/.test(text),
            paragraphLength: text.length,
        };

        if (features.sentenceCount === 1 && !features.hasTechnicalTerms) {
            return "SIMPLE_SENTENCE";
        } else if (features.sentenceCount <= 3 && features.paragraphLength < 800) {
            return "PARAGRAPH";
        } else {
            return "COMPLEX_SECTION";
        }
    }

    async translateSimpleSentence(sentences) {
        const prompt = ChatPromptTemplate.fromMessages(
            [
                ["system", `请将以下日语句子翻译成中文。保持简洁准确，不需要额外解释`],
                ["human", "{sentence}"],
            ]
        );
        const chain = prompt.pipe(this.llm).pipe(outputParser);
        return await chain.invoke({ sentence: sentences });
    }

    async translateComplexSection(section, sectionTitle = "") {
        const titlePart = sectionTitle ? `章节标题：${sectionTitle}\n\n` : "";
        const chatPrompt = ChatPromptTemplate.fromMessages(
            [
                ["system", `{titlePart}请将以下日语文本完整翻译成中文。这是一个逻辑连贯的章节，请特别注意：
                1. 保持术语在整个章节中的一致性
                2. 确保跨句子的指代关系清晰
                3. 保留原文的论证逻辑和语气`],
                ["human", "{section}"],
            ]
        );
        const chain = chatPrompt.pipe(this.llm).pipe(outputParser);
        return await chain.invoke({ section: section, titlePart: titlePart });
    }
    async translateDocument(documentText) {
        const paragraphs = await this.paragraphSplitter.createDocuments([documentText]);

        const translatedResults = [];

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i].pageContent;
            console.log(`\n--- 处理段落 ${i + 1}/${paragraphs.length} ---`);

            const complexity = this.analyzeTextComplexity(paragraph);
            console.log(`分析结果：${complexity}`);

            let translatedText;

            switch (complexity) {
                case "SIMPLE_SENTENCE":
                    // 简单句子直接翻译
                    const sentences = await this.sentenceSplitter.createDocuments([paragraph]);
                    const sentenceTexts = sentences.map(s => s.pageContent);
                    const translatedSentences = await this.translateSimpleSentence(sentenceTexts);
                    translatedText = translatedSentences.join(' ');
                    break;

                case "COMPLEX_SECTION":
                    // 复杂章节，完整上下文处理
                    translatedText = await this.translateComplexSection(paragraph, `段落${i + 1}`);
                    break;
            }

            translatedResults.push(translatedText);
            console.log(`✅ 完成翻译`);
        }

        return this.postProcessTranslation(translatedResults);
    }

    async postProcessTranslation(translatedChunks) {
        console.log("\n🔧 进行后处理...");

        const fullText = translatedChunks.join('\n\n');

        const terminologyCheckPrompt = `
            请检查以下中文翻译，确保专业术语在整个文档中保持一致。如果发现不一致的术语，请统一使用最合适的译法。

            翻译内容：
            ${fullText}

            请输出统一后的完整中文内容：
            `.trim();

        const finalResult = await this.llm.invoke(terminologyCheckPrompt);
        return finalResult.content;
    }
}

// 演示使用
async function demo() {
    const translator = new textSplitter();

    // 示例日语文档（混合了简单句子和复杂段落）
    const japaneseDocument = getJapaneseText();
    try {
        console.log("📖 原始日语文档：");
        console.log(japaneseDocument);
        console.log("\n" + "=".repeat(50) + "\n");

        const translated = await translator.translateDocument(japaneseDocument);

        console.log("\n🎉 最终翻译结果：");
        console.log(translated);

    } catch (error) {
        console.error("翻译过程中出错：", error);
    }
}

demo();