<script lang="ts">
  import { loadingStatus } from "$lib/stores/loading";
</script>

<div
  class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
>
  <div
    class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
  ></div>
  <p class="mt-4 text-lg font-medium text-gray-700">{$loadingStatus}</p>
</div>
