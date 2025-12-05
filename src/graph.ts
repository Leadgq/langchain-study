import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// 创建 LLM 实例
const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0.7,
});

// 代理节点
async function agentNode(state: any) {
  console.log("🤖 代理节点正在处理...");
  const response = await llm.invoke(state.messages);
  return {
    messages: [response],
  };
}

// 决策节点
async function shouldContinueNode(state: any) {
  console.log("🔍 决策节点正在分析...");
  const lastMessage = state.messages[state.messages.length - 1];

  // 简单的决策逻辑
  const messageContent = lastMessage.content.toString().toLowerCase();
  if (messageContent.includes("继续") || messageContent.includes("continue")) {
    return "agent";
  } else {
    return "end";
  }
}

// 创建图
export const agent = () => {
  // 使用 MessagesAnnotation 来创建有状态的图
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("should_continue", shouldContinueNode)
    .addEdge("__start__", "agent")
    .addEdge("agent", "should_continue")
    .addConditionalEdges(
      "should_continue",
      shouldContinueNode,
      {
        agent: "agent",
        end: "__end__"
      }
    );

  const app = workflow.compile();
  return app;
};

// 默认导出
export default agent;