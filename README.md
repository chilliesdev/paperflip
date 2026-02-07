# Paperflip (v1.0) - Study Shorts

**Paperflip** is a web application designed to modernize the studying process. Its flagship feature, **"Study Shorts,"** transforms dense, static PDF learning materials into engaging, short-form video content (similar to TikTok or YouTube Shorts).

This repository contains the **Client-Side MVP** implementation of Paperflip, focusing on privacy and speed by processing documents entirely within the browser.

## 🚀 Features

### Current Implementation (v1.0)

- **📄 PDF Upload & Parsing:** Drag-and-drop PDF upload processed locally using `pdfjs-dist`. No server upload required.
- **✂️ Smart Chunking:** Automatically segments text into digestible chunks for "short" video consumption.
- **🗣️ Text-to-Speech (TTS):** Uses the Web Speech API to read content aloud with real-time word highlighting (Karaoke style).
- **📱 Vertical Feed:** A TikTok-style vertical swipe interface powered by Swiper for seamless navigation between chunks.
- **💾 Offline Storage:** Uses RxDB to store your study sessions locally in the browser.
- **🎨 Responsive Design:** Built with Tailwind CSS for a mobile-first experience.

### Planned Features (v2.0 / Roadmap)

Based on the full Product Requirements Document (PRD), future versions aim to include:

- **Server-Side Processing:** Robust backend with NestJS and MongoDB for handling larger files and cross-device sync.
- **AI-Powered Summarization:** Integration with LLMs (e.g., GPT-4) for smarter text segmentation and summarization.
- **Premium TTS:** Integration with ElevenLabs or OpenAI Audio API for high-quality, natural-sounding voices.
- **Quiz Injection:** Automatically generated quizzes inserted between video segments.

## 🛠️ Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State/Database:** [RxDB](https://rxdb.info/) (Client-side NoSQL)
- **PDF Processing:** [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`)
- **Audio/TTS:** Web Speech API (`SpeechSynthesis`)
- **UI Components:** [Swiper](https://swiperjs.com/) (for the vertical feed)

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/paperflip.git
cd paperflip
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add Background Videos (Important!)

The application expects background video files to be present in the `static/videos/` directory.

1.  Create the directory:
    ```bash
    mkdir -p static/videos
    ```
2.  Add video files named `bg-video-1.mp4`, `bg-video-2.mp4`, etc., to this folder.
    - _Note: You can update the video sources in `src/lib/components/Feed.svelte` if you prefer different filenames._

### 4. Run the development server

```bash
npm run dev
```

Visit `http://localhost:5173` (or the URL shown in your terminal) to start using Paperflip.

## 📂 Project Structure

```
src/
├── lib/
│   ├── audio.ts        # TTS (Text-to-Speech) logic
│   ├── database.ts     # RxDB database configuration
│   ├── segmenter.ts    # Text chunking logic
│   └── components/
│       ├── Feed.svelte # Main vertical video player
│       └── ...
├── routes/
│   └── +page.svelte    # Main entry point (Upload & Feed view)
static/
├── pdf.worker.min.mjs  # PDF.js worker file
└── videos/             # (User Created) Background video assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
