<script lang="ts">
  import { onMount } from "svelte";
  import { getRecentUploads } from "$lib/database";

  // Define event handlers as props for Svelte 5 idiomatic event handling
  export let onPdfParsed: (event: {
    text: string;
    filename: string;
  }) => void = () => {};
  export let onPdfError: (event: { error: string }) => void = () => {};
  export let onLoadDocument: (event: { documentId: string }) => void = () => {};

  let isLoading = false;
  let pdfjsLib: typeof import("pdfjs-dist") | null = null;
  let debugStatus = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentUploads: any[] = []; // Using any to avoid complex type setup for now, or define interface

  async function loadRecentUploads() {
    try {
      const uploads = await getRecentUploads(5);
      recentUploads = uploads;
    } catch (error) {
      console.error("Failed to load recent uploads:", error);
    }
  }

  onMount(async () => {
    try {
      debugStatus = "Loading PDF.js...";
      const pdfjs = await import("pdfjs-dist");
      pdfjsLib = pdfjs;

      // Set worker source
      // Using a specific version to avoid mismatches
      const workerSrc = `/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      debugStatus = "Ready";
      console.log("PDF.js loaded", pdfjs.version);

      await loadRecentUploads();
    } catch (e: unknown) {
      console.error("Failed to load PDF.js", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      debugStatus = "Error loading PDF.js: " + errorMessage;
    }
  });

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    console.log("handleFileUpload called", { file, pdfjsLib, isLoading });

    if (!file) {
      return;
    }

    if (!pdfjsLib) {
      alert("PDF.js not loaded yet. " + debugStatus);
      return;
    }

    isLoading = true;
    debugStatus = "Processing...";

    try {
      console.log("Reading file...");
      const arrayBuffer = await file.arrayBuffer();
      console.log("Parsing PDF...");
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;

      let textContent = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
      }

      // Call the prop so parent can handle segmentation and storage
      onPdfParsed({ text: textContent, filename: file.name });
      debugStatus = "Done";
    } catch (error: unknown) {
      console.error("Error parsing or storing PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugStatus = "Error: " + errorMessage;
      onPdfError({
        error: "Failed to process PDF: " + errorMessage,
      });
    } finally {
      isLoading = false;
    }
  }

  function handleRecentClick(docId: string) {
    onLoadDocument({ documentId: docId });
  }

  function formatDate(timestamp: number) {
    if (!timestamp) return "";
    return (
      new Date(timestamp).toLocaleDateString() +
      " " +
      new Date(timestamp).toLocaleTimeString()
    );
  }
</script>

<div class="flex flex-col justify-center items-center p-4">
  <label
    for="file-upload"
    class="inline-block px-4 py-2 cursor-pointer bg-[#4A90E2] text-white rounded font-bold text-center transition-colors duration-300 hover:bg-[#357ABD]"
  >
    {isLoading ? "Parsing..." : "Upload PDF"}
  </label>
  <input
    id="file-upload"
    type="file"
    accept=".pdf"
    on:change={handleFileUpload}
    disabled={isLoading || !pdfjsLib}
    class="hidden"
  />
  {#if debugStatus && debugStatus !== "Ready"}
    <p class="mt-2 text-xs text-[#666]">{debugStatus}</p>
  {/if}

  {#if recentUploads.length > 0}
    <div class="mt-8 w-full max-w-md">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Recent Uploads</h3>
      <div class="bg-white rounded shadow divide-y">
        {#each recentUploads as doc (doc.documentId)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            on:click={() => handleRecentClick(doc.documentId)}
          >
            <span
              class="font-medium truncate flex-1 mr-2"
              title={doc.documentId}>{doc.documentId}</span
            >
            <span class="text-xs text-gray-500 whitespace-nowrap"
              >{formatDate(doc.createdAt)}</span
            >
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
