# Settings Implementation Status

This document tracks the current status and implementation requirements for all user-facing settings in PaperFlip.

## Global Infrastructure

### 1. Persistence (CRITICAL)

- **Status**: Implemented.
- **Resolution**: Fixed race condition in `src/lib/stores/sync.ts` using `hasHydrated` flag. Stores are now correctly synchronized with RxDB and persist across page refreshes.

---

## App Settings (`src/lib/stores/settings.ts`)

### 2. Dark Mode

- **Status**: Implemented.
- **Resolution**: Logic moved to `src/routes/+layout.svelte` with global persistence via RxDB.

### 3. Text Scale

- **Status**: Implemented.
- **Resolution**: `$textScale` (default 110) is passed into `FeedSlide.svelte` and used to set `font-size: {$textScale / 100}rem` on the text container. Persistence via RxDB.

### 4. Background (backgroundUrl)

- **Status**: Implemented.
- **Resolution**: `Feed.svelte` checks `$backgroundUrl` and use it if it's set. Double-tap on `Feed.svelte` cycles backgrounds by updating `$backgroundUrl`. Video sources now include preview images for the settings UI.

### 5. Auto-Resume

- **Status**: Implemented.
- **Usage**: When `$autoResume` is true, the app automatically loads the user's last viewed document on app startup (handled in `src/routes/+page.svelte`). Additionally, in `src/routes/feed/+page.svelte`, the feed resumes from the last progress.
- **Persistence**: Required.

### 6. Video Length

- **Status**: UI only.
- **Issue**: `VideoLengthDial.svelte` updates `$videoLength` (default 15), but it has no effect on logic. It is intended to control the document segment size, but currently `src/lib/segmenter.ts` uses a hardcoded `MAX_SEGMENT_LENGTH = 1000`.
- **Requirement**:
  - Update `src/lib/segmenter.ts` to determine the maximum segment length dynamically based on the `$videoLength` setting. This involves mapping the user-selected time value (e.g., seconds/minutes) to an appropriate character limit based on average reading speed.
  - Update UI labels in `VideoLengthDial.svelte` as necessary to clarify the units or expected segment duration.
  - Persistence required.

---

## Reading Settings (`src/lib/stores/audio.ts`)

### 7. Playback Speed (playbackRate)

- **Status**: Implemented.
- **Usage**: Correctly used in `src/lib/audio.ts` to set the speech synthesis rate. It handles real-time updates by restarting the utterance at the correct position.
- **Persistence**: Required.

### 8. Auto Scroll

- **Status**: Implemented.
- **Usage**: Correctly used in `Feed.svelte` to trigger `slideNext()` on completion.
- **Persistence**: Required.

### 9. Mute

- **Status**: Implemented.
- **Usage**: Correctly used in `Feed.svelte` and `FeedSlide.svelte` for video and audio.
- **Persistence**: Required.

### 10. Dictation Mode

- **Status**: Partially Implemented.
- **Usage**: Logic exists in `Feed.svelte` to handle dictation mode and auto-switch if boundary events fail.
- **Issue**: Not yet explicitly toggleable in `ReadingOptionsSheet.svelte` (UI missing).
- **Persistence**: Required.

### 11. Voice Selection

- **Status**: Not implemented.
- **Issue**: Architecture spec mentions voice selection to mitigate robotic voices, but it's not in the UI or stores.
- **Requirement**:
  - Add `preferredVoice` store (storing voice name or URI).
  - Add voice selection menu in `ReadingOptionsSheet.svelte` or `Settings` page.
  - Update `src/lib/audio.ts` to use selected voice.
  - Persistence required.

### 12. Voice Pitch

- **Status**: Not implemented.
- **Issue**: Mentioned in architecture spec but missing in implementation.
- **Requirement**:
  - Add `voicePitch` store.
  - Add slider/control in UI.
  - Update `src/lib/audio.ts` to apply pitch to `SpeechSynthesisUtterance`.
  - Persistence required.
