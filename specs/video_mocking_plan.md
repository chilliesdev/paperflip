# Plan: Replace 20MB Test Video with Lightweight Mock

## Problem

Several tests in the codebase reference a 20MB video file hosted on Supabase (`bg-video-1.mp4`). Even when `fetch` is mocked, the presence of these URLs in the default store state and component props can lead to accidental network requests or heavy resource handling during test execution.

## Research Findings

- **Large Asset:** `https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4` (~20MB).
- **Affected Tests:**
  - `src/tests/stores/settings.test.ts`: Verifies default `backgroundUrl`.
  - `src/tests/components/Feed.test.ts`: Renders video elements using the real URLs.
  - `src/tests/components/settings/BackgroundSelector.test.ts`: Uses Supabase URLs in its test data.
- **Root Cause:** `src/lib/constants.ts` defines the production video sources, which are then used to initialize Svelte stores.

## Proposed Solution

We will globally mock the `$lib/constants` module in the Vitest setup to ensure all tests use a lightweight 1MB video file (`https://www.w3schools.com/tags/mov_bbb.mp4`) instead of the production assets.

## Implementation Steps

### 1. Global Mocking in `src/tests/setup.ts`

Add a module mock for `$lib/constants` to provide lightweight video URLs for all tests.

```typescript
vi.mock("$lib/constants", () => ({
  wordCount: 8,
  CHARS_PER_SECOND: 16.6,
  videoSources: [
    {
      url: "https://www.w3schools.com/tags/mov_bbb.mp4",
      previewUrl: "https://example.com/preview1.jpg",
      name: "Test Video 1",
    },
    {
      url: "https://www.w3schools.com/tags/mov_bbb.mp4#t=5",
      previewUrl: "https://example.com/preview2.jpg",
      name: "Test Video 2",
    },
  ],
}));
```

### 2. Update Store Tests

Modify `src/tests/stores/settings.test.ts` to reflect the new mocked default values.

- Replace Supabase URL expectation with `https://www.w3schools.com/tags/mov_bbb.mp4`.

### 3. Update Component Tests

- **`src/tests/components/Feed.test.ts`**: Update expectations in the "renders video and swiper" test case to check for the new lightweight URLs.
- **`src/tests/components/settings/BackgroundSelector.test.ts`**: Update the local `backgrounds` array to use the small video URL for consistency.

### 4. Verification

- Run `npm test` to ensure all tests pass with the new URLs.
- Verify through network logs (if possible) that the Supabase link is no longer being hit during test runs.
