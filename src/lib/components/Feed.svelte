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
  import { videoSources } from "$lib/constants";
  import FeedSlide from "$lib/components/FeedSlide.svelte";
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  export let segments: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swiperInstance: any;
  let currentCharIndex: number = -1;
  let activeIndex = 0;
  let isPlaying = false;

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
      activeIndex = swiper.realIndex;
      speakCurrentSlide();
    }
  }

  function speakCurrentSlide() {
    stopTTS(); // Stop any previous speech
    currentCharIndex = -1;
    const currentSegment = segments[swiperInstance.realIndex];
    if (currentSegment) {
      speakText(
        currentSegment,
        (_word, charIndex) => {
          currentCharIndex = charIndex;
        },
        () => {
          isPlaying = false;
        },
      );
      isPlaying = true;
    }
  }

  function togglePlayback() {
    if (isPlaying) {
      pauseTTS();
      isPlaying = false;
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
      class="mySwiper w-full h-full"
      data-testid="swiper-mock"
      on:swiperinit={handleSwiperInit}
      on:swiperslidechange={handleSlideChange}
      on:click={togglePlayback}
    >
      {#each segments as segment, i (i)}
        <swiper-slide class="w-full h-full" data-testid="swiper-slide-mock">
          <FeedSlide
            {segment}
            index={i}
            isActive={i === activeIndex}
            {isPlaying}
            currentCharIndex={i === activeIndex ? currentCharIndex : -1}
            videoSource={videoSources[i % videoSources.length]}
          />
        </swiper-slide>
      {/each}
    </swiper-container>
  {:else}
    <div class="flex flex-col items-center justify-center h-full text-white">
      <p class="text-xl">Upload a PDF to see the feed!</p>
    </div>
  {/if}
</div>
