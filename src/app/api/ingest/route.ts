import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/utils/embeddings'; // NEW: Importing your vector generator

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
      const formData = await req.formData();
      const audioFile = formData.get("audio");
  
      if (!audioFile) {
        return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
      }
  
      // --- STEP 1: TRANSCRIPTION & TRANSLATION (Groq Whisper) ---
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
      console.log("WHISPER HEARD:", transcript);
  
      if (!transcript) {
        return NextResponse.json({ message: "Could not hear any speech. Please try again." });
      }
  
      // --- STEP 2: INTENT CLASSIFICATION (Groq LLaMA 3) ---
      // UPDATED: Now categorizes into specific Mahakumbh services
      const systemPrompt = `You are a Mahakumbh emergency router. 
      Determine if the user's text is a dangerous situation (EMERGENCY) or a general inquiry (NAVIGATION, EVENTS, SERVICES, ACCOMMODATION, FAQ).
      EMERGENCY triggers include: fire, stampede, crushing, injury, or urgent calls for help.
      Extract the location if mentioned.
      You MUST return valid JSON ONLY.
      Format: {"intent": "EMERGENCY" | "NAVIGATION" | "EVENTS" | "SERVICES" | "ACCOMMODATION" | "FAQ", "location": "string or null", "summary": "string"}`;
      const llamaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
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
 
     // --- STEP 3: THE SPLIT ---
     if (aiDecision.intent === "EMERGENCY") {
       
       // THE PANIC LANE
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
        message: `EMERGENCY DISPATCHED: Help is on the way to ${aiDecision.location || "your location"}.`,
        intent: aiDecision.intent
      });
      
    } else {
      
      // THE CALM LANE (RAG PIPELINE)
      // 1. Convert user's question into a math vector
      const queryVector = await generateEmbedding(transcript);

      // 2. Mathematically search the guidebook database
      const { data: matchedFacts, error: rpcError } = await supabase.rpc('match_mahakumbh_knowledge', {
        query_embedding: queryVector,
        match_threshold: 0.3, // Lower threshold to ensure we catch similarities
        match_count: 3
      });

      if (rpcError) {
        console.error("Supabase RPC Error:", rpcError);
        return NextResponse.json({ message: "System error searching guidebook." }, { status: 500 });
      }

      // 3. Extract the text from the top matches
      const knowledgeContext = matchedFacts && matchedFacts.length > 0
        ? matchedFacts.map((fact: any) => fact.content).join("\n\n")
        : "No specific information found in the guidebook for this query.";

      // 4. Send the facts + the user's question back to the LLM to synthesize an answer
      const ragPrompt = `You are KumbhVani, a helpful assistant at the Mahakumbh festival.
      Answer the user's query using ONLY the provided knowledge context below. Keep it conversational, warm, and concise (1-2 sentences).
      If the context does not contain the answer, politely say you don't have that specific information but direct them to the nearest help desk.
      
      KNOWLEDGE CONTEXT:
      ${knowledgeContext}`;




// import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// // Initialize Supabase using environment variables
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const supabase = createClient(supabaseUrl, supabaseKey);

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     // Fetching 'audio' to match the frontend from Phase 3, NOT 'file'
//     const audioFile = formData.get("audio");

//     if (!audioFile) {
//       return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
//     }

//     // --- STEP 1: TRANSCRIPTION (Groq Whisper) ---
//     const groqAudioFormData = new FormData();
//     groqAudioFormData.append("file", audioFile);
//     groqAudioFormData.append("model", "whisper-large-v3");

//     const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/translations", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
//       },
//       body: groqAudioFormData
//     });

//     if (!whisperRes.ok) {
//       throw new Error(`Whisper API failed: ${whisperRes.statusText}`);
//     }

//     const whisperData = await whisperRes.json();
//     const transcript = whisperData.text;
//     // console.log("WHISPER HEARD:", transcript);

//     if (!transcript) {
//       return NextResponse.json({ message: "Could not hear any speech. Please try again." });
//     }

//     // --- STEP 2: INTENT CLASSIFICATION (Groq LLaMA 3) ---
//     const systemPrompt = `You are a Mahakumbh emergency router. 
//     Determine if the user's text is a general question (FAQ) or a dangerous, life-threatening situation (EMERGENCY). 
//     EMERGENCY triggers include: fire, stampede, crushing, injury, or urgent calls for help.
//     Extract the location if mentioned.
//     You MUST return valid JSON ONLY.
//     Format: {"intent": "FAQ" | "EMERGENCY", "location": "string or null", "summary": "string"}`;

//     const llamaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: "llama-3.1-8b-instant", // Upgraded to a safer free-tier model
//           messages: [
//             { role: "system", content: systemPrompt },
//             { role: "user", content: transcript }
//           ],
//           response_format: { type: "json_object" } 
//         })
//       });
  
//       if (!llamaRes.ok) {
//          const errorDetails = await llamaRes.text();
//          console.error("Groq LLaMA Error Details:", errorDetails);
//          throw new Error(`LLaMA API failed: ${llamaRes.statusText}`);
//       }

//     const llamaData = await llamaRes.json();
//     const aiDecision = JSON.parse(llamaData.choices[0].message.content);

//     // --- STEP 3: THE SPLIT & DATABASE INSERT ---
//     if (aiDecision.intent === "EMERGENCY") {
//       const { error } = await supabase.from('emergency_dispatches').insert({
//         location: aiDecision.location || "Unknown Location",
//         emergency_type: aiDecision.summary,
//         original_audio_text: transcript
//       });

//       if (error) {
//         console.error("Supabase Error:", error);
//         return NextResponse.json({ message: "System error logging dispatch." }, { status: 500 });
//       }

//       return NextResponse.json({ 
//         message: `EMERGENCY DISPATCHED: Help is on the way to ${aiDecision.location || "your location"}.` 
//       });
      
//     } else {
//       // FAQ Fallback
//       return NextResponse.json({ 
//         message: `FAQ Processed: ${aiDecision.summary}` 
//       });
//     }

//   } catch (error) {
//     console.error("Pipeline Error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }