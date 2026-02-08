<script lang="ts">
  import { onMount } from "svelte";
  import { getDb, upsertDocument } from "$lib/database";
  import { segmentText } from "$lib/segmenter";
  import PdfUploader from "$lib/components/PdfUploader.svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let isLoading: boolean = false;

  async function handlePdfParsed({
    text,
    filename,
  }: {
    text: string;
    filename: string;
  }) {
    isLoading = true;
    try {
      const newSegmentedData = segmentText(text);

      await getDb();
      await upsertDocument(filename, newSegmentedData);
      console.log(
        "Document and segments stored/updated in RxDB with ID:",
        filename,
      );

      // Navigate to the feed page
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto(`${resolve("/feed")}?id=${encodeURIComponent(filename)}`);
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process PDF. Please try again.");
    } finally {
      isLoading = false;
    }
  }

  function handlePdfError({ error }: { error: string }) {
    console.error("PDF Upload Error:", error);
    alert(`Error: ${error}`);
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

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
  {#if isLoading}
    <p class="text-xl">Loading and processing PDF...</p>
  {:else}
    <h1 class="text-3xl font-bold text-gray-800 mb-6">PaperFlip</h1>
    <div class="p-8 bg-white rounded-lg shadow-md w-full max-w-2xl">
      <h2 class="text-xl font-semibold text-gray-700 mb-4 text-center">
        Upload a PDF to get started
      </h2>
      <PdfUploader
        onPdfParsed={handlePdfParsed}
        onPdfError={handlePdfError}
        onLoadDocument={handleLoadDocument}
      />
    </div>
  {/if}
</div>
