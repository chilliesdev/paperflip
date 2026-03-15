# Phase 1: The Monorepo Foundation - Strategic Plan

This document outlines the detailed execution strategy for Phase 1 of the Paperflip architecture transition: migrating the existing SvelteKit application into a Turborepo + pnpm monorepo.

## 1. Understanding the Goal
The objective is to restructure the standalone SvelteKit application into a **Turborepo + pnpm monorepo** architecture. This involves moving the current application code into a dedicated `apps/web` workspace and setting up the foundation for future shared packages (`packages/core`, `packages/ui`, etc.) without breaking functional integrity.

## 2. Investigation & Analysis
- **Current State:** Standalone SvelteKit app using `npm`. Uses Tailwind CSS v4, RxDB, and Vitest.
- **Tooling Transition:** Switching from `npm` to `pnpm`; introducing `turbo` for task orchestration.
- **File Distribution:**
    - **Root Level:** `.git`, `.husky`, `specs/`, `pnpm-workspace.yaml`, `turbo.json`, and root `package.json`.
    - **Apps Level (`apps/web`):** The entire SvelteKit project including `src/`, `static/`, and project-specific configs.
- **Dependencies:** Husky and lint-staged are currently root-level but may need re-configuration to work correctly with files moved into subdirectories.

## 3. Step-by-Step Execution Plan

### Step 1: Initialize pnpm Workspace
1. **Delete `package-lock.json`** to prepare for the transition to `pnpm`.
2. **Create `pnpm-workspace.yaml`** at the root:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```
3. **Create the directory structure:** `mkdir -p apps/web packages`.

### Step 2: Restructure into Workspaces
1. **Move the SvelteKit application:** Move all core SvelteKit files and folders into `apps/web/`.
   - *Folders:* `src/`, `static/`, `tests/`.
   - *Configs:* `package.json`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.js`, `.prettierignore`, `.npmrc`.
2. **Rename the web package:** Update `apps/web/package.json`'s `"name"` field to `@paperflip/web`.
3. **Create a Root `package.json`:**
   ```json
   {
     "name": "paperflip-monorepo",
     "private": true,
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "test": "turbo run test",
       "lint": "turbo run lint",
       "format": "pnpm -r format"
     }
   }
   ```

### Step 3: Configure Turborepo
1. **Install Turbo:** Run `pnpm add turbo --workspace-root -D`.
2. **Create `turbo.json`** at the root:
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".svelte-kit/**", "build/**"]
       },
       "test": {},
       "lint": {},
       "dev": {
         "cache": false,
         "persistent": true
       }
     }
   }
   ```

### Step 4: Fix Tooling & Dependencies
1. **Husky & Lint-staged:** Update `.husky/pre-commit` to ensure it triggers correctly. Move `lint-staged` configuration to the root or ensure the root husky hook can find it in the workspace.
2. **Global `pnpm install`:** Run `pnpm install` from the root to generate the `pnpm-lock.yaml` and link the workspaces.

### Step 5: Verification
1. **Test Web Dev:** Run `pnpm dev` from root and verify the app starts at `localhost:5173`.
2. **Test Build:** Run `pnpm build` and ensure the SvelteKit adapter finishes successfully.
3. **Test Vitest:** Run `pnpm test` to ensure paths in Vitest (especially `$lib` aliases) still resolve correctly within the new structure.

## 4. Anticipated Challenges
- **Path Aliases:** SvelteKit's `$lib` alias should stay intact within `apps/web`, but root-relative paths in tests might break.
- **Husky Hooks:** Root-level Husky hooks may need to be updated to target the workspace using `pnpm --filter`.
- **Tailwind/PostCSS:** Config resolution might change if moved; ensuring all dependencies are in `apps/web/package.json`.
- **npm to pnpm Transition:** Addressing any hoisting issues via `.npmrc` settings if necessary.
