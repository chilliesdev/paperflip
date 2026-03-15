import sharedConfig from "@paperflip/eslint-config";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  ...svelte.configs["flat/recommended"],
  ...svelte.configs["flat/prettier"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      "build/",
      ".svelte-kit/",
      "dist/",
      ".husky/",
      "coverage/",
      "package-lock.json",
      "pnpm-lock.yaml",
      "static/",
      ".agents/",
      ".playwright/",
      "specs/",
    ],
  },
];
