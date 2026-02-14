<script lang="ts">
  import { onMount } from "svelte";
  import { fly, scale } from "svelte/transition";
  import { getRecentUploads } from "$lib/database";
  import { Upload, Shield, FileText, Clock } from "lucide-svelte";

  interface RecentUpload {
    id: string;
    name: string;
    progress: number;
    totalPages: number;
    currentPage: number;
  }

  // Props
  export let onPdfParsed: (event: {
    text: string;
    filename: string;
  }) => void = () => {};
  export let onPdfError: (event: { error: string }) => void = () => {};
  export let onLoadDocument: (event: { documentId: string }) => void = () => {};

  // State
  let isLoading = false;
  let pdfjsLib: typeof import("pdfjs-dist") | null = null;
  let recentUploads: RecentUpload[] = [];
  let debugStatus = "";

  async function loadRecentUploads() {
    try {
      const uploads = await getRecentUploads(5);
      // Transform uploads to match UI needs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentUploads = uploads.map((doc: any) => {
        const segments = doc.segments || [];
        const currentIndex = doc.currentSegmentIndex || 0;
        const currentProgress = doc.currentSegmentProgress || 0;

        let progress = 0;
        if (segments.length > 0) {
          const segmentLength = segments[currentIndex]?.length || 1;
          const granularProgress =
            currentIndex + currentProgress / segmentLength;
          progress = Math.round((granularProgress / segments.length) * 100);
        }

        return {
          id: doc.documentId,
          name: doc.documentId,
          progress: Math.min(progress, 100),
          totalPages: segments.length,
          currentPage: currentIndex + 1,
        };
      });
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
      const workerSrc = `/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      debugStatus = "Ready";
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
    if (!file || !pdfjsLib) return;

    isLoading = true;
    debugStatus = "Processing...";

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;

      // Performance optimization: Use array join instead of string concatenation in loop
      // to avoid O(n^2) memory copying for large PDFs.
      const pageTexts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        const pageText = text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        pageTexts.push(pageText);
      }

      const textContent = pageTexts.join(" ");
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
      // Reset input value to allow re-uploading same file
      target.value = "";
    }
  }

  function handleRecentClick(docId: string) {
    onLoadDocument({ documentId: docId });
  }
</script>

<div
  class="h-full bg-gradient-to-b from-brand-bg to-brand-surface flex flex-col text-white font-sans overflow-hidden relative"
>
  <!-- Header -->
  <div class="px-6 pt-12 pb-6">
    <div
      in:fly={{ y: -20, duration: 500 }}
      class="text-5xl font-black tracking-tight text-white"
    >
      Paper<span class="text-brand-primary">Flip</span>
    </div>
    <p class="text-brand-text-muted mt-2 text-sm">
      Transform PDFs into immersive stories
    </p>
  </div>

  <!-- Privacy Badge -->
  <div
    in:scale={{ start: 0.9, duration: 500, delay: 100 }}
    class="mx-6 mb-8 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/30 backdrop-blur-sm"
  >
    <div class="flex items-center gap-3">
      <Shield class="w-5 h-5 text-brand-primary" />
      <div>
        <p class="text-white text-sm font-semibold">100% On-Device</p>
        <p class="text-brand-text-muted text-xs">
          No Cloud Uploads • Zero Tracking
        </p>
      </div>
    </div>
  </div>

  <!-- Upload Zone -->
  <div in:fly={{ y: 20, duration: 500, delay: 200 }} class="mx-6 mb-8">
    <label
      class="block w-full aspect-[4/3] rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary p-[2px] shadow-2xl shadow-brand-primary/20 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <input
        type="file"
        accept=".pdf"
        on:change={handleFileUpload}
        disabled={isLoading || !pdfjsLib}
        class="hidden"
      />
      <div
        class="w-full h-full rounded-3xl bg-gradient-to-br from-brand-surface to-brand-surface-dark flex flex-col items-center justify-center gap-4 border-2 border-dashed border-brand-primary/30 hover:border-brand-primary/60 transition-colors"
      >
        {#if isLoading}
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center animate-pulse"
          >
            <Clock class="w-10 h-10 text-brand-bg" />
          </div>
          <div class="text-center">
            <p class="text-white text-xl font-bold">Processing...</p>
          </div>
        {:else}
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center"
          >
            <Upload class="w-10 h-10 text-brand-bg" />
          </div>
          <div class="text-center">
            <p class="text-white text-xl font-bold">Open PDF</p>
            <p class="text-brand-text-muted text-sm mt-1">
              Tap to browse files
            </p>
          </div>
          <div class="flex items-center gap-2 text-brand-primary text-xs">
            <Clock class="w-3 h-3" />
            <span>Instant • Zero Latency</span>
          </div>
        {/if}
      </div>
    </label>
    {#if debugStatus && debugStatus !== "Ready" && !isLoading && debugStatus !== "Done"}
      <p class="mt-2 text-xs text-red-400 text-center">{debugStatus}</p>
    {/if}
  </div>

  <!-- Recent Files -->
  <div class="flex-1 px-6 pb-6 overflow-y-auto">
    <h2 class="text-white text-lg font-bold mb-4">Recent</h2>
    <div class="space-y-3">
      {#each recentUploads as file, index (file.id)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          in:fly={{ x: -20, duration: 500, delay: 300 + index * 100 }}
          class="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          on:click={() => handleRecentClick(file.id)}
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center flex-shrink-0"
            >
              <FileText class="w-5 h-5 text-brand-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{file.name}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-brand-text-muted text-xs">
                  Part {file.currentPage} of {file.totalPages}
                </p>
                <span class="text-gray-600">•</span>
                <p class="text-brand-primary text-xs font-medium">
                  {file.progress}% watched
                </p>
              </div>
              <!-- Progress Bar -->
              <div class="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                  style="width: {file.progress}%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      {/each}
      {#if recentUploads.length === 0}
        <p class="text-gray-500 text-sm text-center py-4">
          No recent files found.
        </p>
      {/if}
    </div>
  </div>
</div>
