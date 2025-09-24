
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WorkArea } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const WORK_AREAS_ARRAY = Object.values(WorkArea);

export const generateEmployeeData = async (): Promise<Partial<any>> => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a single realistic employee profile with a first name, last name, a 3-digit bonus number, and an 8-digit payroll number. Also, select 1 to 3 work areas from this list: ${WORK_AREAS_ARRAY.join(', ')}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            bonusNumber: { type: Type.STRING, pattern: "^\\d{3}$" },
            payrollNumber: { type: Type.STRING, pattern: "^\\d{8}$" },
            workAreas: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.STRING, 
                enum: WORK_AREAS_ARRAY 
              } 
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    return data;
  } catch (error) {
    console.error("Error generating employee data:", error);
    throw new Error("Failed to fetch AI-generated employee data.");
  }
};

export const replaceBackground = async (base64Image: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const mimeType = base64Image.substring(5, base64Image.indexOf(';'));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image.split(',')[1],
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: 'Replace the background of this portrait with a professional and slightly blurred office setting. Keep the person in focus.',
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image was returned from the API.");
    } catch (error) {
        console.error("Error replacing background:", error);
        throw new Error("Failed to replace background using AI.");
    }
};
