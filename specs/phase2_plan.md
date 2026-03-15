# Phase 2: Extract Shared Configurations - Strategic Plan

This document outlines the execution strategy for Phase 2 of the Paperflip architecture transition: centralizing configurations and tooling into reusable workspace packages.

## 1. Understanding the Goal
The objective is to extract and centralize configuration and tooling from the standalone web application into reusable workspace packages. This ensures that both the web and future mobile platforms share a unified source of truth for code quality, type checking, and design system standards.

## 2. Investigation & Analysis
- **Current State:** SvelteKit application and configuration files reside in `apps/web/` (following Phase 1).
- **Target Packages:**
    - `@paperflip/prettier-config`: Shared code formatting rules.
    - `@paperflip/ts-config`: Base TypeScript compiler options.
    - `@paperflip/eslint-config`: Shared ESLint flat config rules.
    - `@paperflip/tailwind-config`: Shared Tailwind CSS theme and presets.
- **Key Files for Extraction:**
    - `.prettierrc.js`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.js`.

## 3. Step-by-Step Execution Plan

### Step 1: Scaffold Config Packages
1. **Create directory structure:**
   ```bash
   mkdir -p packages/eslint-config packages/ts-config packages/tailwind-config packages/prettier-config
   ```
2. **Initialize `package.json`** for each package with `"name": "@paperflip/<pkg-name>"` and `"private": true`.

### Step 2: Extract Prettier Configuration
1. **Move rules** to `packages/prettier-config/index.js`.
2. **Update `apps/web/package.json`** to depend on `@paperflip/prettier-config`.
3. **Refactor `apps/web/.prettierrc.js`** to export the shared configuration.

### Step 3: Extract TypeScript Configuration
1. **Create `packages/ts-config/base.json`** containing framework-agnostic compiler options.
2. **Update `apps/web/package.json`** to depend on `@paperflip/ts-config`.
3. **Update `apps/web/tsconfig.json`** to extend the shared base while maintaining SvelteKit's required extensions.

### Step 4: Extract ESLint Configuration
1. **Move base rules** to `packages/eslint-config/index.js`.
2. **Ensure dependencies** like `@typescript-eslint/eslint-plugin` are in the config package's `package.json`.
3. **Update `apps/web/eslint.config.js`** to merge shared rules with Svelte-specific plugins.

### Step 5: Extract Tailwind CSS Theme
1. **Move shared design tokens** (colors, fonts, theme extensions) to `packages/tailwind-config/tailwind.config.js`.
2. **Update `apps/web/package.json`** to depend on `@paperflip/tailwind-config`.
3. **Update `apps/web/tailwind.config.js`** to import the shared config as a `preset`.

### Step 6: Verification
1. **Run `pnpm install`** from root to link workspaces.
2. **Run `turbo run lint`** to verify ESLint resolution.
3. **Run `turbo run build`** to confirm the web app still compiles correctly.

## 4. Anticipated Challenges
- **ESLint Plugin Resolution:** Ensuring plugins are correctly resolved in the flat config format from shared packages.
- **TypeScript Inheritance:** Managing multiple levels of `tsconfig` inheritance (SvelteKit + Shared Base).
- **Tailwind v4 Transition:** If migrating to Tailwind v4, the sharing mechanism will shift from JS presets to CSS `@import` rules.
- **Monorepo Pathing:** Ensuring Vite and TypeScript resolve symlinked workspace dependencies without additional `fs.allow` configuration.
