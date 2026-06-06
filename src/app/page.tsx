"use client";

import { useState, useRef } from 'react';
import { Mic, MapPin, Calendar, HeartHandshake, Home, AlertTriangle, Info } from 'lucide-react';

export default function PilgrimHub() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToAI(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAiResponse(""); 
      setActiveIntent(null); // Reset grid highlight
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setAiResponse("Please allow microphone access to use KumbhVani.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToAI = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.message || "Request sent successfully.");
        setActiveIntent(data.intent || "FAQ");

        // --- NEW: Native Browser Text-to-Speech ---
        window.speechSynthesis.cancel(); // Stop any existing audio
        const speech = new SpeechSynthesisUtterance(data.message);
        if (data.language) {
          speech.lang = data.language; // Helps the browser choose the right local accent
        }
        window.speechSynthesis.speak(speech);
        // -----------------------------------------

      } else {
        setAiResponse("Error connecting to the control room.");
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      setAiResponse("Network error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to check if a grid item should be highlighted
  const isHighlighted = (intent: string) => activeIntent === intent;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      
      <div className="text-center mb-8 w-full max-w-md">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-tight">
          KumbhVani
        </h1>
        <p className="text-neutral-400 font-medium">Your Voice Assistant for Mahakumbh</p>
      </div>

      {/* Dynamic Services Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-10">
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ${isHighlighted('NAVIGATION') ? 'bg-blue-500/20 border-blue-500 text-blue-400 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
          <MapPin size={32} className="mb-2" />
          <span className="font-bold text-sm tracking-wide">NAVIGATION</span>
        </div>
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ${isHighlighted('EVENTS') ? 'bg-purple-500/20 border-purple-500 text-purple-400 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
          <Calendar size={32} className="mb-2" />
          <span className="font-bold text-sm tracking-wide">EVENTS</span>
        </div>
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ${isHighlighted('SERVICES') ? 'bg-green-500/20 border-green-500 text-green-400 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
          <HeartHandshake size={32} className="mb-2" />
          <span className="font-bold text-sm tracking-wide">SERVICES</span>
        </div>
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ${isHighlighted('ACCOMMODATION') ? 'bg-orange-500/20 border-orange-500 text-orange-400 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
          <Home size={32} className="mb-2" />
          <span className="font-bold text-sm tracking-wide">STAY</span>
        </div>
      </div>

      {/* AI Response Box */}
      <div className="w-full max-w-md h-28 flex items-center justify-center mb-8 px-4">
        {isProcessing ? (
          <div className="flex flex-col items-center text-orange-400">
            <span className="animate-spin mb-2 border-4 border-orange-400 border-t-transparent rounded-full w-8 h-8"></span>
            <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Translating...</p>
          </div>
        ) : aiResponse ? (
          <div className={`p-5 rounded-2xl border shadow-2xl w-full text-center ${activeIntent === 'EMERGENCY' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-neutral-800 border-neutral-700 text-white'}`}>
            {activeIntent === 'EMERGENCY' && <AlertTriangle className="inline-block mb-1 mr-2" size={20} />}
            <p className="text-lg font-medium leading-snug">{aiResponse}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-600">
            <Info size={24} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Hold the mic and ask a question</p>
          </div>
        )}
      </div>

      {/* Polished Mic Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 select-none ${
          isRecording 
            ? 'bg-red-600 scale-95 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse' 
            : 'bg-gradient-to-br from-orange-500 to-red-600 hover:scale-105 shadow-[0_15px_35px_rgba(234,88,12,0.4)]'
        }`}
      >
        <Mic size={48} className="text-white drop-shadow-md" />
      </button>
      
    </div>
  );
}