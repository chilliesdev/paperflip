<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { register } from "swiper/element/bundle";
  import {
    initializeTTS,
    speakText,
    stopTTS,
    pauseTTS,
    resumeTTS,
    isPaused,
  } from "$lib/audio";
  import { isDictationMode } from "$lib/stores/audio";
  import { splitSentences } from "$lib/segmenter";
  import { updateDocumentProgress } from "$lib/database";
  import { videoSources } from "$lib/constants";
  import FeedSlide from "$lib/components/FeedSlide.svelte";
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  export let segments: string[] = [];
  export let initialIndex: number = 0;
  export let initialProgress: number = 0;
  export let documentId: string = "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swiperInstance: any;
  let currentCharIndex: number = -1;
  let highlightEndIndex: number | undefined = undefined;
  let activeIndex = initialIndex;
  let currentSegmentProgress = 0;
  let isPlaying = false;
  let isFirstPlay = true;
  let boundaryCheckTimeout: ReturnType<typeof setTimeout>;
  let saveTimeout: ReturnType<typeof setTimeout>;

  function handleSwiperInit(e: CustomEvent) {
    const [swiper] = e.detail;
    swiperInstance = swiper;
    activeIndex = swiper.activeIndex;
    initializeTTS();
    if (segments.length > 0) {
      speakCurrentSlide();
    }
  }

  function handleSlideChange(e: CustomEvent) {
    if (segments.length > 0) {
      const [swiper] = e.detail;
      swiperInstance = swiper;
      // Save progress of previous slide (which is technically just saving the *fact* we moved, usually with 0 progress for new slide)
      // But we want to ensure we save the LAST known state before moving.
      // However, usually moving to next slide resets progress to 0 for that new slide.
      // So we save the NEW index and 0 progress.
      activeIndex = swiper.realIndex;
      currentSegmentProgress = 0; // Reset progress for new slide
      saveProgress(); // Persist the move (debounced by default)
      speakCurrentSlide();
    }
  }

  function saveProgress(immediate = false) {
    if (!documentId) return;

    if (saveTimeout) clearTimeout(saveTimeout);

    if (immediate) {
      updateDocumentProgress(documentId, activeIndex, currentSegmentProgress);
    } else {
      saveTimeout = setTimeout(() => {
        updateDocumentProgress(documentId, activeIndex, currentSegmentProgress);
      }, 1000);
    }
  }

  function speakCurrentSlide() {
    stopTTS(); // Stop any previous speech
    if (boundaryCheckTimeout) clearTimeout(boundaryCheckTimeout);
    currentCharIndex = -1;
    highlightEndIndex = undefined;

    // Determine start index:
    // If it's the very first play and we are on the initial index, use initialProgress.
    // Otherwise, start from 0.
    let startIndex = 0;
    if (isFirstPlay && activeIndex === initialIndex) {
      startIndex = initialProgress;
      isFirstPlay = false;
    }

    currentSegmentProgress = startIndex;
    const currentSegment = segments[swiperInstance.realIndex];
    if (!currentSegment) return;

    if ($isDictationMode) {
      speakDictation(currentSegment, startIndex);
    } else {
      speakKaraoke(currentSegment, startIndex);
    }
  }

  function speakKaraoke(text: string, startIndex: number) {
    let boundaryFired = false;

    // Start checking for boundary events support
    boundaryCheckTimeout = setTimeout(() => {
      if (!boundaryFired && isPlaying) {
        console.warn("Boundary events missing, switching to Dictation Mode");
        stopTTS();
        isDictationMode.set(true);
        speakCurrentSlide(); // Restart in dictation mode
      }
    }, 1500);

    speakText(
      text,
      (_word, charIndex) => {
        boundaryFired = true;
        if (boundaryCheckTimeout) clearTimeout(boundaryCheckTimeout);
        currentCharIndex = charIndex;
        currentSegmentProgress = charIndex;
      },
      () => {
        if (boundaryCheckTimeout) clearTimeout(boundaryCheckTimeout);
        isPlaying = false;
        // When finished, set progress to the end of segment
        // This ensures granular progress reflects completion
        currentSegmentProgress = text.length;
        saveProgress(true); // Immediate save on completion
      },
      startIndex,
    );
    isPlaying = true;
  }

  function speakDictation(text: string, startIndex: number) {
    const sentences = splitSentences(text);
    // Find sentences that haven't finished yet (end > startIndex)
    const sentenceQueue = sentences.filter((s) => s.end > startIndex);
    playNextSentence(sentenceQueue, startIndex);
  }

  function playNextSentence(
    queue: { text: string; start: number; end: number }[],
    originalStartIndex: number,
  ) {
    if (queue.length === 0) {
      isPlaying = false;
      // We assume completion of the segment
      currentSegmentProgress = segments[swiperInstance.realIndex].length;
      saveProgress(true); // Immediate save on completion
      return;
    }

    const currentSentence = queue[0];
    const remaining = queue.slice(1);

    // Update Highlight: highlight the whole sentence
    currentCharIndex = currentSentence.start;
    highlightEndIndex = currentSentence.end;
    currentSegmentProgress = currentSentence.start;

    // Calculate offset if we are resuming mid-sentence
    // If originalStartIndex is within this sentence, start from there.
    // Else (for subsequent sentences, we don't have an offset
    const offset = Math.max(0, originalStartIndex - currentSentence.start);

    isPlaying = true;

    speakText(
      currentSentence.text,
      undefined, // No boundary needed
      () => {
        // On end of this sentence
        if (!isPlaying) return; // If stopped externally
        // For subsequent sentences, we don't have an offset
        playNextSentence(remaining, 0);
      },
      offset,
    );
  }

  function togglePlayback() {
    if (isPlaying) {
      pauseTTS();
      isPlaying = false;
      saveProgress(true); // Immediate save when paused
    } else {
      if (isPaused()) {
        resumeTTS();
      } else {
        // If not paused but not playing (e.g. finished), restart
        speakCurrentSlide();
      }
      isPlaying = true;
    }
  }

  onMount(async () => {
    register();
    initializeTTS();
  });

  onDestroy(() => {
    stopTTS();
    if (boundaryCheckTimeout) clearTimeout(boundaryCheckTimeout);
    if (saveTimeout) clearTimeout(saveTimeout);
    saveProgress(true); // Immediate save on exit
  });
