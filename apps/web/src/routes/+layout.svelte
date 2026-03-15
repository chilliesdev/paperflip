<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { onMount, untrack } from "svelte";
  import { isLoading, loadingStatus } from "$lib/stores/loading";
  import { waitForVoices } from "$lib/audio";
  import {
    videoAssetUrls,
    getCachedVideoBlob,
    saveVideoToCache,
    deleteOtherVideosFromCache,
  } from "$lib/stores/assets";
  import {
    darkMode,
    settingsStores,
    autoResume,
    backgroundUrl,
  } from "$lib/stores/settings";
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

  // Background Video Reactive Loading
  $effect(() => {
    if (browser && $backgroundUrl) {
      const url = $backgroundUrl;

      // Skip if already loaded as blob
      const current = untrack(() => get(videoAssetUrls)[url]);
      if (current && current.startsWith("blob:")) {
        return;
      }

      const loadVideo = async () => {
        try {
          // 1. Check Cache API
          const cachedBlob = await getCachedVideoBlob(url);
          if (cachedBlob) {
            const objectUrl = URL.createObjectURL(cachedBlob);
            updateVideoAssetUrl(url, objectUrl);
          } else {
            // 2. Fetch and Cache
            const response = await fetch(url);
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            await saveVideoToCache(url, blob);
            const objectUrl = URL.createObjectURL(blob);
            updateVideoAssetUrl(url, objectUrl);
          }

          // 3. Cleanup other caches
          await deleteOtherVideosFromCache(url);
        } catch (e) {
          console.error(`Failed to load background video: ${url}`, e);
          // Fallback to original URL
          updateVideoAssetUrl(url, url);
        }
      };

      loadVideo();
    }
  });

  function updateVideoAssetUrl(src: string, blobUrl: string) {
    videoAssetUrls.update((prev) => {
      const next: Record<string, string> = {};

      // Revoke ALL existing blob URLs in the store to prevent memory leaks
      Object.entries(prev).forEach(([_key, val]) => {
        if (val.startsWith("blob:")) {
          URL.revokeObjectURL(val);
        }
      });

      // Set the new one
      next[src] = blobUrl;
      return next;
    });
  }

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

    try {
      loadingStatus.set("Initializing voices...");
      await waitForVoices();
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
