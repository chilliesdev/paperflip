# Test Performance Investigation Report

## Findings

The test suite currently takes significantly longer than expected (~104s in parallel, ~202s sequentially). The primary bottlenecks identified are:

### 1. High Import and Transformation Overhead

- **Sequential Import Time:** ~155s (77% of total time).
- **Aggregate Import Time (Parallel):** ~413s.
- **Analysis:** Vitest is spending a disproportionate amount of time resolving and transforming modules. This is likely due to:
  - **Heavy Dependencies:** `rxdb` and `pdfjs-dist` are large libraries. Even though they are mocked, the mocking process and the resolution of their types/entry points still incur overhead.
  - **Repeated Transformations:** Every test file (13 files) triggers its own module graph resolution.

### 2. Global `jsdom` Environment Overhead

- **Environment Setup Time:** ~30s total (~5s per file on average).
- **Analysis:** All tests currently run in the `jsdom` environment, as configured in `vite.config.ts`.
  - Pure logic tests (e.g., `segmenter.test.ts`, `audio.test.ts`, `database.test.ts`) do not require a DOM environment but are forced to pay the `jsdom` initialization tax.
  - When attempting to run `segmenter.test.ts` in the `node` environment, it failed because the global `setup.ts` assumes a browser environment (referencing `HTMLMediaElement` and `File`).

### 3. Setup File Blocking

- **Analysis:** The `src/tests/setup.ts` file performs global mocks on browser-only prototypes. This makes it impossible to switch individual tests to the `node` environment without refactoring the setup logic.

### 4. Mocking Complexity

- **Analysis:** Files like `database.test.ts` use extensive `vi.hoisted` and `vi.mock` calls. While necessary for isolation, heavy use of these in many files can slow down the Vitest runner as it manages the mocked module state.

---

## Suggestions

### 1. Optimize Environments (High Impact)

- **Per-file Environment:** Move away from a global `jsdom` environment. Use `@vitest-environment node` comments in files that don't need a DOM.
- **Refactor `setup.ts`:** Guard browser-specific mocks in `setup.ts` (e.g., `if (typeof window !== 'undefined')`) to allow tests to run in the `node` environment.
- **Switch Logic Tests:** `segmenter.test.ts`, `audio.test.ts`, `database.test.ts`, and store tests should all run in `node`.

### 2. Improve Vitest Configuration

- **Cache Optimization:** Ensure Vitest cache is working correctly. Consider using `deps.optimizer` in `vite.config.ts` to pre-bundle heavy dependencies for tests.
- **Disable Isolation where safe:** If tests are truly isolated by their mocks, using `--no-isolate` could significantly speed up execution by reusing the same worker context, though this requires careful verification of side effects.

### 3. Streamline Mocks

- **Centralize Mocks:** Move common mocks (like RxDB or PDF.js) to a `__mocks__` directory or a shared utility to reduce the boilerplate and transformation overhead in each test file.
- **Lightweight Mocking:** Ensure mocks are as lightweight as possible.

### 4. Dependency Management

- **Externalize Large Libraries:** In `vite.config.ts`, ensure that large libraries that are fully mocked are being handled efficiently by Vitest's internal resolution.

---

## Recommendation for Next Steps

1.  **Modify `src/tests/setup.ts`** to be environment-aware.
2.  **Add `// @vitest-environment node`** to all non-component test files.
3.  **Benchmark** the improvement (expected reduction of ~30-50s).
