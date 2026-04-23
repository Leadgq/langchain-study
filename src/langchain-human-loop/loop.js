import { tool, humanInTheLoopMiddleware } from "langchain"
import { createAgentFn, readChat } from "../model/index.js"
import z from "zod"
import { Command } from "@langchain/langgraph"
import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

const readChatInstance = new readChat()
const EMAIL_ALLOWLIST = (process.env.EMAIL_ALLOWLIST || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

const transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.QQ_EMAIL,
        pass: process.env.QQ_EMAIL_PASSWORD,
    },
})

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function maskEmail(email) {
    if (!email || !email.includes("@")) return "***"
    const [name, domain] = email.split("@")
    if (!name) return `***@${domain}`
    if (name.length === 1) return `*@${domain}`
    return `${name[0]}***${name[name.length - 1]}@${domain}`
}

function isAllowedRecipient(email) {
    if (EMAIL_ALLOWLIST.length === 0) return true
    return EMAIL_ALLOWLIST.includes(email.toLowerCase())
}

async function askUntilValid(prompt, validator, errorMessage) {
    while (true) {
        const value = (await readChatInstance.readlineChatOnce(prompt)).trim()
        if (validator(value)) return value
        console.log(errorMessage)
    }
}

export async function sendMail({ to, subject, text, html }) {
    if (!isValidEmail(to)) {
        throw new Error("收件人邮箱格式不合法")
    }
    if (!isAllowedRecipient(to)) {
        throw new Error("收件人不在允许发送列表中，请检查 EMAIL_ALLOWLIST")
    }
    if (!process.env.QQ_EMAIL || !process.env.QQ_EMAIL_PASSWORD) {
        throw new Error("请先在 .env 中配置 QQ_EMAIL 与 QQ_EMAIL_PASSWORD")
    }

    const mailOptions = {
        from: `火狐<${process.env.QQ_EMAIL}>`,
        to,
        subject,
        text,
        html,
    }

    return transporter.sendMail(mailOptions)
}

const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        await sendMail({ to, subject, text: body })
        return `邮件发送成功：to=${maskEmail(to)} subject=${subject}`
    },
    {
        name: "sendEmail",
        description: "当用户想要发送邮件时调用该工具",
        schema: z.object({
            to: z.string().describe("收件人邮箱"),
            subject: z.string().describe("邮件主题"),
            body: z.string().describe("邮件正文"),
        }),
    }
)

const agent = createAgentFn({
    tools: [sendEmailTool],
    systemPrompt:
        "你是一个可靠助手。用户提出发邮件需求时，请提取收件人、主题、正文后调用 sendEmail 工具。若用户拒绝发送则说明取消原因。",
    middleWare: [
        humanInTheLoopMiddleware({
            interruptOn: {
                sendEmail: {
                    allowedDecisions: ["edit", "approve", "reject"],
                    description: "发送邮件前必须人工审批，可以编辑收件人/主题/正文",
                },
            },
        }),
    ],
})

async function buildDecision(action) {
    while (true) {
        const decision = (
            await readChatInstance.readlineChatOnce("是否发送？(edit/approve/reject): ")
        )
            .trim()
            .toLowerCase()

        if (decision === "approve") {
            return {
                type: "approve",
                message: "用户已审批通过，允许发送",
            }
        }

        if (decision === "reject") {
            const reason =
                (await readChatInstance.readlineChatOnce("请输入拒绝原因(可留空): ")).trim() ||
                "用户取消发送"
            return {
                type: "reject",
                message: reason,
            }
        }

        if (decision === "edit") {
            const editChoice = await askUntilValid(
                "编辑哪个字段？(to/subject/body): ",
                (value) => ["to", "subject", "body"].includes(value.toLowerCase()),
                "输入无效，请输入 to / subject / body"
            )

            const mergedArgs = { ...action.args }
            if (editChoice === "to") {
                mergedArgs.to = await askUntilValid(
                    "新的收件人邮箱: ",
                    (value) => isValidEmail(value) && isAllowedRecipient(value),
                    "邮箱不合法或不在允许列表中"
                )
            } else if (editChoice === "subject") {
                mergedArgs.subject = await askUntilValid(
                    "新的主题: ",
                    (value) => value.length > 0,
                    "主题不能为空"
                )
            } else {
                mergedArgs.body = await askUntilValid(
                    "新的正文: ",
                    (value) => value.length > 0,
                    "正文不能为空"
                )
            }

            return {
                type: "edit",
                editedAction: {
                    name: "sendEmail",
                    args: mergedArgs,
                },
            }
        }

        console.log("输入无效，请输入 edit / approve / reject")
    }
}

async function runAgentWithApprovals() {
    const userId = await askUntilValid("请输入当前用户 ID: ", (value) => value.length > 0, "用户 ID 不能为空")
    const userRequest = await askUntilValid(
        "请输入你的请求（例如：给xxx发项目周报）: ",
        (value) => value.length > 0,
        "请求不能为空"
    )

    const config = {
        configurable: {
            thread_id: `mail_${userId}`,
        },
    }

    console.log("\nAI 正在处理请求并可能触发人工审批...\n")
    const firstResult = await agent.invoke(
        {
            messages: [
                {
                    role: "user",
                    content: userRequest,
                },
            ],
        },
        config
    )

    const interrupt = firstResult.__interrupt__?.[0]?.value
    if (!interrupt?.actionRequests?.length) {
        const last = firstResult.messages[firstResult.messages.length - 1]
        console.log("未触发审批，AI 回复：", last?.content || "(空)")
        return
    }

    const decisions = []
    for (const action of interrupt.actionRequests) {
        if (action.name !== "sendEmail") continue
        console.log("\n--- 待审批邮件 ---")
        console.log("收件人:", maskEmail(action.args.to))
        console.log("主题:", action.args.subject)
        console.log("正文:", action.args.body)
        const decision = await buildDecision(action)
        decisions.push(decision)
    }

    if (!decisions.length) {
        console.log("没有可执行的审批决策，流程结束。")
        return
    }

    const finalResult = await agent.invoke(
        new Command({
            resume: { decisions },
        }),
        config
    )
    const last = finalResult.messages[finalResult.messages.length - 1]
    console.log("\n最终结果：", last?.content || "(空)")
}

runAgentWithApprovals().catch((error) => {
    console.error("流程执行失败：", error.message)
    process.exitCode = 1
})