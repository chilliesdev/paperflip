<script lang="ts">
  import { onMount } from "svelte";
  import { getDb, upsertDocument } from "$lib/database";
  import { segmentText } from "$lib/segmenter";
  import PdfUploader from "$lib/components/PdfUploader.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let isLoading = $state(false);
  let errorMessage: string | null = $state(null);

  async function handlePdfParsed({
    text,
    filename,
  }: {
    text: string;
    filename: string;
  }) {
    isLoading = true;
    errorMessage = null; // Clear any previous errors
    try {
      console.log("Segmenting text...");
      const newSegmentedData = segmentText(text);
      console.log(`Text segmented into ${newSegmentedData.length} segments`);

      if (newSegmentedData.length === 0) {
        console.warn("No text segments found in PDF");
      }

      console.log("Getting database...");
      await getDb();
      console.log("Upserting document...");
      await upsertDocument(filename, newSegmentedData);
      console.log(
        "Document and segments stored/updated in RxDB with ID:",
        filename,
      );

      const feedUrl = `${resolve("/feed")}?id=${encodeURIComponent(filename)}`;
      console.log("Navigating to:", feedUrl);
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto(feedUrl);
    } catch (error) {
      console.error("Error processing PDF:", error);
      const msg =
        error instanceof Error ? error.message : JSON.stringify(error);
      errorMessage = `Failed to process PDF: ${msg}`;
    } finally {
      isLoading = false;
    }
  }

  function handlePdfError({ error }: { error: string }) {
    console.error("PDF Upload Error:", error);
    errorMessage = `Error: ${error}`;
    isLoading = false;
  }

  async function handleLoadDocument({ documentId }: { documentId: string }) {
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`${resolve("/feed")}?id=${encodeURIComponent(documentId)}`);
  }

  onMount(async () => {
    await getDb();
  });
</script>

<svelte:head>
  <title>PaperFlip - PDF to Immersive Story</title>
</svelte:head>

<div
  class="max-w-md mx-auto min-h-screen bg-brand-bg relative flex flex-col overflow-hidden pb-24 text-white font-display"
>
  {#if errorMessage}
    <ErrorMessage
      message={errorMessage}
      onDismiss={() => {
        errorMessage = null;
      }}
    />
  {/if}

  {#if isLoading}
    <!-- Loading state overlay -->
    <div class="flex items-center justify-center flex-grow text-white">
      <p class="text-xl animate-pulse">Processing PDF...</p>
    </div>
  {:else}
    <PdfUploader
      onPdfParsed={handlePdfParsed}
      onPdfError={handlePdfError}
      onLoadDocument={handleLoadDocument}
    />
  {/if}

  <BottomNavigation activeTab="home" />
</div>
