import sharedConfig from "@paperflip/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    files: ["src/__tests__/**/*.ts", "src/database.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
    ],
  },
];
