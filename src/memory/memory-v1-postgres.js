/**
 * 使用 PostgreSQL 持久化 LangGraph 的 checkpointer（对话检查点）与 store（键值/订单等）。
 *
 * 准备：
 * 1. 可访问的 PostgreSQL 数据库
 * 2. 项目根目录 .env 中配置：DATABASE_URL=postgresql://user:pass@host:5432/dbname
 * 3. 首次运行会执行 checkpointer.setup() 与 store.setup() 自动建表/迁移
 *
 * 注意：PostgresStore 的 search 默认 limit=10，列表查询需显式传更大 limit，否则只能看到 10 条。
 *
 * 运行：pnpm run memory:postgres
 */
import "dotenv/config"
import { createAgent, createMiddleware, summarizationMiddleware, tool, trimMessages } from "langchain"
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store"
import z from "zod"
import { getModel } from "../model/index.js"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
    throw new Error("请先在 .env 中设置 DATABASE_URL（PostgreSQL 连接串）")
}

const mainModel = getModel()
const summaryModel = getModel()

const userId = "user123"
/** 与 InMemory 行为接近：单页尽量多取；按业务可改为分页 */
const ORDER_SEARCH_LIMIT = 500

const checkpointer = PostgresSaver.fromConnString(DATABASE_URL, { schema: "public" })
const store = PostgresStore.fromConnString(DATABASE_URL, { schema: "public" })

const metaNamespace = ["orders_meta", userId]
const nextIdKey = "next_id"

const createOrder = tool(
    async ({ customerName, items, totalPrice }, config) => {
        const meta = await config.store.get(metaNamespace, nextIdKey)
        const n = meta?.value?.n ?? 1
        const orderId = `ORD-${String(n).padStart(3, "0")}`

        const orderData = {
            id: orderId,
            customer: customerName,
            status: "pending",
            total: totalPrice,
            items,
            createdAt: new Date().toISOString(),
        }

        await config.store.put(["orders", userId], orderId, orderData)
        await config.store.put(metaNamespace, nextIdKey, { n: n + 1 })

        return `订单已创建，客户 ${customerName} 订单商品为 ${items.join("，")}，当前商品状态为 ${orderData.status}，订单总价为 ${totalPrice} 元。订单编号：${orderId}`
    },
    {
        name: "create_order",
        description: "创建订单",
        schema: z.object({
            customerName: z.string().describe("Customer name"),
            items: z.array(z.string()).describe("List of items in the order"),
            totalPrice: z.number().describe("Total order price"),
        }),
    }
)

const getOrderList = tool(
    async ({}, config) => {
        try {
            const allOrders = await config.store.search(["orders", userId], {
                limit: ORDER_SEARCH_LIMIT,
            })
            if (!allOrders || allOrders.length === 0) {
                return "还没有订单"
            }
            const orderSummary = allOrders
                .map((item) => {
                    const order = item.value
                    return `客户${order.customer} - ${order.items.join("、")} - ${order.total}元-订单状态${order.status}`
                })
                .join("\n")
            return `订单列表(共${allOrders.length}个):\n${orderSummary}`
        } catch (error) {
            return `查询订单列表出错：${error.message}`
        }
    },
    {
        name: "get_order_list",
        description: "查询所有订单",
        schema: z.object({}),
    }
)

const getOrderByName = tool(
    async ({ customerName }, config) => {
        try {
            const allOrders = await config.store.search(["orders", userId], {
                limit: ORDER_SEARCH_LIMIT,
            })
            const orderItem = allOrders.find((item) => item.value.customer === customerName)
            if (orderItem) {
                const order = orderItem.value
                return `客户 ${customerName} 的订单详情：\n订单ID: ${order.id}\n商品: ${order.items.join("、")}\n总价: ${order.total}元\n状态: ${order.status}`
            }
            return `客户 ${customerName} 没有找到订单`
        } catch (error) {
            return `查询订单出错：${error.message}`
        }
    },
    {
        name: "get_order_by_name",
        description: "根据客户姓名查询订单详情",
        schema: z.object({
            customerName: z.string().describe("Customer name"),
        }),
    }
)

const updateOrderStatus = tool(
    async ({ orderId, newStatus }, config) => {
        try {
            const result = await config.store.get(["orders", userId], orderId)
            if (!result || !result.value) {
                return `订单 ${orderId} 不存在`
            }
            const order = result.value
            order.status = newStatus
            await config.store.put(["orders", userId], orderId, order)
            return `订单 ${orderId} 状态已更新为 ${newStatus}`
        } catch (error) {
            return `更新订单状态出错：${error.message}`
        }
    },
    {
        name: "update_order_status",
        description: "更新订单状态",
        schema: z.object({
            orderId: z.string().describe("Order ID"),
            newStatus: z.string().describe("New order status"),
        }),
    }
)

const trimMessageHistory = createMiddleware({
    name: "TrimMessages",
    beforeModel: async (state) => {
        const trimmed = await trimMessages(state.messages, {
            strategy: "last",
            maxTokens: 2000,
            startOn: "human",
            endOn: ["human", "tool"],
            tokenCounter: (msgs) => msgs.length,
        })
        return { messages: trimmed }
    },
})

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
        summarizationMiddleware({
            model: summaryModel,
            trigger: { tokens: 1000 },
            keep: { messages: 25 },
        }),
        trimMessageHistory,
    ],
})

async function main() {
    await checkpointer.setup()
    await store.setup()
    console.log("PostgreSQL checkpointer 与 store 已就绪。")

    const result = await agent.invoke(
        { messages: [{ role: "user", content: "你好，请用一句话介绍你能做什么" }] },
        { configurable: { thread_id: userId } }
    )
    const last = result.messages[result.messages.length - 1]
    console.log("助手:", last.content)
}

main()
    .catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
    .finally(async () => {
        await checkpointer.end()
        await store.stop()
    })
