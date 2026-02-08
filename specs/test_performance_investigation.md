# Test Performance Investigation Report

**Date:** February 8, 2026
**Project:** Paperflip

## Executive Summary

The test suite is currently experiencing significant performance issues, with a total execution time of **~92 seconds** for 105 tests. The actual test execution time is only **2.89s**, while the **Import** phase takes **~360s** (parallelized time) and **Transform** phase takes **~105s**.

This indicates that the slowness is not due to the tests themselves (which are fast), but rather the overhead of resolving, transforming, and loading dependencies for each test file.

## Findings

### 1. Excessive Import Overhead

The primary bottleneck is the "Import" phase. Vitest isolates test files, and if heavy dependencies are imported (even if mocked later in the test file), the build tool (Vite) often still resolves and transforms them.

- **Swiper:** The project has been upgraded to `swiper` (v12.1.0) using Swiper Element (Web Components). The previous resolution warnings and performance issues related to `swiper/svelte` have been resolved by moving to the modern Web Component approach and removing the legacy Svelte components.

- **RxDB:** `rxdb` and `pouchdb-adapter-idb` are large libraries. While `pdfjs-dist` is globally aliased to a mock in `vite.config.ts`, `rxdb` is only mocked locally in test files (e.g., `vi.mock('rxdb', ...)`). This allows Vite to spend time processing the original `rxdb` package before the mock takes effect.

### 2. Lack of Global Mocks

Currently, `pdfjs-dist` is the only library optimized via global aliasing in `vite.config.ts`.

```typescript
alias: mode === "test" ? {
    "pdfjs-dist": path.resolve(process.cwd(), "src/tests/mocks/pdfjs-dist.ts"),
} : undefined,
```

Other heavy libraries (`swiper`, `rxdb`) are mocked _per test file_ using `vi.mock()`. This is less efficient for performance because the heavy modules are still part of the dependency graph that Vite analyzes.

### 3. Database Initialization Strategy

The `database.test.ts` file correctly mocks `rxdb`, but `src/lib/database.ts` uses dynamic imports (`await import('pouchdb-adapter-idb')`). While this is good for app bundle size, in a testing environment without global mocks, it might contribute to complexity if those paths are analyzed.

## Recommendations

To drastically reduce test execution time (potentially from ~90s to <10s), implementing global aliases is recommended. This prevents Vite from ever looking at the heavy `node_modules` folders during tests.

### 1. Create Global Mocks

Create dedicated mock files in `src/tests/mocks/` for the heavy dependencies.

**`src/tests/mocks/rxdb.ts`** (Example):

```typescript
export const createRxDatabase = () => Promise.resolve({ ... });
export const addRxPlugin = () => {};
```

### 2. Update `vite.config.ts`

Expand the `alias` configuration in `vite.config.ts` to redirect these imports to the mocks when running in test mode.

```typescript
alias: mode === "test" ? {
    "pdfjs-dist": path.resolve(process.cwd(), "src/tests/mocks/pdfjs-dist.ts"),
    "rxdb": path.resolve(process.cwd(), "src/tests/mocks/rxdb.ts"),
    "rxdb/plugins/pouchdb": path.resolve(process.cwd(), "src/tests/mocks/rxdb.ts"),
    // Add other heavy libs if necessary
} : undefined,
```

### 3. Optimizing `Feed.svelte` Imports

The upgrade to Swiper 12 using Web Components has resolved the previous resolution warnings and performance hits. The tests now use a lightweight manual mock for the `swiperinit` and `swiperslidechange` events, bypassing the heavy library code.

## Conclusion

The test suite is slow because the environment is processing the full code of heavy libraries (`swiper`, `rxdb`) for every test file. By forcing Vitest to resolve these to lightweight mocks via `vite.config.ts`, you can bypass the transformation cost entirely.
