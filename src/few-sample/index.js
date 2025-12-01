import {
  FewShotPromptTemplate,
  FewShotChatMessagePromptTemplate,
  ChatPromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";
import { getModel } from "../model/index.js";

// 1. 创建示例数据
const examples = [
  {
    question: "谁赢得了2020年美国总统大选？",
    answer: "乔·拜登赢得了2020年美国总统大选。",
  },
  {
    question: "法国的首都是哪里？",
    answer: "法国的首都是巴黎。",
  },
  {
    question: "太阳系中最大的行星是哪个？",
    answer: "太阳系中最大的行星是木星。",
  },
];

// 注意: 上述的变量缺一不可，这样一个提示模板就准备好了
const shortTemplate = new FewShotPromptTemplate({
  examples,
  // You need to specify the input variables
  examplePrompt: new PromptTemplate({
    inputVariables: ["question", "answer"],
    template: '用户的问题: {question}\nAI助手的回答: {answer}'
  }),
  prefix: "你是一个有帮助的AI助手。请参考以下对话示例回答用户问题：\n\n",
  suffix: "\n用户的问题: {question}\nAI助手的回答: ",
  inputVariables:['question']
})


shortTemplate.invoke({ question: "中国首都是哪里？" }).then((res) => {
  const model = getModel();
  model.invoke(res).then((res) => {
    console.log(res.content);
  });   
});
