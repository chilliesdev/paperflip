# Mobile App Testing Strategy

## 1. Overview

The mobile application (`apps/mobile`) utilizes **Jest** as its primary testing framework, integrated with **React Native Testing Library (RNTL)** for component and hook testing. This setup allows for reliable unit and integration tests within the Expo environment.

## 2. Current Setup

- **Framework:** Jest
- **Preset:** `jest-expo` (provides essential mocks and configurations for the Expo ecosystem)
- **Component Testing:** `@testing-library/react-native`
- **Mocking:** `jest.setup.cjs` contains global mocks for native modules like `expo-sqlite`, `expo-speech`, and `expo-video`.

## 3. Testing Layers

### 3.1 Unit Testing (Components)

We test individual React Native components for:

- **Correct Rendering:** Ensuring UI elements (buttons, text, images) appear as expected.
- **Interaction:** Simulating user taps and swipes using RNTL's `fireEvent`.
- **Dynamic Styling:** Verifying that NativeWind styles are correctly applied based on component props.

### 3.2 Hook & Logic Testing

Custom hooks that bridge `@paperflip/core` with the mobile UI are tested to ensure:

- **State Transitions:** Correct updates to loading, document, and settings states.
- **Database Interaction:** Verifying that `getStorage()` is called and data is correctly persisted.

### 3.3 Shared Core Integration

Tests verify that `packages/core` logic (like the segmenter) behaves identically within the mobile test environment as it does in the web test environment.

## 4. Execution

Tests are executed using the following commands:

- `pnpm run test`: Runs the full test suite.
- `pnpm run test:watch`: Runs tests in interactive watch mode.

## 5. Mocking Strategy

Since many Expo libraries require a physical device or simulator, we use aggressive mocking in `jest.setup.cjs` for:

- **`AsyncStorage`**: Mocked (via `jest-expo` or explicitly) to verify that document storage and retrieval work correctly within tests.
- **`expo-sqlite`**: Mocked (as per `jest.setup.cjs`) to ensure compatibility with any future SQLite implementations or dependent libraries.
- **`expo-speech`**: Mocked to simulate boundary events for testing the "Karaoke" sync.
- **`expo-video`**: Mocked to verify that videos are initialized with the correct source and loop settings.

## 6. Future Improvements

1.  **Visual Regression Testing:** Explore `pixelmatch` or similar to ensure visual parity with the web version's typography and layouts.
2.  **E2E Testing:** Integrate Maestro or Detox for high-level user flow verification (e.g., "Upload PDF -> Read in Feed").
