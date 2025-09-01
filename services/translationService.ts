
import { getAiClient } from "./aiClient";

const translateSystemInstruction = `You are an expert translator AI. Your sole purpose is to translate text accurately and concisely.
- Detect the source language if the user specifies "auto".
- Translate the provided text to the specified target language.
- **CRITICAL:** Your response MUST contain ONLY the translated text. Do NOT include any explanations, greetings, apologies, or extra text like "Here is the translation:". Just the raw translation.`;

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
        let errorMessage = "Error: Could not translate.";
        if (error instanceof Error) {
            errorMessage = `Error: Could not translate. ${error.message}`;
        }
        return { translatedText: errorMessage, inputTokens: 0, outputTokens: 0 };
    }
};
