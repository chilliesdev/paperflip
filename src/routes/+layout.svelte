<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { onMount } from "svelte";
  import { isLoading, loadingStatus } from "$lib/stores/loading";
  import { waitForVoices } from "$lib/audio";
  import { videoSources } from "$lib/constants";
  import { videoAssetUrls } from "$lib/stores/assets";
  import { darkMode, settingsStores } from "$lib/stores/settings";
  import { audioStores } from "$lib/stores/audio";
  import { syncStoresWithDb } from "$lib/stores/sync";
  import { browser } from "$app/environment";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";

  let { children } = $props();

  // Global Dark Mode side-effect
  $effect(() => {
    if (browser) {
      if ($darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });

  onMount(async () => {
    try {
      loadingStatus.set("Initializing database...");
      await syncStoresWithDb({ ...settingsStores, ...audioStores });
    } catch (e) {
      console.error("Failed to initialize settings from database", e);
    }

    if (Object.keys($videoAssetUrls).length > 0) {
      isLoading.set(false);
      return;
    }
    try {
      loadingStatus.set("Initializing voices...");
      await waitForVoices();

      loadingStatus.set("Loading videos...");
      const urls: Record<string, string> = {};

      const promises = videoSources.map(async (src) => {
        try {
          const response = await fetch(src.url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          urls[src.url] = url;
        } catch (e) {
          console.error(`Failed to fetch video: ${src.url}`, e);
          // Fallback to original source if fetch fails
          urls[src.url] = src.url;
        }
      });

      // Load videos in background without blocking UI
      Promise.all(promises)
        .then(() => {
          videoAssetUrls.set(urls);
        })
        .catch((err) => {
          console.error("Video loading error", err);
        });
    } catch (e) {
      console.error("Loading error", e);
    } finally {
      isLoading.set(false);
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if $isLoading}
  <LoadingScreen />
{:else}
  {@render children()}
{/if}
