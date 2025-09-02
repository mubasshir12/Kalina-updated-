import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";
import { Type } from "@google/genai";

const translateSystemInstruction = `You are an expert translator. Your task is to accurately translate text.`;

export const translateText = async (
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
): Promise<{ translatedText: string, detectedSourceLanguage: string | null, inputTokens: number, outputTokens: number }> => {
    if (!text.trim()) return { translatedText: '', detectedSourceLanguage: null, inputTokens: 0, outputTokens: 0 };
    const ai = getAiClient();
    
    try {
        if (sourceLang === 'auto' || sourceLang === 'Auto Detect') {
            const prompt = `Detect the language of the following text and translate it to ${targetLang}:\n\n"${text}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: `${translateSystemInstruction} Respond ONLY with a valid JSON object: { "translated_text": "...", "detected_source_language": "..." }`,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translated_text: { type: Type.STRING },
                            detected_source_language: { type: Type.STRING }
                        },
                        required: ["translated_text", "detected_source_language"]
                    }
                }
            });

            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText);
            const translatedText = result.translated_text || '';
            const detectedSourceLanguage = result.detected_source_language || null;
            const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
            const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

            return { translatedText, detectedSourceLanguage, inputTokens, outputTokens };

        } else {
            const prompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n"${text}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: `${translateSystemInstruction} **CRITICAL: Your response must contain ONLY the translated text.** No extra words, explanations, or greetings.`,
                }
            });
            
            const translatedText = response.text.trim();
            const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
            const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

            return { translatedText, detectedSourceLanguage: null, inputTokens, outputTokens };
        }
    } catch (error) {
        console.error("Error translating text:", error);
        logDev('error', 'Error in translateText:', error);
        let errorMessage = "Error: Could not translate.";
        if (error instanceof Error) {
            errorMessage = `Error: Could not translate. ${error.message}`;
        }
        return { translatedText: errorMessage, detectedSourceLanguage: null, inputTokens: 0, outputTokens: 0 };
    }
};