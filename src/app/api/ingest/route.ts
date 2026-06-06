import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // Fetching 'audio' to match the frontend from Phase 3, NOT 'file'
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // --- STEP 1: TRANSCRIPTION (Groq Whisper) ---
    const groqAudioFormData = new FormData();
    groqAudioFormData.append("file", audioFile);
    groqAudioFormData.append("model", "whisper-large-v3");

    const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/translations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqAudioFormData
    });

    if (!whisperRes.ok) {
      throw new Error(`Whisper API failed: ${whisperRes.statusText}`);
    }

    const whisperData = await whisperRes.json();
    const transcript = whisperData.text;

    if (!transcript) {
      return NextResponse.json({ message: "Could not hear any speech. Please try again." });
    }

    // --- STEP 2: INTENT CLASSIFICATION (Groq LLaMA 3) ---
    const systemPrompt = `You are a Mahakumbh emergency router. 
    Determine if the user's text is a general question (FAQ) or a dangerous, life-threatening situation (EMERGENCY). 
    EMERGENCY triggers include: fire, stampede, crushing, injury, or urgent calls for help.
    Extract the location if mentioned.
    You MUST return valid JSON ONLY.
    Format: {"intent": "FAQ" | "EMERGENCY", "location": "string or null", "summary": "string"}`;

    const llamaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Upgraded to a safer free-tier model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ],
          response_format: { type: "json_object" } 
        })
      });
  
      if (!llamaRes.ok) {
         const errorDetails = await llamaRes.text();
         console.error("Groq LLaMA Error Details:", errorDetails);
         throw new Error(`LLaMA API failed: ${llamaRes.statusText}`);
      }

    const llamaData = await llamaRes.json();
    const aiDecision = JSON.parse(llamaData.choices[0].message.content);

    // --- STEP 3: THE SPLIT & DATABASE INSERT ---
    if (aiDecision.intent === "EMERGENCY") {
      const { error } = await supabase.from('emergency_dispatches').insert({
        location: aiDecision.location || "Unknown Location",
        emergency_type: aiDecision.summary,
        original_audio_text: transcript
      });

      if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ message: "System error logging dispatch." }, { status: 500 });
      }

      return NextResponse.json({ 
        message: `EMERGENCY DISPATCHED: Help is on the way to ${aiDecision.location || "your location"}.` 
      });
      
    } else {
      // FAQ Fallback
      return NextResponse.json({ 
        message: `FAQ Processed: ${aiDecision.summary}` 
      });
    }

  } catch (error) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}