</script>

<div class="w-full h-full relative bg-black">
  {#if segments.length > 0}
    <!-- Page Indicator -->
    <div
      class="absolute top-8 left-1/2 -translate-x-[110%] z-40 backdrop-blur-xl bg-black/40 px-4 py-2 rounded-full border border-white/20 pointer-events-none"
    >
      <p class="text-white text-sm font-medium">
        Short {activeIndex + 1} / {segments.length}
      </p>
    </div>

    <swiper-container
      direction="vertical"
      slides-per-view={1}
      space-between={0}
      mousewheel={true}
      initial-slide={initialIndex}
      class="mySwiper w-full h-full"
      data-testid="swiper-mock"
      on:swiperinit={handleSwiperInit}
      on:swiperslidechange={handleSlideChange}
      on:click={togglePlayback}
    >
      {#each segments as segment, i (i)}
        <swiper-slide class="w-full h-full" data-testid="swiper-slide-mock">
          {#if Math.abs(i - activeIndex) <= 2}
            <FeedSlide
              {segment}
              index={i}
              isActive={i === activeIndex}
              {isPlaying}
              currentCharIndex={i === activeIndex ? currentCharIndex : -1}
              highlightEndIndex={i === activeIndex
                ? highlightEndIndex
                : undefined}
              videoSource={videoSources[i % videoSources.length]}
            />
          {:else}
            <!-- Render placeholder for off-screen slides to save memory -->
            <div class="w-full h-full bg-black"></div>
          {/if}
        </swiper-slide>
      {/each}
    </swiper-container>
  {:else}
    <div class="flex flex-col items-center justify-center h-full text-white">
      <p class="text-xl">Upload a PDF to see the feed!</p>
    </div>
  {/if}
</div>
