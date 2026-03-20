# Mobile Parity Plan: Web to Mobile Alignment

This document outlines the strategic plan to bring the mobile application (`apps/mobile`) to feature and visual parity with the web application (`apps/web`).

## 1. Understanding the Goal

The objective is to achieve **feature and visual parity** between the mobile app and the web app. This involves:

- **UI/UX Alignment:** Recreating the Library, Feed (Reader), and Navigation components using React Native and NativeWind.
- **Feature Parity:** Implementing PDF uploading, document management, and the "Karaoke" reading experience on mobile.
- **Architectural Sync:** Ensuring the mobile app leverages the same RxDB collections and business logic provided by `@paperflip/core`.

## 2. Investigation & Analysis

- **Navigation:** Web uses SvelteKit file-based routing; Mobile currently has a single `App.tsx`. We need to implement **Expo Router** to match the `/library`, `/feed`, and `/settings` structure.
- **Styling:** Web uses Tailwind CSS; Mobile uses NativeWind. Since the project uses a shared `tailwind-config`, we can reuse design tokens (colors, spacing), but layout patterns must shift from CSS Grid/Block to Flexbox.
- **State Management:** Both use RxDB. The logic for fetching and updating documents is already partially abstracted in `@paperflip/core`.
- **Heavy Lifting:**
  - **PDF Rendering:** Web uses `pdfjs-dist`. Mobile will likely need `react-native-pdf` or a similar native bridge.
  - **Audio/TTS:** The web "Karaoke" feature likely uses the Web Speech API or a specific audio store. Mobile will require `expo-speech` or `expo-av`.

## 3. Step-by-Step Execution Plan

### Phase 1: Scaffolding & Navigation

1. **Initialize Expo Router:** Set up file-based routing in `apps/mobile/app/` to mirror `apps/web/src/routes/`.
2. **Global Layout:** Create a `_layout.tsx` that implements the `BottomNavigation` (porting logic from `BottomNavigation.svelte`).
3. **Theme Sync:** Ensure NativeWind is correctly consuming the shared `tailwind-config` to match the web app's "Paper" aesthetic.

### Phase 2: The Library (Document Management)

1. **Port Library Components:** Create React Native versions of `DocumentGridItem`, `DocumentListItem`, and `LibraryHeader`.
2. **Data Binding:** Use `rxdb-hooks` (or similar) to bind the mobile UI to the RxDB `documents` collection via `@paperflip/core`.
3. **Search & Filter:** Implement the filtering logic found in the web's `LibraryHeader`.

### Phase 3: The Feed (Reading Experience)

1. **Feed Architecture:** Port `Feed.svelte` and `FeedSlide.svelte` to React. Use a `FlatList` or `PagerView` for the vertical/horizontal swiping.
2. **Segmentation:** Leverage `@paperflip/core/segmenter` to ensure text is broken down identically on both platforms.
3. **Karaoke Engine:** Implement the highlighting logic (Karaoke effect). This will be the most complex UI port due to how React Native handles text layout vs. the DOM.

### Phase 4: PDF Upload & Processing

1. **Document Picker:** Implement `expo-document-picker` to select PDFs.
2. **Processing Pipeline:** Mirror the web's `PdfUploader` logic. Since PDF parsing is heavy, determine if parsing should happen on the JS thread using `pdfjs-dist` (if compatible) or via a native library.

### Phase 5: Polish & Parity Check

1. **Settings:** Port `settings/+page.svelte` to `app/settings/index.tsx`.
2. **Shared Stores:** Evaluate if some web stores (`audio.ts`, `settings.ts`) can be moved to `@paperflip/core` to minimize duplicate logic.

## 4. Anticipated Challenges

- **PDF Parsing on Mobile:** `pdfjs-dist` is heavily web-dependent (Canvas/DOM). We may need to find a mobile-compatible alternative for extracting text and generating thumbnails.
- **Performance:** The "Karaoke" sync requires high-frequency state updates. React Native's bridge might introduce lag compared to Svelte's fine-grained reactivity; `reanimated` might be needed for smooth highlighting.
- **Layout Constraints:** Tailwind's `grid` classes used in the web app do not exist in React Native. All grid layouts (`DocumentGridItem`) must be recalculated using Flexbox or `FlashList` with `numColumns`.
- **Audio APIs:** Bridging the gap between Web Speech API and `expo-speech` behavior (e.g., word boundaries, voice selection) to ensure the timing matches.
