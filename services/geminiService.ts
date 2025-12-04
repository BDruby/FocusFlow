import { GoogleGenAI, Modality } from "@google/genai";

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is missing");
        throw new Error("API Key is missing from environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

export const summarizeText = async (text: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following text into clear, concise bullet points to help a reader with ADHD understand the main concepts quickly. Keep it structured and easy to scan.\n\nText:\n${text}`,
        });
        return response.text || "Could not generate summary.";
    } catch (error) {
        console.error("Summarization error:", error);
        throw error;
    }
};

export const simplifyText = async (text: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Rewrite the following text to be more accessible for someone with ADHD. 
            - Use shorter sentences.
            - Use active voice.
            - Break down complex paragraphs.
            - Do not lose the original meaning.
            \n\nText:\n${text}`,
        });
        return response.text || "Could not simplify text.";
    } catch (error) {
        console.error("Simplification error:", error);
        throw error;
    }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
    const ai = getAI();
    // Truncate text if it's too long for a single TTS request (approx limit safe bet ~2000 chars for preview)
    // For this demo, we take the first 2000 chars if long to avoid errors, or user should select smaller chunks.
    const safeText = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: safeText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, calm voice
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            throw new Error("No audio data returned");
        }

        // Decode Base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

    } catch (error) {
        console.error("TTS error:", error);
        throw error;
    }
};
