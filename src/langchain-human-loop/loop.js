import { tool, humanInTheLoopMiddleware } from "langchain"
import { createAgentFn } from "../model/index.js"
import z from "zod"
import { Command } from "@langchain/langgraph";
// mailer.js
import nodemailer from 'nodemailer';

/**
 * 发送邮件（适用于QQ邮箱）
 * @param {Object} options - 邮件参数
 * @param {string} options.to - 收件人邮箱
 * @param {string} options.subject - 邮件主题
 * @param {string} options.text - 邮件内容 (纯文本)
 * @param {string} [options.html] - 邮件内容 (HTML，可选)
 * @returns {Promise<Object>} - 邮件发送结果
 */
export async function sendMail({ to, subject, text, html }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
      user: '2643336540@qq.com',     // 你的QQ邮箱
      pass: 'ffqtjrqnsgnzecfj',            // QQ邮箱设置里生成的授权码，不是密码
    },
  });

  const mailOptions = {
    from: '火狐<2643336540@qq.com>', // 发件人
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
                sendEmail: true
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
                content: "给张三发一封邮件，内容是这是一个测试的文章，邮箱地址为zhangsan@example.com，主题为项目报告测试"
            }]
        },
        config
    );

    console.log("\n有中断吗?", result.__interrupt__ ? "✅ 是" : "❌ 否");
    // 检查是否有中断
    if (result.__interrupt__) {

        const interrupt = result.__interrupt__[0]?.value;
        if (!interrupt) return;

        const actionRequests = interrupt.actionRequests || [];


        if (!interrupt || !interrupt.actionRequests) {
            console.log("没有找到 actionRequests");
            return;
        }

        console.log("待批准的操作:", actionRequests);


        // ✅ 为每个操作创建一个决策（使用 for 循环最清晰）
        const decisions = [];

        for (const action of actionRequests) {
            if (action.name === "sendEmail") {

                decisions.push({
                    type: "edit",
                    editedAction: {
                        name: "sendEmail",  // Keep original tool name
                        args: {
                            ...action.args,
                            to: "john@example.com",
                        },
                    },
                });
            }
        }
        console.log("用户决策:", decisions);
        try {
            const resumedResult = await agent.invoke(
                new Command({
                    resume: { decisions },  // ✅ 必须是这个格式
                }),
                config  // ✅ 必须是同一个 thread_id
            );

            const lastMessage = resumedResult.messages[resumedResult.messages.length - 1];
            console.log("最后的消息:", lastMessage);

            return resumedResult;
        } catch (error) {
            console.error("恢复执行失败:", error);
            throw error;
        }
    }
}

runAgentWithApprovals();