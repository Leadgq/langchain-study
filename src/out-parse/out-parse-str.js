import {getModel} from "../model/index.js"
import {StringOutputParser} from "@langchain/core/output_parsers";
import {PromptTemplate, ChatPromptTemplate} from "@langchain/core/prompts";
import {RunnableSequence} from '@langchain/core/runnables'

const prompt = new PromptTemplate({
    template: "你是一个专业的{job},将提问的{question}翻译",
    inputVariables: ["job", "question"],
});


const chatModel = getModel();

const strParser = new StringOutputParser();


const chain = RunnableSequence.from([
    prompt,
    chatModel,
    strParser,
]);

async function translate(question) {
    return await chain.invoke({job: "英语人员", question});
}

async function batchTranslate(eventList) {
    const result = await chain.batch(eventList)
    result.forEach((result, index) => {
        console.log(`${index + 1}. ${result}`)
    })
}

const batchResults = [
    {job: '英语人员', question: '我现在想睡觉了，帮我翻译成英语'},
    {job: '日语人员', question: '我现在想睡觉了，帮我翻译成日语'},
    {job: '法语人员', question: '我现在想睡觉了，帮我翻译成法语'},
]


const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", '你是一个专业的语言翻译助手，请将用户提供的中文翻译成指定的语言。'],
    ["human", "请翻译：{question}"]
])

const chatChain = RunnableSequence.from([
    chatPrompt,
    chatModel,
    strParser,
])

async function translateLanguage(questionList) {
    const results = await chatChain.batch(questionList)
    results.forEach((result, index) => {
        console.log(`翻译 ${index + 1}: ${result}`)
    })
    return results
}

const list = [
    {
        question: '我现在想睡觉了，帮我翻译成英语'
    },
    {
        question: '我现在想睡觉了，帮我翻译成日語'
    },
    {
        question: '我现在想睡觉了，帮我翻译成法語'
    },
]

// 执行翻译
translateLanguage(list);
