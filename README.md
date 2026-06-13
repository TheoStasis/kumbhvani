
---

# KumbhVani 🕉️

**1st Place Winner — Mahakumbh Hackathon 2028 (Expert Hire x VIT Bhopal)**

**KumbhVani** is a multilingual AI pilgrim assistant and emergency response platform built to handle the massive scale and diversity of the Mahakumbh 2028. It serves as a centralized intelligence layer, bridging language barriers and routing critical telemetry data in real-time.

## 🚀 Key Features

* **Multilingual AI Assistant:** Breaks down language barriers, allowing diverse pilgrims to communicate needs, find routes, and get assistance in their native languages.


* **Live Telemetry & Dispatch Engine:** Real-time GPS tracking and emergency routing with sub-3s AI latency.
* **Zero-Shot Routing:** Intelligent, automated categorization of user inputs to direct emergency and operational requests to the right channels instantly.
* **Zero-Dollar Infrastructure:** Highly optimized, lightweight architecture designed to run efficiently without massive server costs.

## 🛠️ Tech Stack

* **Frontend:** Next.js, Tailwind CSS, Framer Motion
* **Backend & AI:** AI/LLM Integration, Zero-shot routing logic, Vector search
* **Data & Tracking:** Live GPS Telemetry

## 🏗️ System Architecture



KumbhVani utilizes a high-speed, dual-pipeline architecture designed to process multimodal inputs and route them with sub-3s latency.

* **Client Layer Intake:** Captures raw audio via the MediaRecorder API, alongside live GPS coordinates and device telemetry (battery, network status), bundling them into a single multipart POST payload.
* **AI Engine & Intent Routing:** The payload is processed by Groq Whisper (whisper-large-v3) for instant multilingual speech-to-text. An LLM (LLaMA 3 / Gemini) then acts as an intent router, using zero-shot classification to instantly categorize the request as either "Routine" or "Emergency."
* **Path A (Routine Flow):** Standard queries trigger a Supabase pgvector cosine similarity search against a chunked knowledge base (FAQs and ritual docs). The system then synthesizes a localized audio response (Hindi, Bhojpuri, or English) directly to the pilgrim.
* **Path B (Emergency Flow):** Critical situations bypass standard retrieval. Real-time WebSockets immediately push the user's exact GPS, telemetry, and transcribed audio to an Admin Dashboard featuring a live map, allowing operators to instantly dispatch responders.

## 🏃‍♂️ Quick Start

To run this project locally:

```bash
# Clone the repository
git clone https://github.com/TheoStasis/kumbhvani.git

# Navigate into the directory
cd kumbhvani

# Install dependencies
npm install

# Start the development server
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the live application.

## ⚠️ Hackathon Disclaimer

*Note: This project was built from scratch within a highly constrained 24-hour hackathon environment. The focus was on architectural viability, sub-3s latency, and feature execution over code purity. Some sections may contain technical debt, hardcoded variables, or rapid prototyping shortcuts.*