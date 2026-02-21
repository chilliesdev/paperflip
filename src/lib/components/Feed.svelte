<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { register } from "swiper/element/bundle";
  import { resolve } from "$app/paths";
  import {
    initializeTTS,
    speakText,
    stopTTS,
    pauseTTS,
    resumeTTS,
    isPaused,
  } from "$lib/audio";
  import { isDictationMode, autoScroll, isMuted } from "$lib/stores/audio";
  import { backgroundUrl, textScale } from "$lib/stores/settings";
  import { splitSentences } from "$lib/segmenter";
  import { updateDocumentProgress } from "$lib/database";
  import { videoSources } from "$lib/constants";
  import FeedSlide from "$lib/components/FeedSlide.svelte";
  import ReadingOptionsSheet from "$lib/components/ReadingOptionsSheet.svelte";
  import {
    ChevronLeft,
    MoreHorizontal,
    Volume2,
    VolumeX,
    ChevronUp,
  } from "lucide-svelte";
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  let {
    segments = [],
    initialIndex = 0,
    initialProgress = 0,
    documentId = "",
  } = $props();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swiperInstance: any = $state();
  let currentCharIndex: number = $state(-1);
  let highlightEndIndex: number | undefined = $state(undefined);
  let highlightStartIndex: number | undefined = $state(undefined);
  let activeIndex = $state(untrack(() => initialIndex));
  let currentSegmentProgress = 0;
  let isPlaying = $state(false);
  let isFirstPlay = true;
  let showOptions = $state(false);
  let boundaryCheckTimeout: ReturnType<typeof setTimeout>;
  let saveTimeout: ReturnType<typeof setTimeout>;

  let lastClickTime = 0;
  const DOUBLE_CLICK_THRESHOLD = 300;

  function handleFeedClick() {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
      handleDoubleClick();
    } else {
      togglePlayback();
    }
    lastClickTime = currentTime;
  }

  function handleDoubleClick() {
    // Cycle backgrounds
    const currentIndex = videoSources.findIndex(
      (v) => v.url === $backgroundUrl,
    );
    const nextIndex = (currentIndex + 1) % videoSources.length;
    backgroundUrl.set(videoSources[nextIndex].url);
  }

  function handleSwiperInit(e: CustomEvent) {
    const [swiper] = e.detail;
    swiperInstance = swiper;
    // Ensure we are actually at the initial slide before starting speech
    // Swiper might report activeIndex 0 briefly before moving to initial-slide
    if (swiper.activeIndex !== initialIndex) {
      swiper.slideTo(initialIndex, 0);
    }
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

  function saveProgress(immediate: boolean = false) {
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
    highlightStartIndex = undefined;

    // Determine start index:
    // If it's the very first play and we are on the initial index, use initialProgress.
    // Otherwise, start from 0.
    let startIndex = 0;
    if (isFirstPlay && activeIndex === initialIndex) {
      startIndex = initialProgress;
      isFirstPlay = false;
    }

    currentCharIndex = startIndex;
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
        currentCharIndex = text.length;
        currentSegmentProgress = text.length;
        highlightEndIndex = undefined;
        highlightStartIndex = undefined;
        saveProgress(true); // Immediate save on completion

        if ($autoScroll && swiperInstance && !swiperInstance.isEnd) {
          swiperInstance.slideNext();
        }
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
      currentCharIndex = segments[swiperInstance.realIndex].length;
      currentSegmentProgress = segments[swiperInstance.realIndex].length;
      highlightEndIndex = undefined;
      highlightStartIndex = undefined;
      saveProgress(true); // Immediate save on completion

      if ($autoScroll && swiperInstance && !swiperInstance.isEnd) {
        swiperInstance.slideNext();
      }
      return;
    }

    const currentSentence = queue[0];
    const remaining = queue.slice(1);

    // Update Highlight: highlight the whole sentence
    currentCharIndex = currentSentence.start;
    highlightEndIndex = currentSentence.end;
    highlightStartIndex = currentSentence.start;
    currentSegmentProgress = currentSentence.start;

    // Calculate offset if we are resuming mid-sentence
    // If originalStartIndex is within this sentence, start from there.
    // Else (for subsequent sentences, we don't have an offset
    const offset = Math.max(0, originalStartIndex - currentSentence.start);

    isPlaying = true;

    speakText(
      currentSentence.text,
      (_word, charIndex) => {
        // In dictation, charIndex is relative to the sentence.
        // We need absolute index in the segment.
        const absoluteIndex = currentSentence.start + charIndex;
        currentCharIndex = absoluteIndex;
        currentSegmentProgress = absoluteIndex;
      },
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      togglePlayback();
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
    <!-- Header -->
    <div
      class="absolute top-0 left-0 w-full z-40 p-4 flex items-center justify-between pointer-events-none"
    >
      <a
        href={resolve("/")}
        class="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(30,30,30,0.6)] backdrop-blur-md border border-white/15 hover:bg-white/20 transition duration-200"
      >
        <ChevronLeft class="text-white" size={24} />
      </a>

      <div
        class="px-4 py-2 rounded-full bg-[rgba(30,30,30,0.6)] backdrop-blur-md border border-white/15"
      >
        <span class="text-sm font-medium text-white/90"
          >Short {activeIndex + 1} / {segments.length}</span
        >
      </div>

      <button
        class="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(30,30,30,0.6)] backdrop-blur-md border border-white/15 hover:bg-white/20 transition duration-200"
        onclick={() => (showOptions = true)}
      >
        <MoreHorizontal class="text-white" size={24} />
      </button>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <swiper-container
      direction="vertical"
      slides-per-view={1}
      space-between={0}
      mousewheel={true}
      initial-slide={initialIndex}
      class="mySwiper w-full h-full"
      data-testid="swiper-mock"
      onswiperinit={handleSwiperInit}
      onswiperslidechange={handleSlideChange}
      onclick={handleFeedClick}
      role="region"
      aria-label="Video Feed"
      tabindex="0"
      onkeydown={handleKeydown}
    >
      {#each segments as segment, i (i)}
        <swiper-slide class="w-full h-full" data-testid="swiper-slide-mock">
          {#if Math.abs(i - activeIndex) <= 2}
            <FeedSlide
              {segment}
              isActive={i === activeIndex}
              {isPlaying}
              currentCharIndex={i === activeIndex ? currentCharIndex : -1}
              highlightEndIndex={i === activeIndex
                ? highlightEndIndex
                : undefined}
              highlightStartIndex={i === activeIndex
                ? highlightStartIndex
                : undefined}
              videoSource={$backgroundUrl ||
                videoSources[i % videoSources.length].url}
              textScale={$textScale}
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

  <!-- Footer -->
  <div
    class="absolute bottom-0 left-0 w-full z-40 p-4 pointer-events-none flex flex-col items-center"
  >
    <!-- Mute Button (Left Aligned) -->
    <div class="w-full flex justify-start pb-4 pl-4">
      <button
        class="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition duration-200 text-black bg-[#00ff88]"
        onclick={() => isMuted.update((v) => !v)}
      >
        {#if $isMuted}
          <VolumeX size={20} />
        {:else}
          <Volume2 size={20} />
        {/if}
      </button>
    </div>

    <!-- Swipe Indicator -->
    {#if activeIndex === 0}
      <div class="flex flex-col items-center animate-bounce space-y-1 mb-8">
        <ChevronUp class="text-[#00FF66]" size={32} strokeWidth={3} />
        <span
          class="text-xs font-medium text-white/90 tracking-wide uppercase shadow-black drop-shadow-sm"
          >Swipe up to continue</span
        >
      </div>
    {/if}
  </div>

  <!-- Options Sheet -->
  {#if showOptions}
    <ReadingOptionsSheet onClose={() => (showOptions = false)} />
  {/if}
</div>
