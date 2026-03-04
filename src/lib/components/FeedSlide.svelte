<script lang="ts">
  import { untrack } from "svelte";
  import { videoAssetUrls } from "$lib/stores/assets";
  import { isMuted } from "$lib/stores/audio";
  import { splitSentences } from "$lib/segmenter";

  let {
    segment = "",
    isActive,
    isPlaying = true,
    currentCharIndex,
    highlightEndIndex = undefined,
    highlightStartIndex = undefined,
    videoSource,
    textScale = 100,
    onScrubStart = () => {},
    onScrub = (_index: number) => {},
    onScrubEnd = (_index: number) => {},
  } = $props();

  let videoEl: HTMLVideoElement | undefined = $state();
  let isDragging = $state(false);

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

  // Hoist to avoid re-compiling/allocating the RegExp inside a reactive block.
  // We must reset lastIndex before use because of the global flag /g.
  const wordRegex = /\S+/g;

  let words = $derived.by(() => {
    if (!segment) return [];
    const w: { word: string; start: number; end: number }[] = [];
    wordRegex.lastIndex = 0; // Reset state before execution
    let match;
    while ((match = wordRegex.exec(segment)) !== null) {
      w.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return w;
  });

  let sentences = $derived.by(() => {
    if (!segment) return [];
    return splitSentences(segment);
  });

  let currentSentence = $derived.by(() => {
    if (currentCharIndex === -1 || !isActive) {
      // Return first sentence or null?
      // If we haven't started, showing first sentence seems right.
      return sentences.length > 0 ? sentences[0] : null;
    }
    const found = sentences.find(
      (s) => currentCharIndex >= s.start && currentCharIndex < s.end,
    );
    if (found) return found;

    // If not found (e.g. gaps, or out of bounds)
    if (sentences.length === 0) return null;
    if (currentCharIndex < sentences[0].start) return sentences[0];
    if (currentCharIndex >= sentences[sentences.length - 1].end)
      return sentences[sentences.length - 1];

    // Fallback: find closest previous sentence
    // This handles gaps between sentences (like spaces)
    // We want to show the sentence that we just finished or are about to start?
    // Usually spaces are attached to previous sentence by Intl.Segmenter.
    // But if we are in a gap, showing previous sentence seems safer or next?
    // Let's try to find the last sentence that started before currentCharIndex.
    for (let i = sentences.length - 1; i >= 0; i--) {
      if (sentences[i].start <= currentCharIndex) {
        return sentences[i];
      }
    }
    return sentences[0];
  });

  // Progress based on character index for smoother animation
  let progress = $derived(
    segment.length > 0
      ? Math.min(100, (Math.max(0, currentCharIndex) / segment.length) * 100)
      : 0,
  );

  function getScrubIndex(e: PointerEvent) {
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(percentage * segment.length);
  }

  function handlePointerDown(e: PointerEvent) {
    e.stopPropagation();
    const element = e.currentTarget as HTMLElement;
    element.setPointerCapture(e.pointerId);
    isDragging = true;
    onScrubStart();
    const index = getScrubIndex(e);
    onScrub(index);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    e.stopPropagation();
    const index = getScrubIndex(e);
    onScrub(index);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    e.stopPropagation();
    isDragging = false;
    const element = e.currentTarget as HTMLElement;
    element.releasePointerCapture(e.pointerId);
    const index = getScrubIndex(e);
    onScrubEnd(index);
  }

  // In dictation mode, we want to show all words in the current sentence (range).
  // If highlightEndIndex is set, find all words within [start, highlightEndIndex].
  // Uses highlightStartIndex if provided, else falls back to currentCharIndex.
  let visibleWords = $derived.by(() => {
    if (highlightEndIndex !== undefined) {
      return words.filter(
        (w) =>
          w.start >= (highlightStartIndex ?? currentCharIndex) &&
          w.end <= highlightEndIndex,
      );
    } else {
      // Karaoke Mode: show current sentence
      if (!currentSentence) return words; // Default to all if no sentence structure? Or empty?
      return words.filter(
        (w) => w.start >= currentSentence.start && w.end <= currentSentence.end,
      );
    }
  });
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

  <!-- Glassmorphism Text Container -->
  <div
    class="relative z-10 h-full flex flex-col justify-center px-8 py-20 pointer-events-none"
  >
    <div
      class="backdrop-blur-xl bg-black/60 rounded-2xl px-6 py-8 border border-white/10 shadow-xl max-w-[90%] mx-auto"
    >
      <div
        class="leading-relaxed text-center font-medium"
        style="font-size: {textScale / 100}rem"
      >
        {#each visibleWords as w (w.start)}
          {@const isDictation = highlightEndIndex !== undefined}
          {@const active = isDictation
            ? w.start >= currentCharIndex && w.end <= (highlightEndIndex ?? 0)
            : currentCharIndex >= w.start && currentCharIndex < w.end}
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
  </div>

  <!-- Progress Bar -->
  <div
    class="absolute bottom-0 left-0 right-0 z-30 h-6 cursor-pointer flex items-end group touch-none select-none"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onpointerleave={handlePointerUp}
    role="slider"
    aria-label="Seek slider"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={progress}
    tabindex="0"
  >
    <div
      class="w-full h-1 bg-white/10 mb-0 group-hover:h-2 transition-all duration-200"
    >
      <div
        class="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300 ease-out"
        style="width: {progress}%"
      ></div>
    </div>
  </div>
</div>
