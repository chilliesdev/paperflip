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
  // import Hammer from 'hammerjs'; // Removed static import to fix SSR error

  // Import Swiper styles
  import "swiper/css";
  import "swiper/css/mousewheel";

  export let segments: string[] = [];

  const videoSources = [
    "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
    "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-2.mp4",
    // Add more video paths here
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let swiperInstance: any;
  let currentWord: string = "";
  let currentVideoIndex: number = 0;
  let videoElement: HTMLVideoElement;

  // Non-reactive declaration for currentVideoSrc since index is static for now
  const currentVideoSrc = videoSources[currentVideoIndex];

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
    initializeTTS();
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
      if (isPaused()) {
        resumeTTS();
        el?.play();
      } else {
        pauseTTS();
        el?.pause();
      }
    } else {
      // If not speaking (and not paused), it might be stopped or not started.
      // We can try to resume if it was just paused but isSpeaking returned false (unlikely for pause),
      // or maybe restart?
      // For now, let's just try resume/play which covers the 'paused' case if isSpeaking is false (browsers vary).
      resumeTTS();
      el?.play();
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
      on:click={togglePlayback}
    >
      {#each segments as segment, i (i)}
        <SwiperSlide
          class="flex items-center justify-center p-4 relative bg-transparent"
        >
          <div
            class="text-center text-2xl text-white z-10 p-4 bg-black bg-opacity-50 rounded"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html getHighlightedText(segment, currentWord)}
          </div>
        </SwiperSlide>
      {/each}
    </Swiper>
  {:else}
    <p>Upload a PDF to see the feed!</p>
  {/if}
</div>
