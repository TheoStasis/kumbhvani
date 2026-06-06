import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  // 1. Upgrade to the active model
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  // 2. Force 1536 dimensions so it doesn't crash your Supabase SQL table
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: 1536 
  } as any); // Using 'as any' just to bypass strict TS complaining during the hackathon
  
  return result.embedding.values;
}