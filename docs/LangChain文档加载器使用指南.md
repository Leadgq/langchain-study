# 📚 LangChain 文档加载器使用指南

## 概述

LangChain Community 提供了丰富的文档加载器，支持多种文件格式和数据源。本文档详细介绍了各种文档加载器的引入方式和使用方法。

## 📦 安装依赖

```bash
npm install @langchain/community
# 或
pnpm add @langchain/community
# 或
yarn add @langchain/community
```

确保 package.json 中包含：

```json
{
  "dependencies": {
    "@langchain/community": "^1.0.4",
    "@langchain/core": "^1.0.6"
  }
}
```

## 🔧 基本引入路径结构

### 文件系统文档加载器 (fs)

```javascript
// Word 文档
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

// PDF 文档
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// CSV 文件
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

// EPUB 电子书
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";

// PowerPoint 演示文稿
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";

// 字幕文件
import { SRTLoader } from "@langchain/community/document_loaders/fs/srt";

// 非结构化文档
import { UnstructuredLoader } from "@langchain/community/document_loaders/fs/unstructured";
```

### Web 文档加载器 (web)

```javascript
// 网页基础加载器
import { WebBaseLoader } from "@langchain/community/document_loaders/web/web_base";

// 更多 web 加载器...
```

## 📄 支持的文件格式详解

### 1. DOCX 文档加载器

**功能**: 加载 Word 文档 (.docx, .doc)

```javascript
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

// 基本用法
const loader = new DocxLoader("path/to/document.docx");

// 带选项的用法
const options = {
  type: "docx" // 或 "doc"
};
const loader = new DocxLoader("path/to/document.docx", options);

// 使用 Blob 对象
const loader = new DocxLoader(blobObject, options);

// 加载文档
const documents = await loader.load();

// 处理文档内容
if (documents && documents.length > 0) {
  const documentContent = documents[0].pageContent;
  console.log("文档内容:", documentContent);
}
```

### 2. PDF 文档加载器

**功能**: 加载 PDF 文件，支持分页

```javascript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// 基本用法
const loader = new PDFLoader("path/to/document.pdf");

// 带选项的用法
const loader = new PDFLoader("path/to/document.pdf", {
  splitPages: true,           // 是否分页处理
  parsedItemSeparator: "\n"   // 分页分隔符
});

// 加载文档
const docs = await loader.load();
console.log(`加载了 ${docs.length} 页文档`);
```

### 3. CSV 文档加载器

**功能**: 加载 CSV 文件，每行转换为文档

```javascript
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

// 默认用法 - 每行转为键值对
const loader = new CSVLoader("path/to/file.csv");

// 指定列作为内容
const loader = new CSVLoader("path/to/file.csv", "content_column");

// 带完整选项
const options = {
  column: "content",    // 指定列名
  separator: ","        // 自定义分隔符
};
const loader = new CSVLoader("path/to/file.csv", options);

const docs = await loader.load();
```

### 4. 其他文档加载器

```javascript
// EPUB 加载器
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
const epubLoader = new EPubLoader("path/to/book.epub");

// PPTX 加载器
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
const pptxLoader = new PPTXLoader("path/to/presentation.pptx");

// SRT 字幕加载器
import { SRTLoader } from "@langchain/community/document_loaders/fs/srt";
const srtLoader = new SRTLoader("path/to/subtitles.srt");
```

## 📋 返回的文档结构

所有文档加载器都返回标准的 `Document` 对象数组：

```javascript
[
  {
    pageContent: "文档的文本内容...",
    metadata: {
      source: "文件路径或来源",
      // 其他元数据字段（如页码、创建时间等）
    }
  }
]
```

## 🎯 完整使用示例

