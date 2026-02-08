# Test Specifications for Missing Unit Tests

This document outlines the test specifications for components and files that currently lack unit test coverage. These specifications are intended to guide the implementation of tests using Vitest and Svelte Testing Library.

## 1. `src/lib/components/FeedSlide.svelte`

### **Overview**

A component that displays a text segment over a background video, synchronizing word highlighting with a `currentCharIndex` and handling video playback state.

### **Props**

- `segment`: string (The text content)
- `index`: number (Slide index)
- `total`: number (Total slides)
- `isActive`: boolean (Is this slide currently visible)
- `isPlaying`: boolean (Is the global playback active)
- `currentCharIndex`: number (The current character index for highlighting)
- `videoSource`: string (URL for the video)

### **Test Scenarios**

#### **Rendering**

- **S1: Initial Render**:
  - Verify the video element is present.
  - Verify the page indicator text shows correct `index + 1` and `total`.
  - Verify the text `segment` is split and rendered as individual words.
- **S2: Swipe Hint**:
  - Verify "Swipe up" hint is visible only when `index === 0` and `isActive` is false.

#### **Logic & Interactions**

- **S3: Word Segmentation**:
  - Provide a known string (e.g., "Hello world"). Verify it renders two word elements.
- **S4: Word Highlighting**:
  - Set `currentCharIndex` to a value within the range of the first word. Verify the first word has the "active" class/styles (e.g., `text-[#00ff88]`).
  - Set `currentCharIndex` to a value in the second word. Verify first word is "past" and second is "active".
  - Set `currentCharIndex` to -1. Verify no words are active.
- **S5: Progress Bar**:
  - Verify the progress bar width calculation based on the active word index relative to total words.

#### **Video Playback**

- **S6: Play/Pause Behavior**:
  - Mock `HTMLVideoElement.prototype.play` and `pause`.
  - When `isActive={true}` and `isPlaying={true}`, verify `play()` is called.
  - When `isActive={false}`, verify `pause()` is called.
  - When `isPlaying={false}`, verify `pause()` is called.
- **S7: Video Source**:
  - Mock `$videoAssetUrls` store.
  - Verify the video `src` uses the cached URL from the store if available, otherwise falls back to the prop `videoSource`.

### **Edge Cases**

- Empty `segment` string.
- `currentCharIndex` out of bounds (negative or larger than text length).
- `videoSource` not in store (fallback check).

---

## 2. `src/lib/stores/assets.ts`

### **Overview**

A simple Svelte writable store holding a mapping of video source URLs to their cached/blob URLs.

### **Test Scenarios**

- **S1: Initialization**:
  - Verify the store initializes with an empty object `{}`.
- **S2: Updates**:
  - Subscribe to the store.
  - Update the store with a new key-value pair.
  - Verify the subscriber receives the updated object.

---

## 3. `src/routes/+page.svelte` (Root Page)

### **Overview**

The entry point application page that handles PDF uploading, parsing, and navigation to the feed.

### **Test Scenarios**

- **S1: Initial State**:
  - Verify `PdfUploader` component is rendered.
  - Verify loading overlay is NOT present.
- **S2: PDF Parsing Flow (Success)**:
  - Mock `PdfUploader` events or internal functions.
  - Trigger `handlePdfParsed` with mock text and filename.
  - **Expectations**:
    - Loading state appears ("Processing PDF...").
    - `segmentText` is called with the text.
    - `upsertDocument` (RxDB) is called with correct arguments.
    - `goto` is called with the correct URL (`/feed?id=...`).
- **S3: PDF Parsing Flow (Error)**:
  - Mock `upsertDocument` to throw an error.
  - Trigger `handlePdfParsed`.
  - Verify `alert` is called (mock `window.alert`) and loading state resolves.
- **S4: Load Document**:
  - Trigger `handleLoadDocument`.
  - Verify `goto` is called with the correct ID.

### **Mocks Required**

- `$lib/database`: `getDb`, `upsertDocument`.
- `$lib/segmenter`: `segmentText`.
- `$app/navigation`: `goto`.
- `$lib/components/PdfUploader.svelte` (stub/mock).

---

## 4. `src/routes/+layout.svelte`

### **Overview**

Global layout handling resource initialization (voice waiting, video pre-fetching) and global loading UI.

### **Test Scenarios**

- **S1: Initialization (First Load)**:
  - Mock `videoAssetUrls` as empty.
  - Mock `fetch` for video sources.
  - Mount component.
  - **Expectations**:
    - `LoadingScreen` is rendered initially.
    - `waitForVoices` is called.
    - `fetch` is called for video sources.
    - `videoAssetUrls` store is updated with blob URLs.
    - `LoadingScreen` disappears and `slot` content renders.
- **S2: Initialization (Already Cached)**:
  - Mock `videoAssetUrls` having keys.
  - Mount component.
  - **Expectations**:
    - `waitForVoices` and `fetch` are NOT skipped/called (logic check: the code currently checks store length).
    - Content renders immediately.
- **S3: Fetch Failure**:
  - Mock `fetch` to reject.
  - Verify code handles error gracefully (fallbacks to original URL in store, loading finishes).

### **Mocks Required**

- `$lib/stores/loading`: `isLoading`, `loadingStatus`.
- `$lib/audio`: `waitForVoices`.
- `$lib/stores/assets`: `videoAssetUrls`.
- `$lib/constants`: `videoSources`.
