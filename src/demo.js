import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 创建 LLM 实例
const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  openAIApiKey: process.env.API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL
  }
});

// 代理节点 - 处理用户输入
async function agentNode(state) {
  console.log("🤖 代理节点正在处理消息...");
  const response = await llm.invoke(state.messages);
  return {
    messages: [response],
  };
}

// 创建简单的对话流程图
export function createSimpleAgent() {
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  return workflow.compile();
}

// 使用示例
async function runDemo() {
  console.log("🚀 开始 LangGraph 演示...");

  const app = createSimpleAgent();

  // 模拟对话
  const userInput = new HumanMessage("你好！请介绍一下 LangGraph 的主要特点。");

  try {
    const result = await app.invoke({
      messages: [userInput]
    });

    console.log("\n📋 AI 回复:");
    console.log(result.messages[result.messages.length - 1].content);
  } catch (error) {
    console.error("❌ 运行出错:", error.message);
  }
}

// 导出函数供外部调用
export { runDemo };

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}