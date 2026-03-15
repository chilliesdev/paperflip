Here is a step-by-step, actionable plan to transition your current Paperflip repository into a Turborepo + pnpm monorepo using SvelteKit Web + Expo Mobile + Shared Core. I have broken this down into five manageable phases so you can migrate incrementally without breaking your existing web app.

### Phase 1: The Monorepo Foundation

**Goal:** Restructure the current repository into a workspace without changing any actual code logic.

1. **Initialize pnpm Workspaces:**
* Create a `pnpm-workspace.yaml` file in the root of your project.
* Define your workspace folders:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'

```




2. **Restructure Folders:**
* Create `apps/` and `packages/` directories at the root.
* Create a new folder `apps/web`.
* Move *all* your current SvelteKit files (e.g., `src/`, `static/`, `vite.config.ts`, `svelte.config.js`, `package.json`, `tailwind.config.js`) into `apps/web/`.


3. **Add Turborepo:**
* Install turbo at the root: `pnpm add turbo --workspace-root -D`
* Create a `turbo.json` file in the root to define your build pipeline (e.g., `build`, `dev`, `lint`).


4. **Verify Web App:**
* Navigate to `apps/web` and run your standard dev command (e.g., `pnpm run dev`) to ensure the SvelteKit app still works exactly as before.



### Phase 2: Extract Shared Configurations

**Goal:** Centralize your tooling so both web and mobile share the same rules and design system.

1. **Create Config Packages:**
* Create `packages/eslint-config`, `packages/ts-config`, and `packages/tailwind-config`.
* Initialize a basic `package.json` in each (e.g., name them `@paperflip/eslint-config`, etc.).


2. **Move Config Files:**
* Move your root `.prettierrc.js`, `eslint.config.js`, and `tsconfig.json` bases into these packages.
* Move the core theme definitions from `apps/web/tailwind.config.js` into `packages/tailwind-config`.


3. **Update Web App:**
* Modify `apps/web/package.json` to depend on these new local packages (e.g., `"@paperflip/tailwind-config": "workspace:*"`).
* Update `apps/web/tailwind.config.js` to import the preset from the shared package.



### Phase 3: Extract the Shared Core (Business Logic)

**Goal:** Isolate your framework-agnostic TypeScript logic so it can be consumed by both React Native and SvelteKit.

1. **Create the Core Package:**
* Create `packages/core` with a `package.json` (named `@paperflip/core`).
* Set up a simple build step (using `tsup` or `tsc`) to output compiled JavaScript and TypeScript declarations (`.d.ts`).


2. **Migrate Pure Logic:**
Move the following files from `apps/web/src/lib/` to `packages/core/src/`:
* `database.ts` (Your RxDB logic)
* `segmenter.ts`
* `constants.ts`
* Any shared TypeScript interfaces (e.g., Document types, User settings).


3. **Refactor Web Imports:**
* In `apps/web/package.json`, add `"@paperflip/core": "workspace:*"`.
* Go through your Svelte components and Svelte stores (`src/lib/stores/`) and update imports. Change `import { db } from '$lib/database'` to `import { db } from '@paperflip/core'`.


4. **Test the Core:**
* Run the web app again. Ensure RxDB still syncs and the segmenter still processes text correctly.



### Phase 4: Initialize the Mobile App (Expo)

**Goal:** Boot up the React Native environment and connect it to your shared tools.

1. **Create Expo App:**
* Inside the `apps/` directory, run: `npx create-expo-app mobile -t expo-template-blank-typescript`
* Modify `apps/mobile/package.json` name to `@paperflip/mobile`.


2. **Setup NativeWind (Tailwind for React Native):**
* Install `nativewind` and `tailwindcss` in `apps/mobile`.
* Configure `apps/mobile/tailwind.config.js` to use the preset from `@paperflip/tailwind-config` you created in Phase 2.


3. **Link the Core:**
* In `apps/mobile/package.json`, add `"@paperflip/core": "workspace:*"`.
* In your Expo `App.tsx`, import your database (`import { getDb } from '@paperflip/core'`) to verify the mobile app can successfully read your shared logic.



### Phase 5: Mobile-Specific Implementation

**Goal:** Rebuild the UI in React Native and handle platform-specific native modules.

1. **Rebuild the UI:**
* Translate your Svelte components (e.g., `DocumentGridItem.svelte`, `LibraryHeader.svelte`) into React components in `apps/mobile`.
* Because you are using NativeWind, you can copy-paste most of the `className="..."` strings directly from your Svelte files.


2. **Implement Native PDF Rendering:**
* *Do not* use `pdf.worker.min.mjs` or `pdfjs-dist` on mobile.
* Install `react-native-pdf` in `apps/mobile`. Use it to render the documents based on the metadata fetched from your shared RxDB core.


3. **Implement Native Audio & Dictation:**
* Install `expo-av` for audio playback.
* Install a native voice recognition library (like `@react-native-voice/voice`) to replace the Web Speech API used in `apps/web`.
