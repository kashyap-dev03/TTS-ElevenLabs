# ElevenLabs Narrator Studio 🎙️

A modern, high-aesthetic web application for real-time AI speech narration powered by the **ElevenLabs API**.

![ElevenLabs Narrator](public/favicon.ico)

---

## ✨ Features

- 📝 **Input & Text Area**: Paste any text content with real-time character count, word count, and estimated narration duration.
- ⚡ **Model Selector**: Switch seamlessly between ElevenLabs' state-of-the-art narration models:
  - `Eleven Multilingual v2` (Recommended for audiobooks, storytelling, rich emotion across 29 languages)
  - `Eleven Flash v2.5` (Ultra-low ~75ms latency for rapid previews and real-time dialog)
  - `Eleven Turbo v2.5` (High-speed, low latency, 32 languages)
  - `Eleven Turbo v2` (Optimized for English speed)
  - `Eleven Monolingual v1` (Classic English narration)
- 🎙️ **Premier Voice Selector**: Choose from ElevenLabs voices (Rachel, Adam, Josh, Bella, Antoni, George, etc.) with automatic badge indicators.
- 🎛️ **Voice Fine-Tuning Drawer**: Fine-tune Stability, Clarity/Similarity, Style Exaggeration, and Speaker Boost.
- 🌊 **Real-Time Waveform Visualizer**: Dynamic HTML5 Canvas audio spectrum visualizer animated using the Web Audio API.
- ⏯️ **Full Playback Controls**: Play, pause, scrub timeline, seek bar, time elapsed/duration, playback speed toggles (1x, 1.25x, 1.5x, 2x), and MP3 audio download.
- 🔑 **API Key Management**: Set your key in a `.env` file or directly in the web UI with persistence in `localStorage` and a built-in "Test Connection" validation check.
- 📜 **Recent Takes History**: Keep a history of generated voiceovers in the current session for instant replay and comparison.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key (Optional)
You can configure your ElevenLabs API Key in one of two ways:
1. **Via `.env` file**:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   PORT=3000
   ```
2. **Directly in the Web UI**: Click the **API Key** button in the top right corner of the app, paste your key, test the connection, and save!

### 3. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, ES Modules, native `fetch` streaming
- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Glassmorphism & Neon Dark Theme)
- **Audio Processing**: HTML5 Audio & Web Audio API (`AudioContext`, `AnalyserNode`)
