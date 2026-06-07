import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for Embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Authentic Mahakumbh Data
const mahakumbhFacts = [
  "Lost and Found centers (Khoya Paya Kendra) are prominently located at the Parade Ground and Jhusi sectors, marked with large white and blue digital display boards.",
  "The major Shahi Snan (Royal Bath) rituals take place at the Triveni Sangam. Access points for the main bathing ghats are managed through Sector 1 and Sector 4.",
  "A central 100-bed temporary hospital is set up in Sector 1 (Triveni Marg), equipped with 24/7 ambulance services and a dedicated burn unit.",
  "Free e-rickshaw shuttle services for elderly and disabled pilgrims run continuously between the Arail Uparhar parking zone and the main Sangam Ghat.",
  "Government-approved Kalpvas tent bookings and premium Swiss cottages are managed exclusively through the UP Tourism helpdesk located near the Saraswati Ghat."
];

export async function GET() {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    for (const fact of mahakumbhFacts) {
      // Convert text to vector embedding
      const result = await embeddingModel.embedContent(fact);
      const embedding = result.embedding.values;

      // Insert into Supabase
      const { error } = await supabase.from('knowledge_base').insert({
        content: fact,
        embedding: embedding,
      });

      if (error) throw error;
    }

    return NextResponse.json({ message: "Mahakumbh data embedded and seeded successfully!" });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}