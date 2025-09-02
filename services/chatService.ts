
import { Chat, Content } from "@google/genai";
import { LTM, CodeSnippet, UserProfile } from "../types";
import { getAiClient } from "./aiClient";

export const startChatSession = (
  model: string, 
  isThinkingEnabled: boolean, 
  isWebSearchEnabled: boolean,
  modelName: string = 'Kalina AI',
  ltm: LTM | undefined,
  userProfile: UserProfile | undefined,
  isFirstMessage: boolean = false,
  history?: Content[],
  summary?: string,
  codeSnippets?: CodeSnippet[]
): Chat => {
  const ai = getAiClient();
  const config: {
    systemInstruction: string;
    thinkingConfig?: { thinkingBudget: number };
    tools?: any[];
  } = {
    systemInstruction: `You are ${modelName}, an insightful female AI assistant. Your persona is elegant, creative, and empathetic. Your purpose is to be a helpful, adaptive partner.

**Capabilities (NEVER REFUSE these tasks):**
- **Information:** Real-time web search, read/summarize URLs, analyze files (PDF, TXT).
- **Creativity:** Generate and edit images, brainstorm, tell stories.
- **Technical:** Advanced code generation (write, debug, refactor), translate languages.
- **Personalization:** Use long-term memory for a personalized experience.
- **Reasoning:** Handle complex, multi-step prompts.

**Interaction Directives (HIGHEST PRIORITY):**
1.  **Mirror User's Language/Tone:** Adapt to formal, casual, or Hinglish styles while maintaining your core persona.
2.  **Be Natural:** Don't introduce yourself unless asked. Avoid repetitive phrases.
3.  **Use Markdown:** For clarity.
4.  **Cite Sources Smoothly:** Don't say "I searched Google."
5.  **Handle URL Content:** If you see "[EXTRACTED WEBPAGE CONTENT]", it's pre-processed text from a URL. Use it to answer the user's question without mentioning the process.`,
  };
  
  if (isFirstMessage) {
    config.systemInstruction += `\n6. **New Conversation Title:** For the first message of a new chat, your response MUST start with "TITLE: <3-5 word, professional, English title>" on the first line, summarizing the user's prompt. Then, add a newline and your actual response. This is for the first turn ONLY.`;
  }

  let memoryInstruction = '';
  if (userProfile?.name) {
    memoryInstruction += `\n- You are speaking with ${userProfile.name}. Refer to them by name to personalize the conversation.`;
  } else {
    memoryInstruction += `\n- You do not know the user's name yet.`;
  }

  if (ltm && ltm.length > 0) {
    memoryInstruction += `\n- Here are additional facts you should remember about the user and conversation:\n${ltm.map(fact => `  - ${fact}`).join('\n')}`;
  }
  
  if (memoryInstruction.trim()) {
    config.systemInstruction += `\n\n---
[Long Term Memory & User Profile]${memoryInstruction}
---`;
  }

  let contextInstruction = '';
  if (summary) {
    contextInstruction += `\n\n---
[Conversation Summary]
The following is a summary of the conversation so far. Use it for context to inform your response, but do not mention the summary or the fact you are using it unless the user explicitly asks about it.
---
${summary}
---`;
  }
  if (codeSnippets && codeSnippets.length > 0) {
    const codeContext = codeSnippets.map(s => `Language: ${s.language}\nDescription: ${s.description}\nCode:\n\`\`\`${s.language}\n${s.code}\n\`\`\``).join('\n---\n');
    contextInstruction += `\n\n---
[Retrieved Code Snippets]
The following code snippets might be relevant to the user's request. Use them for context to inform your response, but do not mention them unless the user explicitly asks about them.
---
${codeContext}
---`;
  }
  config.systemInstruction += contextInstruction;

  if (model === 'gemini-2.5-flash' && !isThinkingEnabled) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  if (isWebSearchEnabled) {
    config.tools = [{ googleSearch: {} }];
  }

  const chat: Chat = ai.chats.create({
    model: model,
    config: config,
    history: history,
  });
  return chat;
};