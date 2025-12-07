import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import fs from "fs";
import path from "path";
import { getLocalFilePath } from "../model/index.js";

class fileReader {
    constructor(file) {
        this.file = file;
    }
    async read() {
        switch (path.extname(this.file)) {
            case ".pdf":
                return await this.#readPdf();
            case ".docx":
                return await this.#readDocx();
            case ".text":
                return await this.#readText();
            default:
                return fs.readFileSync(this.file, "utf-8");
        }
    }
    async #readText() {
        const loader = new TextLoader(this.file);
        return await loader.load();
    }
    async #readPdf() {
        const loader = new PDFLoader(this.file);
        return await loader.load();
    }
    async #readDocx() {
        const loader = new DocxLoader(this.file);
        return await loader.load();
    }
}


const japanseText = getLocalFilePath("../assets/Japanese.text")

console.log(japanseText);