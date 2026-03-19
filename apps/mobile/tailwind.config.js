import preset from '@paperflip/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
}
