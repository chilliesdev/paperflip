<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { resolve } from "$app/paths";
  import { getDocument, getDb, resegmentDocument } from "$lib/database";
  import Feed from "$lib/components/Feed.svelte";
  import { autoResume, videoLength } from "$lib/stores/settings";
  import { isHydrated } from "$lib/stores/sync";
  import { get } from "svelte/store";

  let doc: any = $state(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  let segmentedData = $derived(doc ? doc.segments : []);
  let startSegmentIndex: number = $state(0);
  let startSegmentProgress: number = $state(0);
  let currentDocumentId: string = $state("");
  let isLoading: boolean = $state(true);
  let isResegmenting: boolean = $state(false);
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

      // Wait for hydration if not already hydrated
      if (!get(isHydrated)) {
        await new Promise<void>((resolve) => {
          const unsubscribe = isHydrated.subscribe((hydrated) => {
            if (hydrated) {
              unsubscribe();
              resolve();
            }
          });
        });
      }

      doc = await getDocument(documentId);
      if (doc) {
        if (get(autoResume)) {
          startSegmentIndex = doc.currentSegmentIndex || 0;
          startSegmentProgress = doc.currentSegmentProgress || 0;
        } else {
          startSegmentIndex = 0;
          startSegmentProgress = 0;
        }
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

  // Reactive re-segmentation effect
  $effect(() => {
    const currentVideoLength = $videoLength;
    if (
      doc &&
      doc.fullText &&
      doc.videoLengthAtSegmentation !== currentVideoLength &&
      !isResegmenting
    ) {
      console.log(
        `Re-segmenting document from ${doc.videoLengthAtSegmentation}s to ${currentVideoLength}s`,
      );
      isResegmenting = true;
      resegmentDocument(currentDocumentId, currentVideoLength)
        .then((newDoc) => {
          if (newDoc) {
            doc = newDoc;
            if (get(autoResume)) {
              startSegmentIndex = newDoc.currentSegmentIndex || 0;
              startSegmentProgress = newDoc.currentSegmentProgress || 0;
            }
          }
          isResegmenting = false;
        })
        .catch((e) => {
          console.error("Resegmentation failed:", e);
          isResegmenting = false;
        });
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
      {#key doc.videoLengthAtSegmentation}
        <Feed
          segments={segmentedData}
          initialIndex={startSegmentIndex}
          initialProgress={startSegmentProgress}
          documentId={currentDocumentId}
        />
      {/key}
      {#if isResegmenting}
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300"
        >
          <div
            class="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"
          ></div>
          <p class="text-white font-bold text-lg tracking-wide uppercase">
            Resegmenting...
          </p>
          <p class="text-brand-text-muted text-sm mt-2">
            Adjusting for {get(videoLength)}s video length
          </p>
        </div>
      {/if}
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
