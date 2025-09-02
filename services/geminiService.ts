import { Part, Type } from "@google/genai";
import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";

const planAndThinkSystemInstruction = `You are an intelligent router. Analyze the user's prompt to determine the correct response strategy. Respond ONLY with a valid JSON object.

**Decision Logic:**

1.  **\`needsWebSearch: true\`**: For queries requiring real-time, up-to-the-minute information (news, events, trends). **If knowledge freshness is uncertain, default to web search.**
2.  **\`isUrlReadRequest: true\`**: If the prompt contains a URL and asks a question about it (e.g., "summarize this").
3.  **Image/File Handling**:
    *   **\`isImageEditRequest: true\`**: If an image is provided and the user asks to modify it.
    *   **\`isImageGenerationRequest: true\`**: If the user asks to create an image and no image is provided.
    *   For file analysis (PDF, TXT), set **\`needsThinking: true\`**.
4.  **\`needsThinking: true\`**: For complex prompts requiring analysis, creativity, brainstorming, coding, planning, or detailed reasoning. Also for file analysis.
5.  **\`needsThinking: false\`**: For simple, conversational prompts.
6.  **\`needsCodeContext: true\`**: If the prompt is related to previously discussed code.

**'thoughts' & 'searchPlan' Arrays:**
- If \`needsThinking\` is true, provide a \`thoughts\` array.
- If \`needsWebSearch\` is true, provide a \`searchPlan\` array.
- Each item in these arrays must be an object with 'phase', 'step', and a 'concise_step' (3-5 words, ending in '-ing'). The final 'concise_step' for \`thoughts\` must be dynamic (e.g., 'Generating response...').`;

export interface ThoughtStep {
    phase: string;
    step: string;
    concise_step: string;
}
export interface ResponsePlan {
    needsWebSearch: boolean;
    isUrlReadRequest: boolean;
    needsThinking: boolean;
    needsCodeContext: boolean;
    isImageGenerationRequest: boolean;
    isImageEditRequest: boolean;
    thoughts: ThoughtStep[];
    searchPlan?: ThoughtStep[];
}

export const planResponse = async (prompt: string, image?: { base64: string; mimeType: string; }, file?: { base64: string; mimeType: string; name: string; }, model: string = 'gemini-2.5-flash'): Promise<ResponsePlan> => {
    const ai = getAiClient();
    try {
        const contentParts: Part[] = [{ text: prompt }];
        if (image) {
            contentParts.unshift({ text: `[User has attached an image]` });
        }
        if (file) {
            contentParts.push({ text: `[User has attached a file named: ${file.name}]` });
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: contentParts },
            config: {
                systemInstruction: planAndThinkSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        needsWebSearch: { type: Type.BOOLEAN },
                        isUrlReadRequest: { type: Type.BOOLEAN },
                        needsThinking: { type: Type.BOOLEAN },
                        needsCodeContext: { type: Type.BOOLEAN },
                        isImageGenerationRequest: { type: Type.BOOLEAN },
                        isImageEditRequest: { type: Type.BOOLEAN },
                        thoughts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phase: { type: Type.STRING },
                                    step: { type: Type.STRING },
                                    concise_step: { type: Type.STRING }
                                },
                                required: ["phase", "step", "concise_step"]
                            }
                        },
                        searchPlan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phase: { type: Type.STRING },
                                    step: { type: Type.STRING },
                                    concise_step: { type: Type.STRING }
                                },
                                required: ["phase", "step", "concise_step"]
                            }
                        }
                    },
                    required: ["needsWebSearch", "isUrlReadRequest", "needsThinking", "isImageGenerationRequest", "isImageEditRequest", "needsCodeContext"],
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        // If web search or URL read is needed, disable thinking to go straight to the task.
        if (result.needsWebSearch || result.isUrlReadRequest) {
            result.needsThinking = false;
            result.thoughts = [];
        }

        return { ...result, thoughts: result.thoughts || [], searchPlan: result.searchPlan || [] };
    } catch (error)
    {
        console.error("Error planning response:", error);
        logDev('error', 'Error in planResponse:', error);
        // Fallback: If planning fails, assume web search is needed but disable thinking.
        const needsWebSearch = true;
        return { 
            needsWebSearch: needsWebSearch,
            isUrlReadRequest: false,
            needsThinking: !needsWebSearch, // Ensures thinking is false if web search is true
            needsCodeContext: false, // <-- Changed from true to false for token efficiency on error
            isImageGenerationRequest: !image && (prompt.toLowerCase().includes('generate') || prompt.toLowerCase().includes('create')),
            isImageEditRequest: !!image,
            thoughts: [], // No thoughts when thinking is disabled
            searchPlan: []
        };
    }
};