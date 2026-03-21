import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/database.ts", "src/segmenter.ts", "src/constants.ts", "src/types.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
