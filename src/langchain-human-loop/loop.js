import { tool, humanInTheLoopMiddleware } from "langchain"
import { createAgentFn } from "../model/index.js"
import z from "zod"
import { Command } from "@langchain/langgraph";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'

dotenv.config()

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
    middleWare: [
        humanInTheLoopMiddleware({
            interruptOn: {
                sendEmail: {
                    allowedDecisions:["edit","approve","reject"],
                    description:'当智能体需要发送邮件时，需要用户确认是否发送，以及是否需要编辑邮件内容'
                }
            }
        })
    ]
})


// 3. 运行智能体
async function runAgentWithApprovals() {
    const config = { configurable: { thread_id: "user_123" } };

    // 第一步：运行智能体直到需要批准
    console.log("智能体开始执行任务...");
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
            console.log("没有找到 actionRequests");
            return;
        }

        const decisions = [];

        for (const action of actionRequests) {
            if (action.name === "sendEmail") {

                decisions.push({
                    type: "edit",
                    editedAction: {
                        name: "sendEmail",  // Keep original tool name
                        args: {
                            ...action.args,
                            to: "gq19960624@2925.com",
                            body:'这是一篇被更改过的文章，hi！！！！'
                        },
                    },
                });
            }
        }
        console.log("用户决策:", decisions);
        try {
             await agent.invoke(
                new Command({
                    resume: { decisions },  // ✅ 必须是这个格式
                }),
                config  // ✅ 必须是同一个 thread_id
            );
            console.log("智能体执行任务完毕...");
        } catch (error) {
            console.error("恢复执行失败:", error);
            throw error;
        }
    }
}

runAgentWithApprovals();