# 模型的创建

```typescript
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

// 加载环境变量
import dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
    apiKey: process.env.API_KEY, 
    // you can select the model which you want to use
    model: "gpt-4o-mini",
    configuration: {
        baseURL: process.env.BASE_URL,
    },
});

```