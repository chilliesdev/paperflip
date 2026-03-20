import baseConfig from '@paperflip/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".expo/**"
    ]
  },
  {
    files: ["metro.config.cjs", "tailwind.config.js", "babel.config.cjs", "jest.setup.cjs"],
    languageOptions: { globals: { jest: "readonly", global: "writable" } },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
