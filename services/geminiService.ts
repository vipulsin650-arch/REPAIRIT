
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ServiceContext } from "../types";

export const getExpertResponse = async (
  prompt: string,
  base64Image?: string,
  context: ServiceContext = 'pickup'
): Promise<{ text: string; sources?: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    let systemInstruction = "";

    // Strictly repair-focused instructions
    if (context === 'pickup') {
      systemInstruction = `
        You are the "Repair It Logistics Expert" for lightweight items (Mobiles, Clothes, Watches).
        1. Emphasize that our "Runner" will arrive in 10-15 minutes for "Express Pickup".
        2. Explain the process: Pickup -> Specialized Hub -> Expert Fix -> Return Delivery.
        3. Be reassuring. Ask for the pickup address and a photo for a price estimate in Rupees (₹).
        4. Use terms like "Express Doorstep Pickup" and "Quick Delivery".
      `;
    } else if (context === 'onsite') {
      systemInstruction = `
        You are the "Repair It Field Coordinator" for Home Services (Plumbing, AC, Fridge) and Automotive (Cars, Bikes).
        1. For Plumbing/Heavy appliances: Explain we send a specialist to "At Your Location" within 30-45 minutes.
        2. If a photo is provided of a leakage or broken pipe, diagnose the severity (e.g., "Major burst" or "Gasket issue").
        3. Provide a visit/inspection charge (e.g., ₹299 for Appliances/Plumbing, ₹199 for Auto).
        4. Use terms like "Professional On-Site Fix" and "At Your Location Service".
        5. If the user asks for a specific brand or shop, use the googleSearch tool to find verified local service centers.
      `;
    }

    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || "Checking for the best available specialist...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Our repair network is temporarily busy. Please try again in a few seconds." };
  }
};
