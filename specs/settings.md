# Settings Implementation Status

This document tracks the current status and implementation requirements for all user-facing settings in PaperFlip.

## Global Infrastructure

### 1. Persistence (CRITICAL)

- **Status**: Not implemented.
- **Issue**: All settings in `src/lib/stores/settings.ts` and `src/lib/stores/audio.ts` reset on page refresh.
- **Requirement**: Use `localStorage` or `IndexedDB` (RxDB) to persist store values. Update stores in `onMount` or use a synchronized store wrapper.

---

## App Settings (`src/lib/stores/settings.ts`)

### 2. Dark Mode

- **Status**: Partially implemented (Settings page only).
- **Issue**: Side-effect in `src/routes/settings/+page.svelte` only applies the `dark` class while on that page. It does not persist or apply globally.
- **Requirement**:
  - Move application logic to `src/routes/+layout.svelte`.
  - Add `darkMode` store listener in the layout to toggle `.dark` class on `document.documentElement`.
  - Persistence required.

### 3. Text Scale

- **Status**: UI only.
- **Issue**: Slider updates `$textScale` (default 110), but nothing uses it in the viewer.
- **Requirement**:
  - Pass `$textScale` into `FeedSlide.svelte`.
  - Use it to set `font-size` on the text container (e.g., `font-size: {$textScale / 100}rem`).
  - Persistence required.

### 4. Background (backgroundUrl)

- **Status**: UI only.
- **Issue**: User can select backgrounds in `BackgroundSelector.svelte`, but `Feed.svelte` continues to use hardcoded `videoSources` from `constants.ts`.
- **Requirement**:
  - `Feed.svelte` should check `$backgroundUrl` and use it if it's set.
  - Implement double-tap on `Feed.svelte` to cycle backgrounds (as mentioned in Architecture spec).
  - Persistence required.

### 5. Auto-Resume

- **Status**: UI only.
- **Issue**: Feed always resumes from last progress if available, regardless of `$autoResume` value.
- **Requirement**:
  - In `src/routes/feed/+page.svelte`, check `$autoResume`.
  - If `false`, start `initialIndex` and `initialProgress` at 0 regardless of database values.
  - Persistence required.

### 6. Video Length

- **Status**: UI only.
- **Issue**: `VideoLengthDial.svelte` updates `$videoLength` (default 15), but it has no effect on logic. UI displays "m" (minutes) but architecture implies seconds ("s") for "Shorts".
- **Requirement**:
  - Clarify units (seconds preferred for shorts). Update UI labels if necessary.
  - If meant to limit slide duration: Use `$videoLength` in `Feed.svelte` to trigger `swiper.slideNext()` after X seconds if `autoScroll` is enabled.
  - If meant to control segment size: Use during PDF segmentation in `src/lib/segmenter.ts`.
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
