import { Part, Type } from "@google/genai";
import { getAiClient } from "./aiClient";

const planAndThinkSystemInstruction = `You are an AI planner. Analyze the user's prompt to determine the best response strategy by classifying it. A single prompt can trigger multiple tools; set all relevant boolean flags to true.

**Example:** For "what's the time and the weather in Paris?", you must set both 'isTimeRequest' and 'isWeatherRequest' to true, and set 'location' to 'Paris'.

**1. Web Search (needsWebSearch: true):**
Set to true for queries needing real-time or up-to-date info (news, events, live data).
**Rule:** When in doubt about your knowledge's currency, ALWAYS default to a web search.

**2. URL Read (isUrlReadRequest: true):**
Set to true if the prompt contains a URL and asks a question about its content (e.g., "summarize this").

**3. Creator Inquiry (isCreatorRequest: true):**
Set to true if the user asks who created you, your developer, or your origin.

**4. Capabilities Inquiry (isCapabilitiesRequest: true):**
Set to true if the user asks what you can do, about your tools, or your abilities (e.g., "what are your skills?", "can you generate images?").

**5. Time Inquiry (isTimeRequest: true):**
Set to true for queries about the current time or date.

**6. Weather Inquiry (isWeatherRequest: true):**
Set to true for queries about weather conditions. Extract the primary location into 'location'.

**7. Maps & Nearby Inquiries:**
- **Single Location/Directions (isMapsRequest: true):** Set to true for queries about distances, directions, or a *single specific location* (e.g., "distance to Eiffel Tower", "map of London"). Extract the core question into 'mapQuery'.
- **Nearby Places (isNearbyRequest: true):** Set to true for queries about *multiple, non-specific places* near a location (e.g., "cafes near me", "parks around here"). Extract the type of place into 'nearbyQuery'.

**8. File Analysis:**
- If a file is attached, always set 'needsThinking' to true.

**9. Complex Prompts (needsThinking: true):**
Set to true for prompts requiring analysis, creativity, multi-step reasoning, coding, or file analysis.

**10. Simple Prompts (needsThinking: false):**
Set to false for basic conversational turns.

**Output:**
Respond ONLY with a valid JSON object based on the prompt analysis.

**JSON Schema:**
- \`needsWebSearch\` (boolean): Requires up-to-date info.
- \`isUrlReadRequest\` (boolean): URL found and needs to be analyzed.
- \`isCreatorRequest\` (boolean): User is asking about the developer.
- \`isCapabilitiesRequest\` (boolean): User is asking about your abilities.
- \`isTimeRequest\` (boolean, optional): User is asking about the current time.
- \`isWeatherRequest\` (boolean, optional): User is asking about the weather.
- \`location\` (string, optional): The location for the weather query.
- \`isMapsRequest\` (boolean, optional): User is asking a map-related question.
- \`mapQuery\` (string, optional): The core map-related query from the user.
- \`isNearbyRequest\` (boolean, optional): User is asking for nearby places.
- \`nearbyQuery\` (string, optional): The type of place to search for nearby.
- \`needsThinking\` (boolean): Complex task.
- \`needsCodeContext\` (boolean): Prompt relates to previous code.
- \`thoughts\` (array, optional): If 'needsThinking' is true, provide a step-by-step plan.
- \`searchPlan\` (array, optional): If 'needsWebSearch' is true, provide a research plan.

**'thoughts' & 'searchPlan' item structure:**
Each item must be an object with 'phase', 'step', and 'concise_step' (3-5 words ending in '-ing'). The final 'concise_step' for 'thoughts' must be dynamic and end in '-ing' (e.g., 'Generating response...').`;

export interface ThoughtStep {
    phase: string;
    step: string;
    concise_step: string;
}
export interface ResponsePlan {
    needsWebSearch: boolean;
    isUrlReadRequest: boolean;
    isCreatorRequest: boolean;
    isCapabilitiesRequest: boolean;
    isTimeRequest?: boolean;
    isWeatherRequest?: boolean;
    location?: string;
    isMapsRequest?: boolean;
    mapQuery?: string;
    isNearbyRequest?: boolean;
    nearbyQuery?: string;
    needsThinking: boolean;
    needsCodeContext: boolean;
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
                        isCreatorRequest: { type: Type.BOOLEAN },
                        isCapabilitiesRequest: { type: Type.BOOLEAN },
                        isTimeRequest: { type: Type.BOOLEAN },
                        isWeatherRequest: { type: Type.BOOLEAN },
                        location: { type: Type.STRING },
                        isMapsRequest: { type: Type.BOOLEAN },
                        mapQuery: { type: Type.STRING },
                        isNearbyRequest: { type: Type.BOOLEAN },
                        nearbyQuery: { type: Type.STRING },
                        needsThinking: { type: Type.BOOLEAN },
                        needsCodeContext: { type: Type.BOOLEAN },
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
                    required: ["needsWebSearch", "isUrlReadRequest", "isCreatorRequest", "isCapabilitiesRequest", "needsThinking", "needsCodeContext"],
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        // If a tool-based request is made, disable general thinking to go straight to the task.
        if (result.needsWebSearch || result.isUrlReadRequest || result.isTimeRequest || result.isWeatherRequest || result.isMapsRequest || result.isNearbyRequest) {
            result.needsThinking = false;
            result.thoughts = [];
        }

        return { ...result, thoughts: result.thoughts || [], searchPlan: result.searchPlan || [] };
    } catch (error)
    {
        console.error("Error planning response:", error);
        // Fallback: If planning fails, assume web search is needed but disable thinking.
        const needsWebSearch = true;
        return { 
            needsWebSearch: needsWebSearch,
            isUrlReadRequest: false,
            isCreatorRequest: false,
            isCapabilitiesRequest: false,
            needsThinking: !needsWebSearch, // Ensures thinking is false if web search is true
            needsCodeContext: false, // <-- Changed from true to false for token efficiency on error
            thoughts: [], // No thoughts when thinking is disabled
            searchPlan: []
        };
    }
};