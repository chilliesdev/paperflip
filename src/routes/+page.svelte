<script lang="ts">
  import { onMount } from "svelte";
  import { getDb, upsertDocument, getDocument } from "$lib/database";
  import { segmentText } from "$lib/segmenter";
  import { v4 as uuidv4 } from "uuid";
  import Feed from "$lib/components/Feed.svelte";
  import PdfUploader from "$lib/components/PdfUploader.svelte";

  let segmentedData: string[] = [];
  let currentDocumentId: string | null = null;
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
      const { text, filename } = event.detail;
      const newSegmentedData = segmentText(text);
      segmentedData = newSegmentedData;

      const db = await getDb();
      currentDocumentId = filename;
      await upsertDocument(currentDocumentId, segmentedData);
      console.log(
        "Document and segments stored/updated in RxDB with ID:",
        currentDocumentId,
      );
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process PDF. Please try again.");
    } finally {
      isLoading = false;
    }
  }

  function handlePdfError({ error }: { error: string }) {
    // Log the error
    console.error("PDF Upload Error:", event.detail.error);
    // Show user friendly alert
    alert(`Error: ${event.detail.error}`);
    // Reset state
    isLoading = false;
  }

  async function handleLoadDocument({ documentId }: { documentId: string }) {
    isLoading = true;
    try {
      const { documentId } = event.detail;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = await getDocument(documentId);
      if (doc) {
        currentDocumentId = doc.documentId;
        segmentedData = doc.segments;
        console.log("Loaded document:", doc.documentId);
      } else {
        alert("Document not found");
      }
    } catch (error) {
      console.error("Error loading document:", error);
      alert("Failed to load document");
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    await getDb();
  });
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
  {#if isLoading}
    <p class="text-xl">Loading and processing PDF...</p>
  {:else if segmentedData.length > 0}
    <Feed segments={segmentedData} />
  {:else}
    <h1 class="text-3xl font-bold text-gray-800 mb-6">PaperFlip</h1>
    <div class="p-8 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">
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
