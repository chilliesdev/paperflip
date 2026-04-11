**PaperFlip** is a local-first, cross-platform application (available on **Web via SvelteKit** and **Mobile via Expo**) that transforms static PDFs into an immersive, TikTok-style vertical video feed. Using a real-time playback engine, it overlays PDF text onto high-engagement background videos with synchronized word highlighting powered by native text-to-speech.

Key features include:

- **Zero-Latency Experience:** Processes documents on-device in milliseconds, eliminating server wait times.
- **Privacy & Offline Access:** Keeps all data on the device, allowing use without an internet connection.
- **Cost Efficiency:** Utilizes native device capabilities (Web Speech API and Expo Speech) to avoid expensive cloud API fees for voice or video rendering.
- **Shared Core Architecture:** Leverages a framework-agnostic core (`@paperflip/core`) to ensure consistent document segmentation and state management across all platforms.
