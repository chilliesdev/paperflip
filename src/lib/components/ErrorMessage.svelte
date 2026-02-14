<script lang="ts">
  import { AlertCircle, X } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";

  let {
    message,
    duration = 5000,
    onDismiss,
  } = $props<{
    message: string;
    duration?: number;
    onDismiss?: () => void;
  }>();

  let visible = $state(true);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  function dismiss() {
    visible = false;
    if (onDismiss) {
      onDismiss();
    }
  }

  // Reset timer whenever message changes or component mounts
  $effect(() => {
    if (message) {
      visible = true;
      if (timeoutId) clearTimeout(timeoutId);

      if (duration > 0) {
        timeoutId = setTimeout(() => {
          dismiss();
        }, duration);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

{#if visible && message}
  <div
    role="alert"
    aria-live="assertive"
    in:fly={{ y: -20, duration: 300 }}
    out:fade={{ duration: 200 }}
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex w-full max-w-md items-start gap-3 rounded-lg bg-red-50 p-4 shadow-lg ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-900/50"
  >
    <AlertCircle
      class="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400 shrink-0"
    />

    <div class="flex-1">
      <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
      <div class="mt-1 text-sm text-red-700 dark:text-red-300">
        {message}
      </div>
    </div>

    <button
      type="button"
      class="ml-auto -mx-1.5 -my-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none dark:bg-transparent dark:text-red-400 dark:hover:bg-red-800/30"
      onclick={dismiss}
      aria-label="Dismiss"
    >
      <X class="h-5 w-5" />
    </button>
  </div>
{/if}
