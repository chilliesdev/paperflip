<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import { onMount } from "svelte";
  import { isLoading, loadingStatus } from "$lib/stores/loading";
  import { waitForVoices } from "$lib/audio";
  import { videoSources } from "$lib/constants";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";

  let { children } = $props();

  onMount(async () => {
    try {
      loadingStatus.set("Initializing voices...");
      await waitForVoices();

      loadingStatus.set("Loading videos...");
      const promises = videoSources.map((src) => {
        return new Promise<void>((resolve) => {
          const vid = document.createElement("video");
          vid.src = src;
          vid.preload = "auto";
          vid.muted = true; // maximize auto-loading chance

          if (vid.readyState >= 3) {
            resolve();
            return;
          }

          const onCanPlay = () => {
            vid.removeEventListener("canplay", onCanPlay);
            vid.removeEventListener("error", onError);
            resolve();
          };
          const onError = () => {
            console.error("Failed to load", src);
            vid.removeEventListener("canplay", onCanPlay);
            vid.removeEventListener("error", onError);
            resolve(); // Don't block app
          };

          vid.addEventListener("canplay", onCanPlay);
          vid.addEventListener("error", onError);

          // Timeout 8s
          setTimeout(() => {
            vid.removeEventListener("canplay", onCanPlay);
            vid.removeEventListener("error", onError);
            resolve();
          }, 8000);
        });
      });

      await Promise.all(promises);
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
