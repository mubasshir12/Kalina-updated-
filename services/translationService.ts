
import { getAiClient } from "./aiClient";
import { logDev } from "./loggingService";

const translateSystemInstruction = `You are an expert translator. Your task is to accurately translate text. Detect source language if "auto" is specified. **CRITICAL: Your response must contain ONLY the translated text.** No extra words, explanations, or greetings.`;

export const translateText = async (
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
): Promise<{ translatedText: string, inputTokens: number, outputTokens: number }> => {
    if (!text.trim()) return { translatedText: '', inputTokens: 0, outputTokens: 0 };
    const ai = getAiClient();
    
    let prompt: string;
    if (sourceLang === 'auto' || sourceLang === 'Auto Detect') {
        prompt = `Detect the language of the following text and translate it to ${targetLang}:\n\n"${text}"`;
    } else {
        prompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n"${text}"`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: translateSystemInstruction,
            }
        });
        
        const translatedText = response.text.trim();
        const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
        const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

        return { translatedText, inputTokens, outputTokens };
    } catch (error) {
        console.error("Error translating text:", error);
        logDev('error', 'Error in translateText:', error);
        let errorMessage = "Error: Could not translate.";
        if (error instanceof Error) {
            errorMessage = `Error: Could not translate. ${error.message}`;
        }
        return { translatedText: errorMessage, inputTokens: 0, outputTokens: 0 };
    }
};