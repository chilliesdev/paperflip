import preset from "@paperflip/tailwind-config";
import nativewind from "nativewind/preset";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [preset, nativewind],
  theme: {
    extend: {},
  },
  plugins: [],
};
