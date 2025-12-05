import { createAgent, summarizationMiddleware, tool, trimMessages } from "langchain"
import { MemorySaver, InMemoryStore } from "@langchain/langgraph"
import readline from 'readline';

import { getModel } from "../model/index.js";
import z from "zod";
const mainModel = getModel();
const summaryModel = getModel();


// 下一个订单ID
let nextOrderId = 1;

// 记忆功能
const checkpointer = new MemorySaver();
// 创建内存存储
const store = new InMemoryStore();

const userId = "user123";
const createOrder = tool(
    async ({ customerName, items, totalPrice }, config) => {
        const orderId = `ORD-${String(nextOrderId).padStart(3, "0")}`;
        nextOrderId++;

        const orderData = {
            id: orderId,
            customer: customerName,
            status: "pending",
            total: totalPrice,
            items,
            createdAt: new Date().toISOString(),
        };

        await config.store.put(
            ['orders', userId],
            orderId,
            orderData,
        )
        return `订单已创建，客户 ${customerName} 订单商品为 ${items.join("，")}，当前商品状态为 ${orderData.status}，订单总价为 ${totalPrice} 元。订单编号：${orderId}`
    }, {
    name: 'create_order',
    defaultConfig: '创建订单',
    schema: z.object({
        customerName: z.string().describe("Customer name"),
        items: z.array(z.string()).describe("List of items in the order"),
        totalPrice: z.number().describe("Total order price"),
    })
}
)

const getOrderList = tool(
    async ({ }, config) => {
        try {
            const allOrders = await config.store.search(
                ["orders", userId]
            );

            if (!allOrders || allOrders.length === 0) {
                return "还没有订单";
            }

            const orderSummary = allOrders.map(item => {
                const order = item.value;
                return `客户${order.customer} - ${order.items.join("、")} - ${order.total}元-订单状态${order.status}`;
            }).join("\n");

            return `订单列表(共${allOrders.length}个):\n${orderSummary}`;
        } catch (error) {
            return `查询订单列表出错：${error.message}`;
        }
    }, {
    name: 'get_order_list',
    description: "查询所有订单",
    schema: z.object({})
}
)

const getOrderByName = tool(
    async ({ customerName }, config) => {
        try {
            const allOrders = await config.store.search(
                ["orders", userId]
            );
            
            const orderItem = allOrders.find(item =>
                item.value.customer === customerName
            );

            if (orderItem) {
                const order = orderItem.value;
                return `客户 ${customerName} 的订单详情：\n订单ID: ${order.id}\n商品: ${order.items.join("、")}\n总价: ${order.total}元\n状态: ${order.status}`;
            } else {
                return `客户 ${customerName} 没有找到订单`;
            }
        } catch (error) {
            // 错误时也要返回字符串，不要返回 undefined
            return `查询订单出错：${error.message}`;
        }
    }, {
    name: 'get_order_by_name',
    description: "根据客户姓名查询订单详情",
    schema: z.object({
        customerName: z.string().describe("Customer name"),
    })
}
)

const updateOrderStatus = tool(
    async ({ orderId, newStatus }, config) => {
        try {
            const result = await config.store.get(
                ["orders", userId],
                orderId
            );

            if (!result || !result.value) {  // ✅ 检查 result.value
                return `订单 ${orderId} 不存在`;
            }

            const order = result.value;  // ✅ 从 .value 获取数据
            order.status = newStatus;

            // 更新订单
            await config.store.put(
                ["orders", userId],
                orderId,
                order
            );

            return `订单 ${orderId} 状态已更新为 ${newStatus}`;
        } catch (error) {
            return `更新订单状态出错：${error.message}`;
        }
    }, {
    name: 'update_order_status',
    description: "更新订单状态",
    schema: z.object({
        orderId: z.string().describe("Order ID"),
        newStatus: z.string().describe("New order status"),
    })
}
)

const agent = createAgent({
    model: mainModel,
    tools: [createOrder, getOrderList, getOrderByName, updateOrderStatus],
    systemPrompt: `
    你是一个专业的订单助手，负责处理客户订单事务。
        你能够：
        1. 创建新订单
        2. 查询订单详情
        3. 根据订单中的用户名称查询订单
        4. 列出特定客户的所有订单
        5. 更新订单状态(其中pending为待处理，shipped为已发货，delivered为已交付)，在返回状态的时候应该返回对应的中文状态
        请根据客户的需求调用相应的工具，并提供清晰准确的回复,在返回的时候不要忘记包含订单ID。
    `,
    checkpointer,
    store,
    middleware: [
        // 先对消息进行总结
        summarizationMiddleware({
            model: summaryModel,
            trigger: { tokens: 1000 },
            keep: { messages: 25 },
        })
    ],
    preModelHook: async (state) => {
        return {
            // 对消息进行裁剪，保留最后2000个token
            messages: await trimMessages(state.messages, {
                strategy: "last",
                maxTokens: 2000,
                startOn: "human",
                endOn: ["human", "tool"],
                tokenCounter: (msgs) => msgs.length,
            }),
        };
    },
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function runChat() {
    console.log("订单助手已启动。输入 'exit' 退出。\n");

    while (true) {
        const userInput = await askQuestion("客户: ");

        if (userInput.toLowerCase() === "exit") {
            console.log("再见！");
            rl.close();
            break;
        }

        const result = await agent.invoke(
            { messages: [{ role: "user", content: userInput }] },
            { configurable: { thread_id: userId } }
        );

        const lastMessage = result.messages[result.messages.length - 1];
        console.log(`助手: ${lastMessage.content}\n`);
    }
}

runChat();