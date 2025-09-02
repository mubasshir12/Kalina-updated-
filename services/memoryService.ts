import { Content, Type } from "@google/genai";
import { LTM, UserProfile } from "../types";
import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";

const getMemoryUpdateSystemInstruction = (userName: string | null): string => `You are a hyper-selective memory AI. Your goal is to extract and maintain long-term facts ABOUT THE USER. You must identify and update facts when new, conflicting information is provided.

**Known User Name:** ${userName || 'Unknown'}

**Rules:**
1.  **Extract User Facts:**
    *   **New Facts:** Extract stable, personal facts (e.g., "User is a developer").
    *   **Updated Facts:** If new info contradicts 'CURRENT LTM' (e.g., user moved), create an update operation specifying the exact old and new memory.
    *   **Name:** If the user states a new name, update the user profile. Use this new name in all memories generated in this same turn. If no name is known, use "The user".
2.  **Critical Filter:** Unless the user gives an explicit command to save something (e.g., "remember that..."), you MUST only save long-term, personal facts about the user. IGNORE temporary interests, general knowledge, or transactional details.
3.  **De-duplicate:** Do not add rephrased facts. If a fact conflicts with an existing one, UPDATE it, don't add a new one.

**Example:**
-   **LTM:** \`["The user lives in Mumbai"]\`
-   **User says:** "Hi, my name is Priya and I've moved to Delhi."
-   **Your JSON MUST contain:**
    -   \`"user_profile_updates": { "name": "Priya" }\`
    -   \`"updated_memories": [{ "old_memory": "The user lives in Mumbai", "new_memory": "Priya lives in Delhi" }]\`

Respond ONLY with the specified JSON object.`;

export interface MemoryUpdate {
    old_memory: string;
    new_memory: string;
}

export interface MemoryUpdateResult {
    newMemories: string[];
    updatedMemories: MemoryUpdate[];
    userProfileUpdates: Partial<UserProfile>;
}


export const updateMemory = async (
    lastMessages: Content[],
    currentLtm: LTM,
    userProfile: UserProfile,
    model: string = 'gemini-2.5-flash'
): Promise<MemoryUpdateResult> => {
    const ai = getAiClient();
    const historyString = lastMessages.map(m => {
        const textParts = m.parts.map(p => (p as any).text || '[non-text part]').join(' ');
        return `${m.role}: ${textParts}`;
    }).join('\n');
    
    const ltmString = currentLtm.length > 0 ? JSON.stringify(currentLtm) : "[]";

    const prompt = `CURRENT LTM:
${ltmString}

NEW CONVERSATION TURNS:
${historyString}

Analyze the conversation and LTM, then generate the JSON output as instructed.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: getMemoryUpdateSystemInstruction(userProfile.name),
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        new_memories: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        updated_memories: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    old_memory: { type: Type.STRING },
                                    new_memory: { type: Type.STRING }
                                },
                                required: ["old_memory", "new_memory"]
                            }
                        },
                        user_profile_updates: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["new_memories", "updated_memories", "user_profile_updates"]
                },
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return {
            newMemories: parsed.new_memories || [],
            updatedMemories: parsed.updated_memories || [],
            userProfileUpdates: parsed.user_profile_updates || {}
        };
    } catch (error) {
        console.error("Error updating memory:", error);
        logDev('error', 'Error in updateMemory:', error);
        return { newMemories: [], updatedMemories: [], userProfileUpdates: {} };
    }
};

export const summarizeConversation = async (
    history: Content[],
    previousSummary?: string
): Promise<string> => {
    const ai = getAiClient();
    const systemInstruction = `You are an expert conversation summarizer for an AI's memory. Create a concise summary of the recent conversation turns, integrating them with any previous summary. Focus on: user's goal, key AI decisions/tools used, and the final outcome. Use a few bullet points. Respond ONLY with the summary text.`;
    
    const historyText = history.map(h => `${h.role}: ${h.parts.map(p => (p as any).text || '').join(' ')}`).join('\n');
    const prompt = `PREVIOUS SUMMARY:\n${previousSummary || 'None'}\n\nRECENT CONVERSATION:\n${historyText}\n\nBased on the above, provide an updated summary.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing conversation:", error);
        logDev('error', 'Error in summarizeConversation:', error);
        return previousSummary || ''; // Return old summary on error
    }
};