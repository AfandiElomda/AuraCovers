import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateBookCover(
    prompt: string,
    imagePath: string,
): Promise<void> {
    try {
        // IMPORTANT: only this gemini model supports image generation
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Gemini API");
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
            throw new Error("No content or parts returned from Gemini API");
        }

        let imageGenerated = false;
        for (const part of content.parts) {
            if (part.text) {
                console.log("Gemini response text:", part.text);
            } else if (part.inlineData && part.inlineData.data) {
                const imageData = Buffer.from(part.inlineData.data, "base64");
                fs.writeFileSync(imagePath, imageData);
                console.log(`Book cover image saved as ${imagePath}`);
                imageGenerated = true;
                break;
            }
        }

        if (!imageGenerated) {
            throw new Error("No image data received from Gemini API");
        }
    } catch (error) {
        console.error("Error generating book cover with Gemini:", error);
        throw new Error(`Failed to generate book cover: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function summarizeText(text: string): Promise<string> {
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Something went wrong";
}
