
import { tool, humanInTheLoopMiddleware } from "langchain"
import { createAgentFn } from "../model/index.js"
import z from "zod"
import { Command } from "@langchain/langgraph";

const sendEmailTool = tool(
    async ({ to, email, subject, body }) => {
        return `Email sent successfully to ${to} with subject ${subject} and body ${body}`
    },
    {
        name: "sendEmail",
        description: "useful when you want to send an email",
        schema: z.object({
            to: z.string().describe("The email address of the recipient"),
            email: z.string().describe("The email address of the sender"),
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
                    allowedDecisions: ["approve", "edit", "reject"],
                    description: "📧 Email requires approval",
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
                content: "给张三发一封邮件，内容是项目报告测试，邮箱地址为zhangsan@example.com，主题为项目报告测试"
            }]
        },
        config
    );


    // 检查是否有中断
    if (result.__interrupt__) {

        const interrupt = result.__interrupt__[0]?.value;
        if (!interrupt) return;

        const actionRequests = interrupt.actionRequests || [];

        actionRequests.forEach((action, index) => {
            console.log(`${index + 1}. ${action.name}`);
            console.log(`   参数: ${JSON.stringify(action.args)}`);
        });

        // ✅ 为每个操作创建一个决策（使用 for 循环最清晰）
        const decisions = [];

        for (const action of actionRequests) {
            if (action.name === "sendEmail") {
                // 直接批准
                decisions.push({ type: "approve" });

                // 或者编辑
                // decisions.push({
                //     type: "edit",
                //     editedAction: {
                //         name: "sendEmail",
                //         args: {
                //             to: "john@example.com",
                //             subject: "项目报告",
                //             body: "请查看附件中的报告...",
                //         },
                //     },
                // });

                // 或者拒绝
                // decisions.push({
                //     type: "reject",
                //     message: "邮件内容需要修改",
                // });
            }
        }

        await agent.invoke(
            new Command({
                resume: { decisions },
            }),
            config
        );

        console.log("\n执行完成:");
    }
}

runAgentWithApprovals();