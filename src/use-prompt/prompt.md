# 提示词语的创建

## 什么是提示词语

提示词语是指在使用语言模型时，输入给模型的文本，用于引导模型生成特定的输出。

```typescript
import { ChatOpenAI } from "@langchain/openai";
import {PromptTemplate} from "@langchain/core/prompts";
import dotenv from "dotenv";

// 加载环境变量
import dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
    apiKey: process.env.API_KEY, 
    // you can select the model which you want to use
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

const prompt = new PromptTemplate({
    inputVariables: ["question"],
    template: "你是一个专业的翻译人员,你将${question}翻译",
})

// you have two ways to use the prompt
// 1. use the prompt.format method
// 2. use the prompt.invoke method

// 1. use the prompt.format method
//  the method will return a promise 
prompt.format({
    question: "我想吃肉翻译成日语",
}).then((res) => {
    return model.invoke(res);
}).then((res) => {
    // you will get the result of the translation
    console.log(res.content);
})

//2. use the prompt.invoke method
// the method will return a promise
prompt.invoke({
    question: "我想吃肉翻译成日语",
}).then((res) => {
    return model.invoke(res.value);
}).then((res) => {
    // you will get the result of the translation
    console.log(res.content);
})
```