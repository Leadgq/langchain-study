import { MarkdownTextSplitter } from "@langchain/textsplitters"
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import fs from "fs";
import { PromptTemplate } from "@langchain/core/prompts";
import path from "path";
import { fileURLToPath } from "url";
import { JsonMarkdownStructuredOutputParser } from "@langchain/classic/output_parsers"
import { getModel } from "../model/index.js";

const model = getModel();

function getMakerDownPath() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const makerDownPath = path.join(__dirname, "../assets/makerDown.md");
    return fs.readFileSync(makerDownPath, "utf-8");
}

async function splitMakerDown() {
    const makerPath = getMakerDownPath();

    const markdownSplitter = new MarkdownTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 100,
    })

    const chunks = await markdownSplitter.splitText(makerPath);
    return chunks;
}

const combineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: PromptTemplate.fromTemplate(
        `Answer the question based on this context: {context}\n\nQuestion: {input}`
    ),
});

console.log(combineDocsChain);