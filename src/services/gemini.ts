import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiModel = (modelName: string = "gemini-3.1-pro-preview") => {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

export const analyzeItinerary = async (content: string, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following EMBA itinerary and deconstruct it into User Stories. 
    Format: "As a [Role], I want to [Action] so that [Value]".
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    
    Itinerary:
    ${content}
    
    Return a JSON array of objects with properties: role, action, value.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            action: { type: Type.STRING },
            value: { type: Type.STRING },
          },
          required: ["role", "action", "value"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const suggestHiddenNeeds = async (itinerary: string, userStories: any[], lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on this EMBA itinerary and these user stories, suggest 5 "hidden needs" for high-level CEOs. 
    Think about: Family involvement, Personal branding, Private high-end social scenes, Health/Care.
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    
    Itinerary: ${itinerary}
    Stories: ${JSON.stringify(userStories)}
    
    Return a JSON array of objects with properties: category, description.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["category", "description"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateJourneyMap = async (state: any, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Design an EMBA Experience Journey Map (Before, During, After) based on the project state.
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    State: ${JSON.stringify(state)}
    
    Return a JSON array of objects with properties: phase (Before/During/After), title, description, emotion (1-10).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: { type: Type.STRING, enum: ["Before", "During", "After"] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            emotion: { type: Type.NUMBER },
          },
          required: ["phase", "title", "description", "emotion"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateMoSCoW = async (state: any, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on the EMBA journey state, prioritize features using the MoSCoW method (Must, Should, Could, Won't).
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    State: ${JSON.stringify(state)}
    
    Return a JSON array of objects with properties: id (string), content, category (Must/Should/Could/Won't).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            content: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Must", "Should", "Could", "Won't"] },
          },
          required: ["id", "content", "category"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateBlueprint = async (state: any, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create a "Super E" Blueprint Optimization. Integrate Social, Cultural, and Academic layers onto the Base Model.
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    State: ${JSON.stringify(state)}
    
    Return a detailed Markdown report.`,
  });

  return response.text;
};

export const generateInfographicData = async (state: any, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Generate key statistics for an infographic summarizing the EMBA journey.
    Example: "3 CEO Dialogues", "2 World Heritage Visits", "1 High-end Dinner".
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    State: ${JSON.stringify(state)}
    
    Return a JSON array of objects with properties: label, value, icon (lucide icon name).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            icon: { type: Type.STRING },
          },
          required: ["label", "value", "icon"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generatePitch = async (state: any, lang: string = 'en') => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Generate a 90-second elevator pitch for this EMBA journey strategy. 
    Focus on market expansion, hidden champions, and personal/professional growth.
    Please provide the response in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.
    State: ${JSON.stringify(state)}`,
  });

  return response.text;
};

export const generateImage = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  const ai = getGeminiModel();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ text: prompt }],
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
