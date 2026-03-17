import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface Coordinates {
  lat: number;
  lng: number;
  name: string;
}

export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the latitude and longitude for the location: "${location}". Return only the JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            name: { type: Type.STRING, description: "The formalized name of the location" }
          },
          required: ["lat", "lng", "name"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as Coordinates;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
