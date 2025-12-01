import {ChatMessageHistory}  from  "@langchain/classic/memory"
import {getModel} from "../model/index.js"
// notice: all these methods have been abandoned in langchain
// 你可以继续使用 但不建议
const messageHistory = new ChatMessageHistory();
const model = getModel();


messageHistory.addUserMessage("我的名字叫做张三");
messageHistory.addAIMessage("你好，张三！");
messageHistory.addUserMessage("你能帮我计算1+1吗？");

const result = await model.invoke(messageHistory.messages);
console.log(result.content);
messageHistory.addAIMessage(result.content);
messageHistory.addUserMessage("你好，我叫什么？");
 
const result2 = await model.invoke(messageHistory.messages);
console.log(result2.content);

