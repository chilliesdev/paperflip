# Paperflip (v1.0) - Study Shorts

**Paperflip** is a local-first application designed to modernize the studying process. Its flagship feature, **"Study Shorts,"** transforms dense, static PDF learning materials into engaging, short-form video content (similar to TikTok or YouTube Shorts).

This repository contains the **Monorepo** implementation of Paperflip, focusing on privacy and speed by processing documents entirely on-device. It includes both a Web App and a Mobile App that share core business logic.

## 🚀 Features

- **📄 PDF Upload & Parsing:** Drag-and-drop PDF upload processed locally. No server upload required.
- **✂️ Smart Chunking:** Automatically segments text into digestible chunks for "short" video consumption.
- **🗣️ Text-to-Speech (TTS):** Uses native device APIs (Web Speech API / Native Voice) to read content aloud with real-time word highlighting.
- **📱 Vertical Feed:** A TikTok-style vertical swipe interface for seamless navigation between chunks.
- **💾 Offline Storage:** Uses RxDB to store your study sessions locally across both platforms.
- **🎨 Consistent Design:** Built with Tailwind CSS (Web) and NativeWind (Mobile) for a seamless experience.

## 🏢 Architecture

Paperflip is structured as a **Turborepo** monorepo using `pnpm`:

- `apps/web`: SvelteKit web application.
- `apps/mobile`: React Native (Expo) mobile application.
- `packages/core`: Shared TypeScript logic (Database, Segmenter, Constants).
- `packages/*-config`: Shared configuration packages (ESLint, Prettier, Tailwind, TypeScript).

## 🛠️ Tech Stack

- **Web Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Mobile Framework:** [Expo](https://expo.dev/) (React Native)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) / [NativeWind](https://www.nativewind.dev/)
- **State/Database:** [RxDB](https://rxdb.info/) (Client-side NoSQL)
- **Monorepo Tooling:** [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/)

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (v9+)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/paperflip.git
cd paperflip
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run the development environment

To start all applications and packages in development mode from the root:

```bash
pnpm run dev
```

Alternatively, you can run apps individually:
- **Web App:** `cd apps/web && pnpm run dev` (Runs on `http://localhost:5173`)
- **Mobile App:** `cd apps/mobile && pnpm run start` (Opens the Expo bundler)

### 4. Background Videos (Web App)

The web application expects background video files to be present in the `apps/web/static/videos/` directory.

1.  Create the directory:
    ```bash
    mkdir -p apps/web/static/videos
    ```
2.  Add video files named `bg-video-1.mp4`, `bg-video-2.mp4`, etc., to this folder.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
