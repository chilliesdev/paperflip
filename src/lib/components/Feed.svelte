<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Swiper, SwiperSlide } from "swiper/svelte";
  import { Mousewheel } from "swiper";
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

  // Import Swiper styles
  import "swiper/css";
  import "swiper/css/mousewheel";

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

  function handleSlideChange() {
    if (swiperInstance && segments.length > 0) {
      activeIndex = swiperInstance.realIndex;
      speakCurrentSlide();
    }
  }

  function speakCurrentSlide() {
    stopTTS(); // Stop any previous speech
    currentCharIndex = -1;
    const currentSegment = segments[swiperInstance.realIndex];
    if (currentSegment) {
      speakText(currentSegment, (_word, charIndex) => {
        currentCharIndex = charIndex;
      });
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
    initializeTTS();
  });

  onDestroy(() => {
    stopTTS();
  });
</script>

<div
  class="h-screen w-screen flex justify-center items-center relative overflow-hidden bg-black"
>
  {#if segments.length > 0}
    <Swiper
      direction="vertical"
      slidesPerView={1}
      spaceBetween={0}
      mousewheel={true}
      modules={[Mousewheel]}
      class="mySwiper w-full h-full"
      on:swiper={handleSwiperInit}
      on:slideChange={handleSlideChange}
      on:click={togglePlayback}
    >
      {#each segments as segment, i (i)}
        <SwiperSlide class="w-full h-full">
          <FeedSlide
            {segment}
            index={i}
            total={segments.length}
            isActive={i === activeIndex}
            {isPlaying}
            currentCharIndex={i === activeIndex ? currentCharIndex : -1}
            videoSource={videoSources[i % videoSources.length]}
          />
        </SwiperSlide>
      {/each}
    </Swiper>
  {:else}
    <div class="flex flex-col items-center justify-center h-full text-white">
      <p class="text-xl">Upload a PDF to see the feed!</p>
    </div>
  {/if}
</div>
