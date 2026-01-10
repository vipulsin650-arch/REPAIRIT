
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ServiceContext } from "../types";

const REPAIR_COST_ALGORITHM = `
COST ESTIMATION ALGORITHM (Strictly follow these brackets in ₹):
1. REPAIR LABOR RANGES:
   - Mobiles/Smartphones: ₹500 - ₹3,000
   - AC, Fridge & Heavy Appliances: ₹2,000 - ₹8,000
   - Laptops & Computing: ₹1,500 - ₹10,000
   - Clothing & Alterations: ₹100 - ₹800
   - Footwear/Shoes: ₹150 - ₹1,200
   - Automotive (Bikes/Cars): ₹500 - ₹5,000
   - Watches: ₹100 - ₹1,500

2. DELIVERY & CONVENIENCE CHARGES (Mandatory):
   - Within 0-4 km: ₹15 (Minimum Delivery)
   - 4-6 km: ₹30
   - 6-10 km: ₹60
   - Above 10 km: ₹10 per additional km.

3. SEVERITY ADJUSTMENT:
   - MINOR: Low end of labor range.
   - MODERATE: Middle of labor range.
   - MAJOR: High end of labor range.
`;

const PERSONA_INSTRUCTIONS = `
SHOPKEEPER PERSONA:
You are "Chacha", the friendly but expert Master Fixer at the local repair hub. 
- Tone: Extremely helpful, polite, and technical. Use a "Local Shopkeeper" vibe (warm and reassuring).
- Goal: Diagnose the product defect through conversation.
- Rules:
  1. If the user's description is vague, DO NOT give a final price. Instead, ask 2-3 specific diagnostic questions (e.g., "Did it fall in water?", "Is the touch responding?", "Is there a burning smell?").
  2. If an image is provided, analyze the visible damage and ask about the internal components (e.g., "Screen is cracked, but is the display bleeding or is it just the glass?").
  3. Once you have enough info, provide a quote.
  4. MANDATORY: When providing a quote, you MUST include a line at the end exactly like this:
     BILL_BREAKDOWN: Labor: ₹[Amount], Delivery: ₹[Amount], Distance: [KM]km, Total: ₹[Sum]
  5. Always end with a reassuring closing like "Don't worry, we'll make it like new!"
`;

export const getExpertResponse = async (
  prompt: string,
  base64Image?: string,
  context: ServiceContext = 'pickup'
): Promise<{ text: string; sources?: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    let systemInstruction = REPAIR_COST_ALGORITHM + "\n" + PERSONA_INSTRUCTIONS;

    if (context === 'pickup') {
      systemInstruction += `
        CONTEXT: EXPRESS PICKUP
        - Remind them that a runner is nearby.
        - Ask questions that help the runner know how carefully to handle the item.
      `;
    } else if (context === 'onsite') {
      systemInstruction += `
        CONTEXT: ONSITE VISIT
        - Ask questions that help the technician bring the right spare parts.
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
        temperature: 0.8,
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || "Bhaiya, let me check the details for you...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "The shop is a bit crowded right now. Standard delivery starts at ₹15, tell me what's wrong?" };
  }
};

export const performVisualSearch = async (
  base64Image: string
): Promise<{ 
  productType: string; 
  description: string; 
  suggestedShops: any[]; 
  category: string;
  estimate: string;
  deliveryFee: string;
  distance: string;
  severity: 'Minor' | 'Moderate' | 'Major';
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Identify this product and its visible defect. 
  1. Calculate Repair Cost + Delivery Fee (assume a random local distance between 1-8km).
  2. Determine Defect Severity.
  3. Suggest what diagnostic questions I should ask the customer next.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: `You are a Visual Pricing Scout for 'Repair It'. 
      ${REPAIR_COST_ALGORITHM}
      IMPORTANT:
      - Clearly break down: Labor Cost, Delivery Fee, and Distance.
      - Shop names must be proper business titles (No .com/urls).`,
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "";
  const productTypeMatch = text.match(/identif(ied|y) as (?:a |an )?([^.]+)/i);
  const laborMatch = text.match(/₹[0-9,]+/);
  const deliveryMatch = text.match(/₹(15|30|60)/);
  const distanceMatch = text.match(/([0-9.]+)\s*km/);
  const severityMatch = text.match(/Minor|Moderate|Major/i);

  return {
    productType: productTypeMatch ? productTypeMatch[2] : "Item detected",
    description: text,
    suggestedShops: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    category: text.toLowerCase().includes('phone') ? 'Electronics' : 'General',
    estimate: laborMatch ? laborMatch[0] : "Check with Expert",
    deliveryFee: deliveryMatch ? `₹${deliveryMatch[1]}` : "₹15",
    distance: distanceMatch ? distanceMatch[0] : "1.2 km",
    severity: (severityMatch ? severityMatch[0].charAt(0).toUpperCase() + severityMatch[0].slice(1).toLowerCase() : 'Moderate') as any
  };
};
