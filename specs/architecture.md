# PaperFlip System Architecture

This system architecture document outlines the development of **PaperFlip**, a local-first, cross-platform "Reader" (Web & Mobile) designed to transform static PDFs into an immersive, TikTok-style feed. By leveraging client-side processing, we eliminate server costs and latency while ensuring total user privacy.

## ---

**1\. High-Level System Architecture**

PaperFlip operates as a **Real-Time Compositor** rather than a video renderer. The system layers local media, native speech synthesis, and reactive UI components to create a seamless experience across platforms.

### **Core Layered Architecture**

- **Layer 1 (Visual Background):**
  - **Web:** HTML5 Video element looping lightweight assets.
  - **Mobile:** `expo-video` for hardware-accelerated background playback.

- **Layer 2 (Audio Engine):**
  - **Web:** Web Speech API (`window.speechSynthesis`) providing native Text-to-Speech (TTS).
  - **Mobile:** `expo-speech` for native OS-level TTS.

- **Layer 3 (Reactive UI):**
  - **Web:** Svelte 5 components with fine-grained reactivity and Swiper.js for the feed.
  - **Mobile:** React Native components with NativeWind and Expo Router.

## ---

**2\. Component Design**

### **2.1 Shared Core (@paperflip/core)**

To ensure consistency and "Instant" processing (Target: < 2 seconds for first word), business logic is centralized in a framework-agnostic core package.

| Component     | Responsibility                                                                   |
| :------------ | :------------------------------------------------------------------------------- |
| **Segmenter** | Framework-agnostic logic to split text into "Shorts" based on video constraints. |
| **Database**  | Custom Key-Value store abstraction (`StorageEngine`) for documents and settings. |
| **Constants** | Shared playback speeds, character limits, and theme tokens.                      |

### **2.2 Platform-Specific Data Pipeline**

| Platform   | PDF Parser              | Local Storage Implementation |
| :--------- | :---------------------- | :--------------------------- |
| **Web**    | PDF.js (`pdfjs-dist`)   | IndexedDB via `idb-keyval`   |
| **Mobile** | `expo-pdf-text-extract` | `AsyncStorage`               |

### **2.3 The Playback & Sync Engine**

The engine acts as the orchestrator between the OS-level speech events and the visual interface.

- **Word-Level Sync:** Listen to `onboundary` (Web) or `onSpeechStart/Progress` (Mobile) events to highlight the active word in real-time.
- **Asset Management:** A randomized selection logic pulls from a pre-bundled set of lightweight videos.

### **2.4 User Interface (The "Shorts" Feed)**

The UI mimics a modern social media feed to increase session duration.

- **Virtual Scroll:**
  - **Web:** Swiper.js vertical slider.
  - **Mobile:** `FlashList` or `PagerView` for high-performance scrolling.
- **Auto-Play Logic:** Swiping triggers the SpeechSynthesis for the new segment immediately.

## ---

**3\. Data & State Model**

The application is entirely stateless regarding servers; all data resides in the user's device.

- **StorageEngine Interface:** `@paperflip/core` defines a generic `StorageEngine` (get/set/del) that platforms implement.
- **Document Schema:**
  - `documentId`: Unique identifier (UUID).
  - `segments`: Array of text blocks extracted from the PDF.
  - `currentSegmentIndex`: Tracks progress.
  - `thumbnailUri`: Local URI to the generated PDF cover.
- **User Preferences:** Stores voice pitch, speech rate, and preferred background loop style.

## ---

**4\. Technical Constraints & Risk Mitigation**

| Risk                    | Mitigation Strategy                                                                                                    |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Voice Quality**       | Native browser/OS voices can sound robotic. Users can select "High Quality" voices already installed on their OS.      |
| **Battery/Performance** | Continuous video and TTS can drain batteries. We use hardware-accelerated video decoding and OS-native speech engines. |
| **Storage Footprint**   | To keep the app small, background videos are highly compressed and limited in number.                                  |

## ---

**5\. Success Metrics**

- **Performance:** Achieve "Time to First Word" of \< 2 seconds.

- **Engagement:** Measure session duration compared to traditional static PDF readers.

- **Efficiency:** Maintain $0/mo in infrastructure costs for processing and TTS.
