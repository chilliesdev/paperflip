<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { onMount } from "svelte";
  import { isLoading, loadingStatus } from "$lib/stores/loading";
  import { waitForVoices } from "$lib/audio";
  import { videoSources } from "$lib/constants";
  import { videoAssetUrls } from "$lib/stores/assets";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";

  let { children } = $props();

  onMount(async () => {
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
          const response = await fetch(src);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          urls[src] = url;
        } catch (e) {
          console.error(`Failed to fetch video: ${src}`, e);
          // Fallback to original source if fetch fails
          urls[src] = src;
        }
      });

      await Promise.all(promises);
      videoAssetUrls.set(urls);
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
