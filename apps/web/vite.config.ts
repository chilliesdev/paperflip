/// <reference types="vitest" />
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const plugins = [
    sveltekit(),
    mode !== "test" &&
      nodePolyfills({
        include: ["buffer", "process", "util", "stream", "events"],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
  ];

  if (mode === "test") {
    const { svelteTesting } = await import("@testing-library/svelte/vite");
    plugins.push(svelteTesting());
  }

  return {
    plugins,
    resolve: {
      conditions: mode === "test" ? ["browser"] : undefined,
      alias:
        mode === "test"
          ? {
              "pdfjs-dist": path.resolve(
                process.cwd(),
                "src/tests/mocks/pdfjs-dist.ts",
              ),
            }
          : undefined,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/tests/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,ts}"],
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
