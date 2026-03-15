# Phase 4: Initialize the Mobile App (Expo) - Strategic Plan

This document outlines the execution strategy for Phase 4 of the Paperflip architecture transition: scaffolding the React Native mobile application and integrating it into the Turborepo workspace.

## 1. Understanding the Goal

The primary objective of Phase 4 is to scaffold the React Native mobile application using Expo, integrate it into the existing Turborepo workspace, and establish connections to the shared configurations and core business logic packages. This phase verifies that a new mobile client can successfully consume the exact same underlying logic (`@paperflip/core`) and design system (`@paperflip/tailwind-config`) as the web app.

## 2. Investigation & Analysis

- **Mobile Framework:** We will use Expo with a TypeScript template (`expo-template-blank-typescript`) to provide a robust, modern foundation for React Native development.
- **Styling Strategy:** NativeWind will be implemented to bridge the shared Tailwind CSS configuration from Phase 2 into the React Native environment. This ensures immediate visual consistency between platforms.
- **Core Integration:** The mobile app must successfully link to and consume `@paperflip/core`. Importing database logic (RxDB) or shared constants will verify that workspace package resolution is functioning correctly in the mobile bundler.
- **Monorepo Tooling:** The new Expo app needs to participate in the Turborepo build pipeline and utilize the shared `eslint-config` and `ts-config` packages.

## 3. Step-by-Step Execution Plan

### Step 1: Scaffold the Expo Application

1. Navigate to the `apps/` directory within the monorepo.
2. Initialize the Expo app by running: `npx create-expo-app mobile -t expo-template-blank-typescript`.
3. Update `apps/mobile/package.json` to set the package name to `"@paperflip/mobile"`.

### Step 2: Integrate Shared Configurations

1. Add workspace dependencies to `apps/mobile/package.json` for `@paperflip/eslint-config` and `@paperflip/ts-config` (e.g., `"@paperflip/ts-config": "workspace:*"`).
2. Update `apps/mobile/tsconfig.json` to extend the shared base TypeScript config.
3. Configure ESLint for the mobile app to utilize the shared preset.

### Step 3: Setup NativeWind and Shared Styling

1. Install `nativewind` and its peer dependency `tailwindcss` within the `apps/mobile` package.
2. Add `"@paperflip/tailwind-config": "workspace:*"` as a dependency.
3. Create `apps/mobile/tailwind.config.js` and configure it to use the preset exported by the shared Tailwind package.
4. Update the Expo app's Babel configuration (`babel.config.js`) to include the NativeWind plugin.

### Step 4: Link and Verify Shared Core Logic

1. Add `"@paperflip/core": "workspace:*"` to the `apps/mobile/package.json` dependencies.
2. Run `pnpm install` from the workspace root to ensure all local packages are correctly symlinked.
3. Modify `apps/mobile/App.tsx` to import a core module (e.g., `import { db } from '@paperflip/core'`).
4. Render a basic text view in the app that displays an output from the core logic to confirm successful integration.

### Step 5: Monorepo Build Pipeline Integration

1. Review the root `turbo.json` file.
2. Ensure `apps/mobile` scripts (like `start`, `lint`, `typecheck`) are correctly mapped or safely ignored in the Turborepo pipeline.

## 4. Anticipated Challenges

- **Metro Bundler & Monorepos:** React Native's Metro bundler often requires custom `metro.config.js` logic to resolve symlinks and watch packages outside the app root in a `pnpm` workspace.
- **NativeWind Resolution:** Configuring NativeWind to watch and apply styles from files outside of the `apps/mobile` directory requires precise Tailwind content path configuration.
- **RxDB Mobile Adapters:** While importing logic works, initializing RxDB on mobile requires the core package to support SQLite-based adapters instead of IndexedDB.
- **TypeScript Resolution:** Ensuring the Expo app correctly resolves the types from `@paperflip/core` through the workspace symlinks.
