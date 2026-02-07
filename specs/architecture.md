This system architecture document outlines the development of **PaperFlip**, a browser-based, local-first "Reader" designed to transform static PDFs into an immersive, TikTok-style feed. By leveraging client-side processing, we eliminate server costs and latency while ensuring total user privacy.

## ---

**1\. High-Level System Architecture**

PaperFlip operates as a **Real-Time Compositor** rather than a video renderer. The system layers local media, native speech synthesis, and reactive UI components in the browser to create a seamless experience.

### **Core Layered Architecture**

- **Layer 1 (Visual Background):** A HTML5 Video element looping lightweight, high-engagement background assets stored in the browser's local file system.

- **Layer 2 (Audio Engine):** The Web Speech API (SpeechSynthesis) providing native Text-to-Speech (TTS).

- **Layer 3 (Reactive UI):** A vertical scrolling interface that synchronizes text highlighting with the TTS playback cursor.

## ---

**2\. Component Design**

### **2.1 On-Device Data Pipeline**

To maintain the "Instant" goal (Target: \< 2 seconds for first word), the pipeline is entirely client-side.

| Component         | Technology           | Requirement                                                                     |
| :---------------- | :------------------- | :------------------------------------------------------------------------------ |
| **PDF Parser**    | PDF.js               | Extract raw text and structure directly in the browser.                         |
| **Segmenter**     | JavaScript Logic     | Split text into "Shorts" based on paragraph breaks or \~1,000 character counts. |
| **Local Storage** | IndexedDB / Dexie.js | Persist DocumentID, parsed segments, and user progress (CurrentSegmentIndex).   |

### **2.2 The Playback & Sync Engine**

The engine acts as the orchestrator between the OS-level speech events and the visual interface.

- **Speech Integration:** Utilizes the browser's native window.speechSynthesis to avoid API costs.

- **Word-Level Sync:** Listen to onboundary events from the Speech API to highlight the active word on the screen in real-time.

- **Asset Management:** A randomized selection logic pulls from a pre-bundled set of 5-10 lightweight videos (approx. 50MB total).

### **2.3 User Interface (The "Shorts" Feed)**

The UI mimics a modern social media feed to increase session duration.

- **Virtual Scroll:** Uses a vertical "FlatList" style component where each PDF segment is treated as a single "Slide".

- **Auto-Play Logic:** Swiping triggers the SpeechSynthesis for the new segment immediately.

- **Interaction Model:** \* **Single Tap:** Toggle Pause/Play.
  - **Double Tap:** Cycle through background video styles.

## ---

**3\. Data & State Model**

The application is entirely stateless regarding servers; all data resides in the user's browser.

- **Document Schema:**
  - DocumentID: Reference to the local file.

  - Segments: Array of text blocks extracted from the PDF.

  - CurrentSegmentIndex: Tracks the user's progress for resume-on-open.

- **User Preferences:** Stores voice pitch, speech rate, and preferred background loop style.

## ---

**4\. Technical Constraints & Risk Mitigation**

| Risk                    | Mitigation Strategy                                                                                                                                                |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Voice Quality**       | Native browser voices can sound robotic. We will allow users to select "High Quality" voices already installed on their OS via the browser's voice selection menu. |
| **Battery/Performance** | Continuous video and TTS can drain mobile batteries. We will use hardware-accelerated CSS and video decoding to minimize CPU load.                                 |
| **Storage Footprint**   | To keep the app under 150MB, background videos must be highly compressed (H.265/HEVC).                                                                             |

## ---

**5\. Success Metrics**

- **Performance:** Achieve "Time to First Word" of \< 2 seconds.

- **Engagement:** Measure session duration compared to traditional static PDF readers.

- **Efficiency:** Maintain $0/mo in infrastructure costs for processing and TTS.
