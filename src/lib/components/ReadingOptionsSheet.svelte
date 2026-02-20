<script lang="ts">
  import { playbackRate, autoScroll } from "$lib/stores/audio";
  import { Gauge, ArrowUp } from "lucide-svelte";

  let { onClose } = $props();

  function handleBackdropClick() {
    onClose();
  }

  function setRate(rate: number) {
    playbackRate.set(rate);
  }

  function toggleAutoScroll() {
    autoScroll.update(v => !v);
  }
</script>

<div class="fixed inset-0 z-50 flex flex-col justify-end">
  <!-- Backdrop -->
  <button
    type="button"
    class="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity w-full h-full cursor-default border-none p-0 m-0"
    onclick={handleBackdropClick}
    aria-label="Close options"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  ></button>

  <!-- Sheet -->
  <div
    class="relative w-full bg-[#0f0f1e] rounded-t-3xl pb-10 pt-2 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-white/10"
  >
    <!-- Handle -->
    <div
      class="w-full flex justify-center py-4 cursor-pointer"
      onclick={onClose}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
      role="button"
      tabindex="0"
      data-testid="sheet-handle"
    >
      <div class="w-12 h-1.5 bg-white/20 rounded-full"></div>
    </div>

    <div class="px-6 flex flex-col space-y-6 pb-6">

      <!-- Adjust Speed -->
      <div class="flex flex-col space-y-4">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 rounded-full bg-brand-surface border border-white/10 flex items-center justify-center shrink-0 text-brand-secondary">
             <Gauge size={24} />
          </div>
          <span class="text-white font-semibold text-lg">Adjust Speed</span>
        </div>

        <div class="flex items-center justify-between bg-brand-surface/50 rounded-xl p-1 border border-white/5">
          {#each [0.5, 1.0, 1.5, 2.0] as rate}
            <button
              class="flex-1 py-2 rounded-lg text-sm font-medium transition-all { $playbackRate === rate ? 'bg-brand-primary text-brand-bg font-bold shadow-lg scale-105' : 'text-brand-text-muted hover:bg-white/5' }"
              onclick={() => setRate(rate)}
            >
              {rate}x
            </button>
          {/each}
        </div>
      </div>

      <div class="h-px w-full bg-white/5"></div>

      <!-- Auto Scroll -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
           <div class="w-10 h-10 rounded-full bg-brand-surface border border-white/10 flex items-center justify-center shrink-0 text-brand-primary">
             <ArrowUp size={24} />
          </div>
          <span class="text-white font-semibold text-lg">Auto Scroll</span>
        </div>

        <!-- Toggle Switch -->
        <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-black"
            class:bg-brand-primary={$autoScroll}
            class:bg-gray-700={!$autoScroll}
            onclick={toggleAutoScroll}
            role="switch"
            aria-checked={$autoScroll}
            aria-label="Toggle auto scroll"
        >
            <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                class:translate-x-6={$autoScroll}
                class:translate-x-1={!$autoScroll}
            ></span>
        </button>
      </div>

      <div class="pt-2 text-center">
        <p class="text-xs text-brand-text-muted">Reading settings apply to all documents</p>
      </div>

    </div>
  </div>
</div>
