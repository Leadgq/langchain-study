import {
  FewShotPromptTemplate,
  FewShotChatMessagePromptTemplate,
  ChatPromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";
import { getModel } from "../model/index.js";

// this's the example of fewShotStringPromptExample
function fewShotStringPromptExample() {
  console.log("====== FewShotPromptTemplate vs FewShotChatMessagePromptTemplate 对比 ======");

  // ==================== 方法1: 使用 FewShotPromptTemplate ====================

  console.log("\n📝 方法1: FewShotPromptTemplate (字符串格式)");

  const fewShotStringPrompt = new FewShotPromptTemplate({
    examples: [
    {
      input: "我想学习编程",
      output: "学习编程是个很好的选择！建议你从Python开始，因为它语法简单，适合初学者。",
    },
    {
      input: "如何提高英语水平？",
      output: "提高英语水平需要多方面努力：多读、多听、多说、多写。每天坚持30分钟的学习效果最好。",
    },
    ],
    examplePrompt: new PromptTemplate({
      inputVariables: ["input", "output"],
      template: "用户问题：{input}\nAI回答：{output}",
    }),
    prefix: "你是一个有帮助的AI助手。请参考以下对话示例回答用户问题：\n\n",
    suffix: "\n\n用户问题：{user_input}\nAI回答：",
    inputVariables: ["user_input"],
  });

  fewShotStringPrompt.format({
    user_input: "我该选择什么专业？",
  }).then((res) => {
    const model = getModel();
    model.invoke(res).then((res) => {
      console.log(res.content);
    })
  })
}

// ==================== 方法2: 使用 FewShotChatMessagePromptTemplate ====================

console.log("\n💬 方法2: FewShotChatMessagePromptTemplate (消息格式)");

// create a template
const fewShotChatPrompt = new FewShotChatMessagePromptTemplate({
  examples:  [
    {
      input: "我想学习编程",
      output: "学习编程是个很好的选择！建议你从Python开始，因为它语法简单，适合初学者。",
    },
    {
      input: "如何提高英语水平？",
      output: "提高英语水平需要多方面努力：多读、多听、多说、多写。每天坚持30分钟的学习效果最好。",
    },
  ],
  examplePrompt: ChatPromptTemplate.fromMessages(
    [
      ["human", '{input}'],
      ["ai", '{output}'],
    ]
  ),
  inputVariables: ["input"],
});

const finalTemplate = ChatPromptTemplate.fromMessages(
  [
      ["system", '你是一个有帮助的AI助手。请参考以下对话示例回答用户问题：\n\n'],
      fewShotChatPrompt,
      ["human", '{input}'],
  ],
)


async function answer(input) {
  const template = await finalTemplate.invoke({ input });
  const model = getModel();
  const res = await model.invoke(template);
  console.log(res.content);
  return res.content;
}

async function test(){
  await answer("我该选择什么专业？");
  await answer('我想学习唱歌')
}

test();
