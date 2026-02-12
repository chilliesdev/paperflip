<script lang="ts">
  import { AlertCircle, X } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { onDestroy } from "svelte";

  export let message: string = "";
  export let onClear: () => void = () => {};

  let timer: ReturnType<typeof setTimeout>;

  $: if (message) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onClear, 5000);
  }

  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });
</script>

<div
  transition:fly={{ y: 20, duration: 300 }}
  class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-sm"
>
  <div
    class="bg-destructive text-destructive-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
  >
    <div class="flex-shrink-0">
      <AlertCircle class="w-5 h-5" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium line-clamp-2">{message}</p>
    </div>
    <button
      on:click={onClear}
      class="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
      aria-label="Clear error"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</div>
