import { GoogleGenAI, Type } from "@google/genai";
import { CycloParams, AnalysisResult } from '../types';
import { AI_MODEL_ANALYSIS, AI_MODEL_CHAT, AI_MODEL_GENERATE } from '../constants';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDesign = async (params: CycloParams, minWall: number): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Error: API Key not found.";

  const prompt = `
    Analyze this Cycloidal Drive design configuration for manufacturability and performance.
    
    Parameters:
    - Number of Pins: ${params.pinCount}
    - Pin Circle Radius: ${params.pinCircleRadius} mm
    - Pin Radius: ${params.pinRadius} mm
    - Eccentricity: ${params.eccentricity} mm
    - Center Hole Radius: ${params.holeRadius} mm
    - Manufacturing Tolerance (Profile Gap): ${params.tolerance} mm
    - Hole Tolerance: ${params.holeTolerance} mm
    
    Calculated Metrics:
    - Minimum Wall Thickness (Profile to Center Hole): ${minWall.toFixed(3)} mm
    - Reduction Ratio: ${params.pinCount - 1}:1
    
    Please provide a concise engineering assessment. 
    1. Is the wall thickness sufficient for 3D printing (PLA/PETG) or CNC aluminum?
    2. Is the eccentricity reasonable for this scale?
    3. Warning about undercutting if applicable.
    4. Estimated torque capability level (Low/Medium/High) based on geometry.
    5. Are the selected tolerances appropriate for standard FDM printing?
    
    Format as Markdown. Keep it under 200 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_ANALYSIS,
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please check your API key or network connection.";
  }
};

export const chatWithEngineer = async (history: {role: 'user' | 'model', text: string}[], newMessage: string) => {
    const ai = getAI();
    if (!ai) throw new Error("API Key missing");

    const chat = ai.chats.create({
        model: AI_MODEL_CHAT,
        config: {
            systemInstruction: "You are a senior mechanical engineer specializing in gearbox design. You provide helpful, technical, but accessible advice on cycloidal drives, gear ratios, and 3D printing gears."
        },
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
};

export interface GeneratedDesign {
    params: CycloParams;
    reasoning: string;
}

export const generateDesignParameters = async (userRequirements: string): Promise<GeneratedDesign | null> => {
    const ai = getAI();
    if (!ai) throw new Error("API Key missing");

    try {
        const response = await ai.models.generateContent({
            model: AI_MODEL_GENERATE,
            contents: `Generate a valid set of Cycloidal Drive parameters based on this user requirement: "${userRequirements}".
            
            Geometric Constraints to enforce:
            1. pinRadius should generally be less than (pinCircleRadius / pinCount).
            2. eccentricity must be small enough to prevent self-intersection (looping). A safe heuristic is eccentricity < pinRadius * 0.7.
            3. pinCount must be an integer >= 4.
            4. pinCircleRadius > holeRadius + pinRadius.

            Manufacturing Context (Apply these if user mentions specific machines):
            - If user mentions "Bambu Lab", "Prusa", or "High Quality FDM", set tolerance ≈ 0.08-0.1mm.
            - If "CNC" or "Metal", set tolerance ≈ 0.02-0.05mm.
            - If "Standard FDM" or generic "3D print", set tolerance ≈ 0.15-0.2mm.
            - If "Resin", set tolerance ≈ 0.05mm.
            
            Return the result in JSON format.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        params: {
                            type: Type.OBJECT,
                            properties: {
                                pinCount: { type: Type.INTEGER },
                                pinCircleRadius: { type: Type.NUMBER },
                                pinRadius: { type: Type.NUMBER },
                                eccentricity: { type: Type.NUMBER },
                                holeRadius: { type: Type.NUMBER },
                                resolution: { type: Type.INTEGER },
                                tolerance: { type: Type.NUMBER, description: "Profile offset gap, typically 0.1-0.2mm" },
                                holeTolerance: { type: Type.NUMBER, description: "Hole expansion, typically 0.1mm" }
                            },
                            required: ["pinCount", "pinCircleRadius", "pinRadius", "eccentricity", "holeRadius", "resolution", "tolerance", "holeTolerance"]
                        },
                        reasoning: {
                            type: Type.STRING,
                            description: "A brief explanation (max 50 words) of why these values were chosen."
                        }
                    },
                    required: ["params", "reasoning"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as GeneratedDesign;
    } catch (e) {
        console.error("Generation error:", e);
        return null;
    }
}