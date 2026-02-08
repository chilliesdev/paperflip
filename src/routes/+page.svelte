<script lang="ts">
  import { onMount } from "svelte";
  import { getDb, upsertDocument } from "$lib/database";
  import { segmentText } from "$lib/segmenter";
  import PdfUploader from "$lib/components/PdfUploader.svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  let isLoading = false;

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

<div class="h-screen w-full bg-[#0a0a0a]">
  {#if isLoading}
    <!-- Loading state overlay -->
    <div class="flex items-center justify-center h-full text-white">
      <p class="text-xl animate-pulse">Processing PDF...</p>
    </div>
  {:else}
    <PdfUploader
      onPdfParsed={handlePdfParsed}
      onPdfError={handlePdfError}
      onLoadDocument={handleLoadDocument}
    />
  {/if}
</div>
