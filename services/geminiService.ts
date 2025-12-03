import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_AIzaSyD4m2V1sxuuyZ7iD1T9X_42TYzG8RZl_qAKEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a background image based on the song vibe.
 * Uses gemini-3-pro-image-preview for high quality 16:9 output.
 */
export const generateBackgroundImage = async (
  artist: string,
  song: string,
  mood: string
): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `A high-quality, abstract, cinematic music video background wallpaper for a song titled "${song}" by "${artist}". 
    Mood: ${mood}. 
    Style: Digital art, 4k, detailed, atmospheric, no text, no words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};
