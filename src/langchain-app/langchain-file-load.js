import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/classic/document"
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx"
import fs from "fs";
import path from "path";

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
                return new Document({
                    pageContent: fs.readFileSync(this.file, "utf-8"),
                    metadata: {
                        source: this.file,
                    },
                });
            case ".pptx":
                return await this.#readPPTX();
            default:
                return fs.readFileSync(this.file, "utf-8");
        }
    }
    async #readPdf() {
        const loader = new PDFLoader(this.file);
        return await loader.load();
    }
    async #readDocx() {
        const loader = new DocxLoader(this.file);
        return await loader.load();
    }
    async #readPPTX() {
        const loader = new PPTXLoader(this.file);
        return await loader.load();
    }
}