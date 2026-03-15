# Phase 5: Mobile-Specific Implementation - Strategic Plan

This document outlines the execution strategy for Phase 5 of the Paperflip architecture transition: rebuilding the user interface in React Native and implementing native modules for PDF rendering, audio playback, and text-to-speech.

## 1. Understanding the Goal
The objective is to deliver a fully functional mobile application within the `apps/mobile` directory. This involves translating the existing Svelte-based web UI into a React-based mobile UI using NativeWind, and replacing browser-specific APIs (Web Speech API, PDF.js rendering) with high-performance native modules (Expo Speech, `react-native-pdf`, etc.).

## 2. Investigation & Analysis
- **UI Translation (Svelte to React):**
    - Svelte's reactive `$state` and `$derived` runes in `apps/web` will be replaced by React hooks (`useState`, `useMemo`, `useEffect`) or shared logic from `@paperflip/core`.
    - NativeWind allows for high reuse of Tailwind CSS classes from the web app, but layout components (e.g., `div`, `section`) must be replaced with React Native primitives (`View`, `Text`, `ScrollView`).
- **Navigation:**
    - `expo-router` will be used to mirror the file-based routing of SvelteKit, ensuring a consistent developer experience across platforms.
- **Native Audio & TTS:**
    - **TTS:** `expo-speech` will replace `window.speechSynthesis`. We must ensure the `onBoundary` event is available for word-level highlighting (native to iOS, may require polyfills or alternative approaches on Android).
    - **Background Audio/Video:** `expo-av` will handle the high-engagement background loops.
- **PDF Handling:**
    - While `@paperflip/core` handles text extraction, `apps/mobile` will use `react-native-pdf` for any direct PDF interactions (e.g., initial file preview or page-based reading modes).
- **Data Persistence:**
    - The mobile app must initialize RxDB using a native storage adapter (e.g., `sqlite` via `expo-sqlite`) instead of the web's `indexeddb`.

## 3. Step-by-Step Execution Plan

### Step 1: Navigation and Routing Setup
1. **Configure `expo-router`** in `apps/mobile`.
2. **Create the file-based route structure** to match the web app:
    - `apps/mobile/app/(tabs)/index.tsx` (Library/Home)
    - `apps/mobile/app/feed/[id].tsx` (The Reading Feed)
    - `apps/mobile/app/settings.tsx` (User Preferences)
3. **Implement a Bottom Navigation Bar** using `expo-router` tabs, mirroring `BottomNavigation.svelte`.

### Step 2: Component Translation (NativeWind)
1. **Translate Atomic Components:** Rebuild `ToggleTile`, `TextScaleSlider`, and `ErrorMessage` using React Native primitives and NativeWind.
2. **Translate Layout Components:** Rebuild `LibraryHeader` and `DocumentGridItem`.
3. **Translate the "Feed" Experience:**
    - Rebuild the `Feed` and `FeedSlide` components.
    - Use `FlashList` (from Shopify) or a vertical `PagerView` to ensure the TikTok-style scrolling is fluid and high-performance.

### Step 3: Implement Native TTS Engine
1. **Create a `useTTS` hook** in `apps/mobile` that wraps `expo-speech`.
2. **Implement word-level synchronization:**
    - Capture `onBoundary` events from `expo-speech`.
    - Update the local "active word" state to trigger highlights in the `FeedSlide` component.
3. **Handle background playback:** Configure `expo-av` audio session categories to allow TTS to continue playing when the screen is locked or the app is backgrounded (if desired).

### Step 4: Native PDF and File Handling
1. **Implement `PdfUploader`:** Use `expo-document-picker` to select files and `expo-file-system` to move them to the app's internal storage.
2. **Integrate `react-native-pdf`:** Use it for full-document previews or when the user wants to see the original source page.
3. **Ensure Core Integration:** Pass the local file URI to the `@paperflip/core` segmenter for text extraction.

### Step 5: Native Background Media Engine
1. **Port Video Logic:** Use `expo-av`'s `Video` component to render the background loops.
2. **Implement Randomized Selection:** Replicate the "Double Tap" logic to cycle through background styles by updating a state that controls the `Video` source.

### Step 6: RxDB Mobile Integration
1. **Initialize the Database:** Update the mobile entry point to call `@paperflip/core`'s database initialization with the `expo-sqlite` storage adapter.
2. **Link Reactive State:** Use `rxdb-hooks` or similar patterns to ensure the UI updates automatically when documents are added or progress is saved.

## 4. Anticipated Challenges
- **TTS Consistency:** The `onBoundary` event for TTS can be inconsistent across different Android manufacturers and OS versions. A fallback (e.g., character-based timing estimation) may be needed.
- **Memory Management:** High-definition video loops combined with large PDF parsing can be memory-intensive on older mobile devices. We will need to optimize video compression and use `FlashList` for efficient list rendering.
- **Native PDF Dependencies:** `react-native-pdf` relies on native binaries; ensuring it builds correctly for both iOS (Pods) and Android (Gradle) in a monorepo environment often requires specific `metro.config.js` and `app.json` configurations.
- **Gesture Conflict:** Ensuring the "Swipe to next segment" gesture doesn't conflict with system-level back gestures or other UI interactions.
