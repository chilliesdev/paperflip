<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { resolve } from "$app/paths";
  import { getDocument, getDb } from "$lib/database";
  import Feed from "$lib/components/Feed.svelte";

  let segmentedData: string[] = [];
  let isLoading: boolean = true;
  let error: string | null = null;

  onMount(async () => {
    const documentId = $page.url.searchParams.get("id");
    if (!documentId) {
      error = "No document ID provided";
      isLoading = false;
      return;
    }

    try {
      await getDb(); // Ensure DB is initialized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = await getDocument(documentId);
      if (doc) {
        segmentedData = doc.segments;
      } else {
        error = "Document not found";
      }
    } catch (e) {
      console.error("Error loading document:", e);
      error = "Failed to load document";
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="min-h-screen relative">
  <a
    href={resolve("/")}
    class="absolute top-8 left-8 z-50 backdrop-blur-xl bg-black/40 text-white px-4 py-2 rounded-full border border-white/20 hover:bg-black/60 transition-all flex items-center"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 mr-2"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
    <span class="text-sm font-medium">Back</span>
  </a>

  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <p class="text-xl">Loading feed...</p>
    </div>
  {:else if error}
    <div
      class="flex flex-col items-center justify-center min-h-screen text-center"
    >
      <p class="text-xl text-red-600 mb-4">{error}</p>
    </div>
  {:else if segmentedData.length > 0}
    <Feed segments={segmentedData} />
  {:else}
    <div
      class="flex flex-col items-center justify-center min-h-screen text-center"
    >
      <p class="text-xl mb-4">No content found for this document.</p>
    </div>
  {/if}
</div>
