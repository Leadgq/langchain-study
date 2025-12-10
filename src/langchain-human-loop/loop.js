import { tool, humanInTheLoopMiddleware } from "langchain"
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { createAgentFn, getModel, readChat } from "../model/index.js"
import { PromptTemplate } from "@langchain/core/prompts";
import z from "zod"
import { Command } from "@langchain/langgraph";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'

dotenv.config()

const model = getModel()
const readChatInstance = new readChat()

export async function sendMail({ to, subject, text, html }) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 465,
        secure: true, // true for 465, false for 587
        auth: {
            user: process.env.QQ_EMAIL,     // 你的QQ邮箱
            pass: process.env.QQ_EMAIL_PASSWORD,            // QQ邮箱设置里生成的授权码，不是密码
        },
    });

    const mailOptions = {
        from: `火狐<${process.env.QQ_EMAIL}>`, // 发件人
        to,
        subject,
        text,
        html,
    };

    return transporter.sendMail(mailOptions);
}

const sendEmailTool = tool(
    async ({ to, subject, body }) => {
        await sendMail({ to, subject, text: body });
        return `Email sent successfully to ${to} with subject ${subject} and body ${body}`
    },
    {
        name: "sendEmail",
        description: "useful when you want to send an email",
        schema: z.object({
            to: z.string().describe("The email address of the recipient"),
            subject: z.string().describe("The subject of the email"),
            body: z.string().describe("The body of the email"),
        })
    }
)

const agent = createAgentFn({
    tools: [sendEmailTool],
    systemPrompt: `你是一个靠谱的人工智能助手可以回答用户的问题，你可以使用sendEmail工具发送邮件,当用户成功发送邮件后，请告知结果，如果拒绝发送邮件，请告知用户`,
    middleWare: [
        humanInTheLoopMiddleware({
            interruptOn: {
                sendEmail: {
                    allowedDecisions: ["edit", "approve", "reject"],
                    description: '当智能体需要发送邮件时，需要用户确认是否发送，以及是否需要编辑邮件内容'
                }
            }
        })
    ]
})


// 3. 运行智能体
async function runAgentWithApprovals() {
    const config = { configurable: { thread_id: "user_123" } };

    // 第一步：运行智能体直到需要批准
    console.log("Starting the agent to run...");
    const result = await agent.invoke(
        {
            messages: [{
                role: "user",
                content: "给张三发一封邮件，内容是这是一个测试的文章，邮箱地址为gq19960624@2925.com，主题为项目报告测试"
            }]
        },
        config
    );

    // 检查是否有中断
    if (result.__interrupt__) {

        const interrupt = result.__interrupt__[0]?.value;
        if (!interrupt) return;

        const actionRequests = interrupt.actionRequests || [];


        if (!interrupt || !interrupt.actionRequests) {
            console.log("The agent has not found any actionRequests");
            return;
        }

        const decisions = [];

        for (const action of actionRequests) {
            if (action.name === "sendEmail") {
                const decision = await readChatInstance.readlineChatOnce(
                    `是否发送邮件给 ${action.args.to} ？(edit/approve/reject): `
                );
                if (decision === 'reject') {
                    decisions.push({
                        type: decision,
                        message: 'user rejected the email to send'
                    })
                } else if (decision === 'edit') {
                    console.log(`\n原始邮件内容: ${action.args.body}`);

                    const editChoice = await readChatInstance.readlineChatOnce(
                        `编辑哪个字段？(to/subject/body): `
                    );

                    let mergedArgs = { ...action.args };

                    if (editChoice === 'to') {
                        const newTo = await readChatInstance.readlineChatOnce(`新的收件人: `);
                        mergedArgs.to = newTo.trim();
                    }
                    else if (editChoice === 'subject') {
                        const newSubject = await readChatInstance.readlineChatOnce(`新的主题: `);
                        mergedArgs.subject = newSubject.trim();
                    }
                    else if (editChoice === 'body') {
                        // ✅ 只在这里用 LLM 优化内容
                        const userEdit = await readChatInstance.readlineChatOnce(`你想怎样改进这个内容？(或直接粘贴新内容): `);
                      mergedArgs.body = userEdit;
                    }

                    decisions.push({
                        type: 'edit',
                        editedAction: {
                            name: "sendEmail",
                            args: mergedArgs,
                        },
                    });
                } else if (decision === 'approve') {
                    console.log("The user approved the email to send");
                    decisions.push({
                        type: decision,
                        message: 'The user approved the email to send'
                    })
                }
            }
        }
        console.log("user's decisions:", decisions);
        try {
            await agent.invoke(
                new Command({
                    resume: { decisions },  // ✅ 必须是这个格式
                }),
                config  // ✅ 必须是同一个 thread_id
            );
            console.log("The agent has completed the task....");
        } catch (error) {
            console.error("The agent failed to complete the task:", error);
            throw error;
        }
    }
}

runAgentWithApprovals();