# Mobile Parity Plan: Web to Mobile Alignment

This document outlines the strategic plan to bring the mobile application (`apps/mobile`) to feature and visual parity with the web application (`apps/web`).

## Status Update (Current Progress)

The mobile application has achieved major architectural milestones and is currently in the **UI Polish & Feature Refinement** phase.

### Phase 1: Scaffolding & Navigation (COMPLETED ✅)

- [x] **Initialize Expo Router:** File-based routing implemented in `apps/mobile/app/`.
- [x] **Global Layout:** `_layout.tsx` handles `BottomNavigation` and safe area management.
- [x] **Theme Sync:** NativeWind is successfully consuming the shared `tailwind-config`.

### Phase 2: The Library (COMPLETED ✅)

- [x] **Port Library Components:** `DocumentGridItem`, `DocumentListItem`, and `LibraryHeader` ported to React Native.
- [x] **Data Binding:** Mobile UI bound to `StorageEngine` (`AsyncStorage`) via `@paperflip/core`.
- [x] **Search & Filter:** Library filtering logic implemented in `LibraryHeader`.

### Phase 3: The Feed (IN PROGRESS ⏳)

- [x] **Feed Architecture:** `Feed.tsx` and `FeedSlide.tsx` implemented.
- [x] **Segmentation:** Using `@paperflip/core/segmenter` for identical text chunks.
- [ ] **Karaoke Engine:** Word highlighting sync with `expo-speech` boundary events needs further optimization for performance.

### Phase 4: PDF Upload & Processing (COMPLETED ✅)

- [x] **Document Picker:** `expo-document-picker` implemented.
- [x] **Processing Pipeline:** `PdfUploader.tsx` uses `expo-pdf-text-extract` and `react-native-pdf-thumbnail`.

### Phase 5: Polish & Parity Check (IN PROGRESS ⏳)

- [x] **Implement Settings Screen:** `app/settings.tsx` ported with mobile-native controls (`TextScaleSlider`, `ToggleTile`, etc.).
- [x] **Document Options (OptionsSheet):** `OptionsSheet.tsx` implemented as a mobile bottom sheet.
- [x] **Reading Controls (ReadingOptionsSheet):** `ReadingOptionsSheet.tsx` implemented for the `Feed` screen.
- [ ] **UI Refinement:** Address layout overlaps and optimize `FlashList` performance for large libraries.
- [ ] **Visual Parity:** Ensure identical typography and spacing between Svelte and React Native versions.

## Remaining Challenges

1.  **High-Frequency Highlighting:** Ensuring the "Karaoke" sync is buttery smooth on lower-end Android devices using `expo-speech`.
2.  **Asset Management:** Standardizing the background video selection logic across both platforms to ensure they pull from the same "pool" of content.
3.  **Cross-Platform Sync:** (Optional Future Phase) Syncing user documents and progress across Web and Mobile via a lightweight backend or peer-to-peer sync.
