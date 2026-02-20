<script lang="ts">
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import VideoLengthDial from "$lib/components/settings/VideoLengthDial.svelte";
  import BackgroundSelector from "$lib/components/settings/BackgroundSelector.svelte";
  import ToggleTile from "$lib/components/settings/ToggleTile.svelte";
  import TextScaleSlider from "$lib/components/settings/TextScaleSlider.svelte";

  import {
    videoLength,
    backgroundUrl,
    autoResume,
    darkMode,
    textScale,
  } from "$lib/stores/settings";

  // Using $effect for side-effects in Svelte 5
  // Note: We need to be careful with SSR. document is not available.
  // But +page.svelte runs on client too.
  // We should guard against SSR or just use an action.
  // However, SvelteKit usually handles this fine if we check browser.
  import { browser } from "$app/environment";

  $effect(() => {
    if (browser) {
      if ($darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });
</script>

<svelte:head>
  <title>PaperFlip - Settings</title>
</svelte:head>

<div
  class="max-w-md mx-auto min-h-screen bg-brand-bg relative flex flex-col overflow-hidden text-white font-display"
>
  <!-- Background Gradients -->
  <div
    class="fixed inset-0 z-0 pointer-events-none overflow-hidden max-w-md mx-auto"
  >
    <div
      class="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32"
    ></div>
  </div>

  <header class="pt-12 pb-6 px-6 z-10 flex justify-between items-end">
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight">Settings</h1>
      <p class="mt-1 text-brand-text-muted font-medium text-sm">
        Configure your experience
      </p>
    </div>
  </header>

  <main
    class="px-6 space-y-6 flex-grow overflow-y-auto pb-28 z-10 hide-scrollbar"
  >
    <!-- Video Length -->
    <VideoLengthDial bind:value={$videoLength} />

    <!-- Background -->
    <BackgroundSelector bind:selected={$backgroundUrl} />

    <!-- Toggles Grid -->
    <div class="grid grid-cols-2 gap-4">
      <ToggleTile
        title="Auto-Resume"
        description="Continue from last point"
        icon="play_circle"
        bind:checked={$autoResume}
      />
      <ToggleTile
        title="Dark Mode"
        description="System default"
        icon="dark_mode"
        bind:checked={$darkMode}
      />
    </div>

    <!-- Text Scale -->
    <TextScaleSlider bind:scale={$textScale} />
  </main>

  <BottomNavigation activeTab="settings" />
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
