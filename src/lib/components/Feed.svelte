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
  } from "$lib/audio";
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  // Import Swiper styles
  import "swiper/css";
  import "swiper/css/mousewheel";

  export let segments: string[] = [];

  const videoSources = [
    "/videos/bg-video-1.mp4",
    "/videos/bg-video-2.mp4",
    // Add more video paths here
  ];

  let swiperInstance: any;
  let currentWord: string = "";
  let currentVideoIndex: number = 0;
  let videoElement: HTMLVideoElement;
  let hammerManager: any; // Changed type to any

  // Reactive declaration for currentVideoSrc
  $: currentVideoSrc = videoSources[currentVideoIndex];

  function getHighlightedText(text: string, highlightWord: string): string {
    if (!highlightWord) return text;
    const words = text.split(/(\s+)/); // Split by spaces, keeping spaces
    return words
      .map((word) => {
        // Basic sanitization for word comparison
        const cleanedWord = word
          .replace(/[.,!?;:]/g, "")
          .trim()
          .toLowerCase();
        const cleanedHighlightWord = highlightWord
          .replace(/[.,!?;:]/g, "")
          .trim()
          .toLowerCase();
        if (cleanedWord === cleanedHighlightWord) {
          return `<span class="bg-[yellow] text-black px-[2px] rounded-[3px]">${word}</span>`;
        }
        return word;
      })
      .join("");
  }

  function handleSwiperInit(e: CustomEvent) {
    const [swiper] = e.detail;
    swiperInstance = swiper;
    if (segments.length > 0) {
      if (videoElement) videoElement.play();
      speakCurrentSlide();
    }
  }

  function handleSlideChange() {
    if (swiperInstance && segments.length > 0) {
      if (videoElement) videoElement.play();
      speakCurrentSlide();
    }
  }

  function speakCurrentSlide() {
    stopTTS(); // Stop any previous speech
    currentWord = ""; // Reset current word highlight
    const currentSegment = segments[swiperInstance.realIndex];
    if (currentSegment) {
      speakText(currentSegment, (word) => {
        currentWord = word;
      });
    }
  }

  function togglePlayback() {
    // Robustness check: ensure videoElement exists
    const el =
      videoElement || (document.querySelector("video") as HTMLVideoElement);
    if (isSpeaking()) {
      pauseTTS();
      el?.pause();
    } else {
      resumeTTS();
      el?.play();
    }
  }

  function cycleVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
  }

  onMount(async () => {
    initializeTTS();

    // Initialize Hammer.js
    const swiperContainer = document.querySelector(".mySwiper");
    if (swiperContainer) {
      const { default: Hammer } = await import("hammerjs");
      hammerManager = new Hammer(swiperContainer as HTMLElement);

      // Explicitly add a singletap recognizer (Hammer doesn't have it by default usually, it has 'tap')
      // or we can use 'tap' but the code below uses 'singletap'.
      // Let's create a custom recognizer for single tap if needed, or just use 'tap'.
      // However, common pattern is:
      hammerManager.add(new Hammer.Tap({ event: "doubletap", taps: 2 }));
      hammerManager.add(new Hammer.Tap({ event: "singletap" }));

      hammerManager.get("doubletap").recognizeWith("singletap");
      hammerManager.get("singletap").requireFailure("doubletap");

      hammerManager.on("singletap", togglePlayback);
      hammerManager.on("doubletap", cycleVideo);
    }
  });

  onDestroy(() => {
    stopTTS();
    if (hammerManager) {
      hammerManager.destroy();
    }
  });
</script>

<div
  class="h-screen w-screen flex justify-center items-center relative overflow-hidden"
>
  {#if segments.length > 0}
    <video
      bind:this={videoElement}
      class="absolute top-0 left-0 w-full h-full object-cover -z-10"
      src={currentVideoSrc}
      autoplay
      loop
      muted
      playsinline
    ></video>
    <Swiper
      direction="vertical"
      slidesPerView={1}
      spaceBetween={0}
      mousewheel={true}
      modules={[Mousewheel]}
      class="mySwiper w-full h-full"
      on:swiper={handleSwiperInit}
      on:slideChange={handleSlideChange}
    >
      {#each segments as segment, i}
        <SwiperSlide
          class="flex items-center justify-center p-4 relative bg-transparent"
        >
          <div
            class="text-center text-2xl text-white z-10 p-4 bg-black bg-opacity-50 rounded"
          >
            {@html getHighlightedText(segment, currentWord)}
          </div>
        </SwiperSlide>
      {/each}
    </Swiper>
  {:else}
    <p>Upload a PDF to see the feed!</p>
  {/if}
</div>
