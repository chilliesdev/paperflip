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
    isSpeaking,
    isPaused,
  } from "$lib/audio";
  import { videoSources } from "$lib/constants";
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  // Import Swiper styles
  import "swiper/css";
  import "swiper/css/mousewheel";

  export let segments: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swiperInstance: any;
  let currentWord: string = "";
  let currentCharIndex: number = -1;

  function getSubtitleDisplay(text: string, charIndex: number): string {
    if (charIndex === -1) {
      // Show first 3 words by default if not started
      return text.trim().split(/\s+/).slice(0, 3).join(" ");
    }

    // 1. Find all words and their positions
    const words: { word: string; start: number; end: number }[] = [];
    const wordRegex = /\S+/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    if (words.length === 0) return "";

    // 2. Find current word index
    let currentWordIdx = words.findIndex(
      (w) => charIndex >= w.start && charIndex < w.end,
    );
    if (currentWordIdx === -1) {
      // Fallback: find the closest word
      currentWordIdx = words.findIndex((w) => charIndex < w.start);
      if (currentWordIdx === -1) currentWordIdx = words.length - 1;
    }

    // 3. Static chunking (TikTok style): 3 words at a time
    const chunkSize = 3;
    const groupIdx = Math.floor(currentWordIdx / chunkSize);
    const startIdx = groupIdx * chunkSize;
    const endIdx = Math.min(startIdx + chunkSize, words.length);

    const windowWords = words.slice(startIdx, endIdx);

    return windowWords
      .map((w, idx) => {
        const isCurrent = startIdx + idx === currentWordIdx;
        if (isCurrent) {
          return `<span class="bg-[yellow] text-black px-[2px] rounded-[3px]">${w.word}</span>`;
        }
        return w.word;
      })
      .join(" ");
  }

  function getActiveVideoElement(): HTMLVideoElement | null {
    if (!swiperInstance) return null;
    const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
    return activeSlide ? activeSlide.querySelector("video") : null;
  }

  function handleSwiperInit(e: CustomEvent) {
    const [swiper] = e.detail;
    swiperInstance = swiper;
    initializeTTS();
    if (segments.length > 0) {
      // Play the first video
      const video = getActiveVideoElement();
      if (video) video.play();
      speakCurrentSlide();
    }
  }

  function handleSlideChange() {
    if (swiperInstance && segments.length > 0) {
      // Pause previous video
      if (typeof swiperInstance.previousIndex === "number") {
        const prevSlide = swiperInstance.slides[swiperInstance.previousIndex];
        const prevVideo = prevSlide?.querySelector("video");
        if (prevVideo) {
          prevVideo.pause();
          prevVideo.currentTime = 0;
        }
      }

      // Play current video
      const video = getActiveVideoElement();
      if (video) video.play();

      speakCurrentSlide();
    }
  }

  function speakCurrentSlide() {
    stopTTS(); // Stop any previous speech
    currentWord = ""; // Reset current word highlight
    currentCharIndex = -1;
    const currentSegment = segments[swiperInstance.realIndex];
    if (currentSegment) {
      speakText(currentSegment, (word, charIndex) => {
        currentWord = word;
        currentCharIndex = charIndex;
      });
    }
  }

  function togglePlayback() {
    const video = getActiveVideoElement();

    if (isSpeaking()) {
      if (isPaused()) {
        resumeTTS();
        video?.play();
      } else {
        pauseTTS();
        video?.pause();
      }
    } else {
      resumeTTS();
      video?.play();
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
  class="h-screen w-screen flex justify-center items-center relative overflow-hidden"
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
        <SwiperSlide
          class="flex items-center justify-center p-4 relative bg-black"
        >
          <video
            class="absolute top-0 left-0 w-full h-full object-cover"
            src={videoSources[i % videoSources.length]}
            loop
            muted
            playsinline
          ></video>
          <div
            class="text-center text-2xl text-white z-10 p-4 bg-black bg-opacity-50 rounded"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html getSubtitleDisplay(segment, currentCharIndex)}
          </div>
        </SwiperSlide>
      {/each}
    </Swiper>
  {:else}
    <p>Upload a PDF to see the feed!</p>
  {/if}
</div>
