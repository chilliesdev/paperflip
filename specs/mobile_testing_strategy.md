# Mobile App Testing Strategy

## 1. Understanding the Goal

Establish a robust Vitest-based testing suite for the mobile application (`apps/mobile`). This includes unit testing for components, hooks, and shared logic from `@paperflip/core`, while leveraging the same testing engine used in the web app.

## 2. Investigation & Analysis

- **Vitest in React Native:** Vitest is increasingly viable for React Native. We will use it alongside `@testing-library/react-native` (RNTL).
- **Environment:** Since Vitest runs in a Node-based environment, we will need to mock `react-native` and Expo globals. Unlike Jest, we must ensure `vi.mock` is used instead of `jest.mock`.
- **RxDB & Storage:** The mobile app uses `expo-sqlite` for RxDB. For Vitest, we'll swap this with an in-memory adapter (like `memory` or `indexeddb` via a polyfill) to avoid native dependency issues during tests.

## 3. Step-by-Step Execution Plan

### Phase 1: Vitest Infrastructure & Configuration

1.  **Install Dependencies:**
    - `vitest`, `@testing-library/react-native`, `react-test-renderer`.
2.  **Configure Vitest:**
    - Create `apps/mobile/vitest.config.ts` extending the workspace's Vite/Vitest patterns.
    - Setup `alias` for `@paperflip/core` to ensure direct source testing.
3.  **Global Setup (`vitest.setup.ts`):**
    - Initialize RNTL cleanup.
    - Create comprehensive mocks for Expo APIs (`expo-sqlite`, `expo-av`, `expo-crypto`).
    - Mock NativeWind's `styled` or `useColorScheme` if they interfere with rendering.

### Phase 2: Unit & Component Testing

1.  **UI Components:** Test mobile-specific components for correct rendering and user interaction (presses, swipes).
2.  **State & Hooks:** Test custom hooks using `@testing-library/react-native`'s `renderHook`.
3.  **App Logic:** Verify `App.tsx` initializes the database and handles the loading state correctly.

### Phase 3: Integration & Database

1.  **RxDB Lifecycle:** Verify that document storage and retrieval work within the mobile context using an in-memory mock of the SQLite layer.
2.  **Core Integration:** Ensure that `packages/core` segmenter logic is correctly invoked when a document is "uploaded" in the mobile app.

### Phase 4: Automation & CI

1.  **Script Update:** Add `"test": "vitest run"` and `"test:watch": "vitest"` to `apps/mobile/package.json`.
2.  **Turbo Integration:** Verify that `turbo test` correctly executes mobile tests alongside web and core tests.

## 4. Anticipated Challenges

1.  **Global Polyfills:** React Native relies on many globals (like `Buffer`, `crypto`, `URL`) that might be missing in a Vitest Node environment. We'll likely need `vite-plugin-node-polyfills`.
2.  **Vitest vs. Native Modules:** Many Expo libraries are ESM-only or contain native code that Vitest cannot execute. Aggressive mocking in `vitest.setup.ts` will be critical.
3.  **NativeWind v4:** Testing components that use NativeWind requires ensuring the styles don't crash the RNTL renderer (usually handled by mocking the `NativeWind` runtime).
