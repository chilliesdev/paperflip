<script lang="ts">
  import { untrack } from "svelte";
  import { Volume2, VolumeX, ChevronUp } from "lucide-svelte";
  import { scale } from "svelte/transition";
  import { videoAssetUrls } from "$lib/stores/assets";
  import { wordCount } from "$lib/constants";
  import { isMuted } from "$lib/stores/audio";
  import type { Word } from "$lib/text-utils";

  let {
    segment = "",
    words = [] as Word[],
    index,
    isActive,
    isPlaying = true,
    currentCharIndex,
    highlightEndIndex = undefined,
    highlightStartIndex = undefined,
    videoSource,
  } = $props();

  let videoEl: HTMLVideoElement | undefined = $state();

  // Use the source available at mount time (or when videoSource changes) to prevent
  // reloading/glitches during playback if the background download finishes later.
  // We untrack the store so updates to it don't trigger re-renders,
  // but updates to videoSource DO trigger re-renders.
  let cachedSource = $derived.by(() => {
    const src = videoSource; // Track this dependency
    const cached = untrack(() => $videoAssetUrls[src]); // Untrack this dependency
    return cached || src;
  });

  $effect(() => {
    if (videoEl) {
      if (isActive && isPlaying) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    }
  });

  let currentWordIdx = $derived.by(() => {
    if (currentCharIndex === -1 || !isActive) {
      return -1;
    }
    // Find current word index based on char index
    let idx = words.findIndex(
      (w) => currentCharIndex >= w.start && currentCharIndex < w.end,
    );
    if (idx === -1) {
      // Fallback: find the closest word that started before charIndex
      idx = words.findIndex((w) => currentCharIndex < w.start) - 1;
      // If still -1 (before first word) or wasn't found (end of text?), handle edges
      if (idx < -1) idx = words.length - 1;
      if (idx === -2) idx = -1; // Before first word
    }
    return idx;
  });

  // Progress based on character index for smoother animation
  let progress = $derived(
    segment.length > 0
      ? Math.min(100, (Math.max(0, currentCharIndex) / segment.length) * 100)
      : 0,
  );

  let startIndex = $derived(
    currentWordIdx === -1
      ? 0
      : Math.floor(currentWordIdx / wordCount) * wordCount,
  );

  // In dictation mode, we want to show all words in the current sentence (range).
  // If highlightEndIndex is set, find all words within [start, highlightEndIndex].
  // Uses highlightStartIndex if provided, else falls back to currentCharIndex.
  let visibleWords = $derived(
    highlightEndIndex !== undefined
      ? words.filter(
          (w) =>
            w.start >= (highlightStartIndex ?? currentCharIndex) &&
            w.end <= highlightEndIndex,
        )
      : words.slice(startIndex, startIndex + wordCount),
  );

  function toggleMute(e: MouseEvent) {
    e.stopPropagation();
    isMuted.update((v) => !v);
  }
</script>

<div class="w-full h-full relative overflow-hidden bg-black">
  <!-- Video Background Layer -->
  <div class="absolute inset-0 z-0">
    <video
      bind:this={videoEl}
      class="w-full h-full object-cover opacity-80"
      src={cachedSource}
      loop
      muted={$isMuted}
      playsinline
    ></video>
    <!-- Gradient Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-teal-900/40 mix-blend-overlay"
    ></div>
  </div>

  <!-- Floating TTS Indicator (Top Right) -->
  {#if isActive && currentWordIdx > -1}
    <button
      transition:scale
      class="absolute top-8 right-8 z-20 w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/30 animate-pulse hover:scale-110 transition-transform active:scale-95"
      onclick={toggleMute}
      aria-label={$isMuted ? "Unmute" : "Mute"}
    >
      {#if $isMuted}
        <VolumeX class="w-6 h-6 text-black" />
      {:else}
        <Volume2 class="w-6 h-6 text-black" />
      {/if}
    </button>
  {/if}

  <!-- Glassmorphism Text Container -->
  <div
    class="relative z-10 h-full flex flex-col justify-center px-8 py-20 pointer-events-none"
  >
    <div
      class="backdrop-blur-xl bg-black/60 rounded-2xl px-6 py-8 border border-white/10 shadow-xl max-w-[90%] mx-auto"
    >
      <div class="text-base leading-relaxed text-center font-medium">
        {#each visibleWords as w, i (startIndex + i)}
          {@const globalIdx = startIndex + i}
          {@const isDictation = highlightEndIndex !== undefined}
          {@const active = isDictation
            ? w.start >= currentCharIndex && w.end <= (highlightEndIndex ?? 0)
            : globalIdx === currentWordIdx}
          {@const past = w.end <= currentCharIndex}
          <span
            class="inline-block transition-all duration-200 {active
              ? 'mx-1.5'
              : 'mx-[2px]'} {active
              ? 'text-brand-primary font-bold scale-110 drop-shadow-[0_0_12px_var(--brand-primary)]'
              : past
                ? 'text-white/80'
                : 'text-white/50'}"
          >
            {w.word}
          </span>
        {/each}
      </div>
    </div>

    <!-- Swipe Up Hint (only on first slide when active) -->
    {#if index === 0 && isActive}
      <div
        class="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-80 animate-bounce z-30"
      >
        <ChevronUp class="w-10 h-10 text-brand-primary" />
        <p class="text-white text-sm font-bold drop-shadow-lg">
          Swipe up to continue
        </p>
      </div>
    {/if}
  </div>

  <!-- Progress Bar -->
  <div class="absolute bottom-0 left-0 right-0 z-20">
    <div class="h-1 bg-white/10">
      <div
        class="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300 ease-out"
        style="width: {progress}%"
      ></div>
    </div>
  </div>
</div>
