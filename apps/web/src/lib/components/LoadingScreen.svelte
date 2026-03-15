<script lang="ts">
  import { loadingStatus } from "$lib/stores/loading";
</script>

<div
  class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg"
>
  <div
    class="h-12 w-12 animate-spin rounded-full border-4 border-brand-surface border-t-brand-primary"
  ></div>
  <p class="mt-4 text-lg font-medium text-brand-text-muted">{$loadingStatus}</p>
</div>
