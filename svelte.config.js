import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    // Consult https://svelte.dev/docs/kit/integrations
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter({
      // default options are shown. On some platforms
      // these options are set automatically — see below
      pages: "build",
      assets: "build",
      fallback: "index.html", // Use 'index.html' or '404.html' for SPA mode
      precompress: false,
      strict: true,
    }),
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:'],
        'media-src': [
          'self',
          'https://hcidefilvllxloywohwf.supabase.co',
          'blob:',
        ],
        'connect-src': ['self', 'https://hcidefilvllxloywohwf.supabase.co'],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
      },
    },
  },
};

export default config;
