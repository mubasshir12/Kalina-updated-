
import { Content, Type } from "@google/genai";
import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";

export const processAndSaveCode = async (
    codeBlock: { language: string; code: string; },
    context: Content[]
): Promise<{ description: string }> => {
    const ai = getAiClient();
    const systemInstruction = `Analyze the code block and conversation context. Create a concise, one-sentence description of the code's purpose for future retrieval. Respond ONLY with JSON: { "description": "..." }`;
    
    const contextText = context.map(h => `${h.role}: ${h.parts.map(p => (p as any).text || '').join(' ')}`).join('\n');
    const prompt = `CONVERSATION CONTEXT:\n${contextText}\n\nCODE BLOCK (language: ${codeBlock.language}):\n\`\`\`\n${codeBlock.code}\n\`\`\``;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING }
                    },
                    required: ["description"]
                },
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error processing code:", error);
        logDev('error', 'Error in processAndSaveCode:', error);
        return { description: `A ${codeBlock.language} code snippet.` };
    }
};

export const findRelevantCode = async (
    prompt: string,
    codeSnippets: { id: string; description: string }[]
): Promise<string[]> => {
    const ai = getAiClient();
    const systemInstruction = `Based on the user's prompt, identify the most relevant code snippet IDs from the provided list. Respond ONLY with JSON: { "relevant_ids": ["id1", "id2", ...] }`;
    
    const snippetsText = codeSnippets.map(s => `ID: ${s.id}, Description: ${s.description}`).join('\n');
    const fullPrompt = `USER PROMPT:\n"${prompt}"\n\nAVAILABLE CODE SNIPPETS:\n${snippetsText}\n\nIdentify the relevant snippet IDs.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relevant_ids: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["relevant_ids"]
                },
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.relevant_ids || [];
    } catch (error) {
        console.error("Error finding relevant code:", error);
        logDev('error', 'Error in findRelevantCode:', error);
        return [];
    }
};

export const autoFixCode = async (
    code: string,
    errorMessage: string,
    onProgress: (progress: string) => void
): Promise<string> => {
    const ai = getAiClient();
    const systemInstruction = `You are an expert code debugger. Analyze the user's code and error message, then fix the code.
**Output Format (Strict):**
1.  Provide a step-by-step thinking process. Each step MUST be on a new line, prefixed with "[THOUGHT]".
2.  After all thoughts, provide the complete, corrected code block enclosed in "[CODE]" and "[/CODE]" tags.
3.  Do NOT include any other text or explanations.`;
    
    const prompt = `ERROR MESSAGE:\n\`\`\`\n${errorMessage}\n\`\`\`\n\nCODE TO FIX:\n\`\`\`\n${code}\n\`\`\``;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction }
        });

        let accumulatedResponse = "";
        let lastProcessedThoughtIndex = -1;

        for await (const chunk of responseStream) {
            accumulatedResponse += chunk.text;
            
            const thoughtPrefix = "[THOUGHT]";
            let searchFrom = lastProcessedThoughtIndex + 1;
            let thoughtIndex;

            while ((thoughtIndex = accumulatedResponse.indexOf(thoughtPrefix, searchFrom)) !== -1) {
                const endOfLine = accumulatedResponse.indexOf('\n', thoughtIndex);
                if (endOfLine !== -1) {
                    const thought = accumulatedResponse.substring(thoughtIndex + thoughtPrefix.length, endOfLine).trim();
                    onProgress(thought);
                    lastProcessedThoughtIndex = endOfLine;
                    searchFrom = endOfLine;
                } else {
                    break;
                }
            }

            const codeStartTag = "[CODE]";
            const codeEndTag = "[/CODE]";
            const codeStartIndex = accumulatedResponse.indexOf(codeStartTag);
            if (codeStartIndex !== -1) {
                const codeEndIndex = accumulatedResponse.indexOf(codeEndTag, codeStartIndex);
                if (codeEndIndex !== -1) {
                    const fixedCode = accumulatedResponse.substring(codeStartIndex + codeStartTag.length, codeEndIndex).trim();
                    onProgress("Updated code is ready.");
                    return fixedCode;
                }
            }
        }

        const finalCodeMatch = accumulatedResponse.match(/\[CODE\]([\s\S]*)\[\/CODE\]/);
        if(finalCodeMatch && finalCodeMatch[1]) {
            onProgress("Updated code is ready.");
            return finalCodeMatch[1].trim();
        }

        throw new Error("AI could not fix the code or returned an invalid format.");
    } catch (error) {
        logDev('error', 'Error in autoFixCode:', error);
        throw error;
    }
};