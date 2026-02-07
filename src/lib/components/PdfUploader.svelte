<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  let isLoading = false;
  let pdfjsLib: typeof import("pdfjs-dist") | null = null;
  let debugStatus = "";

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

      // Dispatch the text so parent can handle segmentation and storage
      dispatch("pdf-parsed", { text: textContent });
      debugStatus = "Done";
    } catch (error: unknown) {
      console.error("Error parsing or storing PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugStatus = "Error: " + errorMessage;
      dispatch("pdf-error", {
        error: "Failed to process PDF: " + errorMessage,
      });
    } finally {
      isLoading = false;
    }
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
</div>
