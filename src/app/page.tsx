"use client";

import { useState, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  
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
        // Stop all microphone tracks to turn off the red recording light in the browser tab
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAiResponse(""); 
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
      // We will build this API route in the next phase
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.message || "Request sent successfully.");
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

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 text-white">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">KumbhVani</h1>
        <p className="text-neutral-400">Hold the button below and speak your problem</p>
      </div>

      {/* The Giant Microphone Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`w-48 h-48 rounded-full text-white font-bold text-2xl transition-all duration-300 shadow-2xl flex flex-col items-center justify-center select-none ${
          isRecording 
            ? 'bg-red-500 scale-95 shadow-red-500/50' 
            : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-blue-500/30'
        }`}
      >
        {isRecording ? "Recording..." : "Hold to Speak"}
      </button>

      {/* Feedback UI */}
      <div className="mt-12 text-xl text-center max-w-md h-20 flex items-center justify-center">
        {isProcessing && (
          <p className="animate-pulse text-yellow-400 font-semibold">Processing...</p>
        )}
        {aiResponse && !isProcessing && (
          <p className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 shadow-lg">
            {aiResponse}
          </p>
        )}
      </div>

    </div>
  );
}