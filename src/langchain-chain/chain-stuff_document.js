import { getModel, formateModelMessageToObject } from '../model/index.js';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
// new version of langchain.
// the createStuffDocumentsChain method moved to @langchain/classic/chains/combine_documents in node.js
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { z } from 'zod';

import { MapReduceDocumentsChain }  from  "@langchain/classic/chains"

const model = getModel();

const [parser, formatInstructions] = formateModelMessageToObject({
    question: z.string().describe("The customer's question"),
    answer: z.string().describe("The AI's answer to the customer's question"),
})

async function answerAndSummary(question) {
    // create the prompt template to use the parser
    // notice: If you use the partial method, you have to use await to handle the promise state.
    // cause: the syntax of node.js is different from of python.
    const chainTemplatePrompt = await ChatPromptTemplate.fromTemplate(`
 你是一个专业的文档分析助手。请根据提供的上下文信息回答用户的问题。

上下文信息：
{context}
并且使用{format_instructions}

用户问题：{input}

请根据以上上下文信息，提供准确、详细的回答。如果上下文信息中没有足够的信息来回答问题，请如实告知。
`).partial({ format_instructions: formatInstructions });

    // 只要是chain就可以invoke
    const chain = await createStuffDocumentsChain({
        llm: model,
        prompt: chainTemplatePrompt,
        outputParser: parser,
    });

    const documents = [
        new Document({
            pageContent: `LangChain 是一个用于开发由语言模型驱动的应用程序的框架。
        它提供了一套工具和组件，使开发者能够更容易地构建复杂的应用程序。`,
            metadata: { source: "langchain-intro", type: "framework" }
        }),
        new Document({
            pageContent: `createStuffDocumentsChain 是 LangChain 中的一个重要组件，
        它允许你将多个文档"填充"到提示中，然后传递给语言模型进行处理。`,
            metadata: { source: "chains-docs", type: "component" }
        }),
    ]

    const result = await chain.invoke({
        input: question,
        context: documents,
    });

    return result;
}

const question = "LangChain 是什么？createStuffDocumentsChain 有什么作用？";

const result = await answerAndSummary(question);
console.log(result);
