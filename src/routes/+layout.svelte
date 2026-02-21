<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { onMount } from "svelte";
  import { isLoading, loadingStatus } from "$lib/stores/loading";
  import { waitForVoices } from "$lib/audio";
  import { videoSources } from "$lib/constants";
  import { videoAssetUrls } from "$lib/stores/assets";
  import { darkMode, settingsStores, autoResume } from "$lib/stores/settings";
  import { audioStores } from "$lib/stores/audio";
  import { syncStoresWithDb } from "$lib/stores/sync";
  import { getRecentUploads } from "$lib/database";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { get } from "svelte/store";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";

  let { children } = $props();

  async function performAutoResume() {
    const recentDocs = await getRecentUploads(1);
    if (recentDocs && recentDocs.length > 0) {
      const lastDoc = recentDocs[0];
      const feedUrl = `/feed?id=${encodeURIComponent(lastDoc.documentId)}`;
      // @ts-expect-error - Dynamic URL
      await goto(resolve(feedUrl));
    }
  }

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

    // Auto-resume logic
    if (browser && !sessionStorage.getItem("hasAutoResumed")) {
      if (
        window.location.pathname === "/" ||
        window.location.pathname === resolve("/")
      ) {
        if (get(autoResume)) {
          await performAutoResume();
        }
      }
      sessionStorage.setItem("hasAutoResumed", "true");
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
