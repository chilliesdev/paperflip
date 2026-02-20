<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { resolve } from "$app/paths";
  import { getDocument, getDb } from "$lib/database";
  import Feed from "$lib/components/Feed.svelte";

  let segmentedData: string[] = $state([]);
  let startSegmentIndex: number = $state(0);
  let startSegmentProgress: number = $state(0);
  let currentDocumentId: string = $state("");
  let isLoading: boolean = $state(true);
  let error: string | null = $state(null);

  onMount(async () => {
    const documentId = $page.url.searchParams.get("id");
    if (!documentId) {
      error = "No document ID provided";
      isLoading = false;
      return;
    }
    currentDocumentId = documentId;

    try {
      await getDb(); // Ensure DB is initialized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = await getDocument(documentId);
      if (doc) {
        segmentedData = doc.segments;
        startSegmentIndex = doc.currentSegmentIndex || 0;
        startSegmentProgress = doc.currentSegmentProgress || 0;
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

<div
  class="h-screen w-full bg-brand-bg flex justify-center items-center overflow-hidden"
>
  <div class="h-full aspect-[9/16] max-w-full bg-black shadow-2xl relative">
    {#if isLoading}
      <div class="flex items-center justify-center h-full">
        <p class="text-white text-xl animate-pulse">Loading feed...</p>
      </div>
    {:else if error}
      <div
        class="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <p class="text-xl text-red-500 mb-4">{error}</p>
        <a href={resolve("/")} class="text-brand-primary underline">Go back</a>
      </div>
    {:else if segmentedData.length > 0}
      <Feed
        segments={segmentedData}
        initialIndex={startSegmentIndex}
        initialProgress={startSegmentProgress}
        documentId={currentDocumentId}
      />
    {:else}
      <div
        class="flex flex-col items-center justify-center h-full text-center p-6"
      >
        <p class="text-white text-xl mb-4">
          No content found for this document.
        </p>
        <a href={resolve("/")} class="text-brand-primary underline">Go back</a>
      </div>
    {/if}
  </div>
</div>
