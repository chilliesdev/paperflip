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

- **Status**: Implemented.
- **Resolution**:
  - `src/lib/segmenter.ts` now accepts a dynamic `maxChars` limit.
  - `src/routes/+page.svelte` calculates `maxChars` using `$videoLength` (in seconds) \* `CHARS_PER_SECOND` (16.6).
  - UI in `VideoLengthDial.svelte` updated to display units in seconds (`s`) with options `[15, 30, 60, 90]`.
  - Persistence handled via existing settings store sync.

---

## Reading Settings (`src/lib/stores/audio.ts`)
