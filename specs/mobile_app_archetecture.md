# Mobile Application Architecture (Expo)

This document describes the architecture of the PaperFlip mobile application, built with Expo and React Native, following its migration to a monorepo structure.

## 1. Overview

The mobile application (`apps/mobile`) is a high-performance, native version of the PaperFlip experience. It shares core business logic with the web application through the `@paperflip/core` package while leveraging native device capabilities for video playback, speech synthesis, and storage.

## 2. Tech Stack

- **Framework:** Expo (Managed Workflow)
- **Routing:** Expo Router (File-based routing in `app/`)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Database:** `AsyncStorage` (implementing the `@paperflip/core` `StorageEngine`)
- **UI Components:** React Native primitives + custom components
- **PDF Handling:** `expo-pdf-text-extract` for text parsing and `react-native-pdf-thumbnail` for cover generation.
- **Audio/TTS:** `expo-speech` for native text-to-speech.
- **Video:** `expo-video` for background loop playback.

## 3. Directory Structure

```
apps/mobile/
├── app/                # Expo Router pages (_layout, index, feed, settings)
├── src/
│   └── components/     # React components (mirrors web components where possible)
├── assets/             # Static assets (icons, splash screen)
└── __tests__/          # Jest tests
```

## 4. Shared Core Integration

The mobile app consumes `@paperflip/core` for:

- **Text Segmentation:** Breaking PDFs into video-sized chunks.
- **Data Modeling:** Using shared TypeScript types for Documents and Settings.
- **Storage Logic:** The app initializes the `@paperflip/core` storage by providing an `AsyncStorage`-backed implementation of the `StorageEngine`.

## 5. UI/UX Strategy

To maintain parity with the web version, the mobile app:

- Uses the same Tailwind design tokens via a shared `tailwind-config` package.
- Re-implements the "Shorts" feed using a high-performance vertical scrolling pattern.
- Implements "Karaoke" style word highlighting by synchronizing `expo-speech` boundary events with the UI state.

## 6. Native Features

Unlike the web app, the mobile version leverages:

- **Background Audio:** Native speech synthesis continues when the screen is off (within OS limits).
- **Safe Areas:** Proper handling of notches and home indicators using `react-native-safe-area-context`.
- **Haptics:** (Planned) Physical feedback during UI interactions and document processing.
