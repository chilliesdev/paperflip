import sharedConfig from "@paperflip/tailwind-config";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedConfig],
  content: ["./src/**/*.{html,js,svelte,ts}"],
};