```javascript
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

class DocumentProcessor {
  constructor() {
    this.model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini"
    });
  }

  // 处理 DOCX 文件
  async processDocx(filePath) {
    try {
      const loader = new DocxLoader(filePath);
      const documents = await loader.load();

      if (documents && documents.length > 0) {
        return await this.analyzeContent(documents[0].pageContent);
      }
      return null;
    } catch (error) {
      console.error("DOCX 处理失败:", error);
      return null;
    }
  }

  // 处理 PDF 文件
  async processPdf(filePath) {
    try {
      const loader = new PDFLoader(filePath, { splitPages: false });
      const documents = await loader.load();

      if (documents && documents.length > 0) {
        const combinedContent = documents.map(doc => doc.pageContent).join('\n\n');
        return await this.analyzeContent(combinedContent);
      }
      return null;
    } catch (error) {
      console.error("PDF 处理失败:", error);
      return null;
    }
  }

  // 处理 CSV 文件
  async processCsv(filePath) {
    try {
      const loader = new CSVLoader(filePath);
      const documents = await loader.load();

      const contents = documents.map(doc => doc.pageContent);
      return await this.analyzeContent(contents.join('\n\n'));
    } catch (error) {
      console.error("CSV 处理失败:", error);
      return null;
    }
  }

  // AI 分析内容
  async analyzeContent(content) {
    const messages = [
      new SystemMessage("你是一个文档分析专家，请分析和总结文档内容"),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `请分析以下文档内容：\n\n${content}`
          }
        ]
      })
    ];

    const response = await this.model.invoke(messages);
    return response.content;
  }
}

// 使用示例
async function main() {
  const processor = new DocumentProcessor();

  // 处理不同类型的文档
  const docxResult = await processor.processDocx("./documents/report.docx");
  const pdfResult = await processor.processPdf("./documents/manual.pdf");
  const csvResult = await processor.processCsv("./data/survey.csv");

  console.log("DOCX 分析结果:", docxResult);
  console.log("PDF 分析结果:", pdfResult);
  console.log("CSV 分析结果:", csvResult);
}
```

## 🔍 实际项目中的应用

参考项目中的 [use-exmplae-fileUse.js](src/use-explame/use-exmplae-fileUse.js) 文件，展示了完整的文档处理流程：

```javascript
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import path from "path";
import url from "url";

// 获取文件路径的辅助函数
function getFileAddress() {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  return path.join(__dirname, "../assets/question2.docx");
}

// 文档分析函数
async function analyzeDocument() {
  try {
    const docPath = getFileAddress();
    const loader = new DocxLoader(docPath);
    const documents = await loader.load();

    if (documents && documents.length > 0) {
      const documentContent = documents[0].pageContent;

      // 使用 AI 分析文档内容
      const messages = [
        new SystemMessage("你是一个文档分析人员，请分析和总结文档内容"),
        new HumanMessage({
          content: [{
            type: "text",
            text: `请分析以下文档内容：\n\n${documentContent}`
          }]
        })
      ];

      const response = await model.invoke(messages);
      console.log("文档分析结果:", response.content);
      return response.content;
    }
  } catch (error) {
    console.error("文档分析失败:", error);
    return null;
  }
}
```

## 📚 相关资源

- **LangChain JS 官方文档**: https://js.langchain.com/
- **Community 包文档**: https://github.com/langchain-ai/langchainjs
- **项目中的 README**: [node_modules/@langchain/community/README.md](node_modules/@langchain/community/README.md)
- **类型定义文件**: [node_modules/@langchain/community/dist/document_loaders/fs/](node_modules/@langchain/community/dist/document_loaders/fs/)

## ⚠️ 注意事项

1. **依赖管理**: 确保所有 `@langchain` 包使用相同版本的 `@langchain/core`
2. **文件路径**: 使用绝对路径或正确的相对路径
3. **错误处理**: 始终包含适当的错误处理逻辑
4. **内存管理**: 处理大文件时注意内存使用
5. **编码格式**: 确保文档使用正确的文本编码

---

*最后更新: 2025年11月*