# Phase 3: Extract Shared Core (Business Logic) - Strategic Plan

This document outlines the execution strategy for Phase 3 of the Paperflip architecture transition: isolating framework-agnostic business logic into a shared `@paperflip/core` package.

## 1. Understanding the Goal
The objective is to isolate the "brain" of the application into a framework-agnostic TypeScript package. By extracting RxDB database schemas, text segmentation algorithms, and shared constants, we ensure that identical data rules and processing logic are applied across both SvelteKit (Web) and Expo (Mobile).

## 2. Investigation & Analysis
- **Logic Candidates for Extraction:**
    - `src/lib/database.ts`: RxDB initialization, collection schemas, and migration logic.
    - `src/lib/segmenter.ts`: Logic for breaking PDFs/text into readable segments.
    - `src/lib/constants.ts`: Application-wide settings and default values.
    - `src/lib/audio.ts`: (Partial) Shared playback state and timing logic.
- **Dependency Audit:**
    - **RxDB:** Must be a dependency of `@paperflip/core`. Storage adapters (e.g., IndexedDB vs. SQLite) must be injectable or platform-specific.
    - **PDF.js:** Used in `segmenter.ts`. The core should handle text processing, while platform-specific "uploaders" handle the initial PDF parsing.
- **Svelte Store Coupling:** Logic currently residing in `src/lib/stores/` must be decoupled from Svelte's `$state` or `writable` runes and moved to the core as pure functions.

## 3. Step-by-Step Execution Plan

### Step 1: Scaffold the Core Package
1. **Create `packages/core/package.json`** with `"name": "@paperflip/core"`.
2. **Configure a build pipeline** using `tsup` to generate ESM, CommonJS, and TypeScript declarations (`.d.ts`).
3. **Define exports** in `package.json` for specific modules (e.g., `./database`, `./segmenter`, `./types`).

### Step 2: Migrate Types and Constants
1. **Create `packages/core/src/types.ts` and `packages/core/src/constants.ts`**.
2. **Move shared interfaces** (Document, Segment, UserSettings) and constant values here.
3. **Update `apps/web`** to import these from `@paperflip/core` to verify the link.

### Step 3: Extract the Segmenter (Pure Logic)
1. **Move `src/lib/segmenter.ts`** to `packages/core/src/segmenter.ts`.
2. **Refactor for portability:** Remove any direct reliance on DOM APIs (e.g., `window`, `document`).
3. **Write unit tests** in `packages/core` to verify the segmenter works in a pure Node environment.

### Step 4: Extract the Database (RxDB)
1. **Move `src/lib/database.ts`** to `packages/core/src/database/`.
2. **Decouple storage:** Refactor database initialization to accept an `RxStorage` adapter as an argument.
3. **Export schemas** and "collection creators" for reuse across platforms.

### Step 5: Refactor Web App Stores
1. **Identify complex logic** in `apps/web/src/lib/stores/*.ts` (e.g., progress calculation, document sorting).
2. **Move this logic** into pure functions within `@paperflip/core`.
3. **Update Svelte stores** to act as thin reactive wrappers around these core functions.

### Step 6: Build and Link
1. **Run `turbo run build --filter=@paperflip/core`**.
2. **Add `"@paperflip/core": "workspace:*"`** to `apps/web/package.json`.
3. **Update all imports** in `apps/web` to point to `@paperflip/core`.

## 4. Anticipated Challenges
- **RxDB Plugin Management:** Ensuring plugins (QueryBuilder, Migration) are registered correctly without causing "Missing Plugin" errors or environment-specific bloat.
- **Environment Globals:** Replacing assumptions of `localStorage` or `navigator` with environment-agnostic abstractions.
- **Bundle Size:** Managing the size of `@paperflip/core` to ensure fast mobile startup, potentially using multiple entry points.
- **Testing Transitions:** Moving existing tests to the core package and ensuring they pass outside of the SvelteKit environment.
