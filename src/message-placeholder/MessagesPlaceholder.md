# MessagesPlaceholder

```typescript
// this method is used to add  a placeholder for the  history messages
import { MessagesPlaceholder } from '@langchain/core/prompts';
```

``` typescript
// this method is used to add  a placeholder for the  history messages

import { ChatPromptTemplate } from "@langchain/core/prompts";

// create a chat prompt template
const  chatPrompt  =  ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant that translates {input_language} to {output_language}."],
    // this is a placeholder
    new  MessagesPlaceholder("history"),
    ['ai', '私は肉を食べたいです。'],
])

chatPrompt.invoke({
    input_language: "English",
    output_language: "Japanese",
    history: [
        {
            role: "human",
            content: "I want to eat meat.",
        }
    ],
}).then((res) => {
    console.log(res.toChatMessages());
   return model.invoke(res);
}).then((res) => {
    console.log(res.content);
})
```