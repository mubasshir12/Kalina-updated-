
import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";
import { DevLog } from './loggingService';

const systemInstruction = `You are an expert AI software engineer specializing in debugging frontend JavaScript and React code. Analyze the provided error message and stack trace.

**Your Task:**
1.  **Explain the Error:** In simple terms, explain what the error means.
2.  **Identify the Cause:** Based on the stack trace, pinpoint the likely source of the problem in the code.
3.  **Provide a Solution:** Offer a clear, concise code snippet or step-by-step instructions to fix the issue.

Respond ONLY with the explanation and solution in well-formatted Markdown. Do not add any conversational fluff or greetings.`;

export const explainError = async (log: DevLog): Promise<string> => {
    const ai = getAiClient();

    const prompt = `Error Message:
\`\`\`
${log.message}
\`\`\`

Stack Trace:
\`\`\`
${log.stack || 'No stack trace available.'}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        return response.text.trim();
    } catch (error) {
        logDev('error', "AI Debugger failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return `Sorry, I was unable to analyze this error. The AI debugger failed with the following message: ${errorMessage}`;
    }
};
