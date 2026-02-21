<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { getRecentUploads } from "$lib/database";
  import {
    Upload,
    Shield,
    Clock,
    BookOpen,
    Home,
    Settings,
    Library,
  } from "lucide-svelte";

  interface RecentUpload {
    id: string;
    name: string;
    progress: number;
    totalPages: number;
    currentPage: number;
    timestamp?: number;
  }

  let { onPdfParsed, onPdfError, onLoadDocument } = $props<{
    onPdfParsed: (event: { text: string; filename: string }) => void;
    onPdfError: (event: { error: string }) => void;
    onLoadDocument: (event: { documentId: string }) => void;
  }>();

  // State
  let isLoading = $state(false);
  let pdfjsLib: typeof import("pdfjs-dist") | null = $state(null);
  let recentUploads: RecentUpload[] = $state([]);
  let debugStatus = $state("");

  async function loadRecentUploads() {
    try {
      const uploads = await getRecentUploads(5);
      // Transform uploads to match UI needs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentUploads = uploads.map((doc: any) => {
        const segments = doc.segments;
        const totalSegments = doc.totalSegments ?? (segments?.length || 0);
        const currentIndex = doc.currentSegmentIndex || 0;
        const currentProgress = doc.currentSegmentProgress || 0;

        let progress = 0;
        if (totalSegments > 0) {
          const segmentLength =
            doc.currentSegmentLength || segments?.[currentIndex]?.length || 1;
          const granularProgress =
            currentIndex + currentProgress / segmentLength;
          progress = Math.round((granularProgress / totalSegments) * 100);
        }

        return {
          id: doc.documentId,
          name: doc.documentId,
          progress: Math.min(progress, 100),
          totalPages: totalSegments,
          currentPage: currentIndex + 1,
          timestamp: doc.timestamp || Date.now(),
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

<!-- Structure based on design -->
<div class="flex flex-col min-h-screen pb-20">
  <!-- Header -->
  <header class="pt-12 pb-8 px-6 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight text-white">
      Paper<span
        class="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary"
        >Flip</span
      >
    </h1>
    <p class="mt-2 text-brand-text-muted font-medium text-sm">
      Transform PDFs into immersive stories
    </p>
  </header>

  <!-- Privacy Badge -->
  <div class="px-6 mb-8">
    <div
      class="bg-brand-surface/40 border border-white/5 rounded-xl p-4 flex items-center space-x-4"
    >
      <div class="bg-brand-primary/10 p-2 rounded-lg">
        <Shield class="text-brand-primary w-5 h-5" />
      </div>
      <div>
        <h3 class="font-bold text-sm leading-tight text-white">
          100% On-Device
        </h3>
        <p class="text-xs text-brand-text-muted mt-0.5">
          No Cloud Uploads • Zero Tracking
        </p>
      </div>
    </div>
  </div>

  <main class="px-6 space-y-8 flex-grow">
    <!-- Upload Area -->
    <div class="relative group cursor-pointer">
      <div
        class="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl blur opacity-10 group-active:opacity-30 transition duration-1000 group-active:duration-200"
      ></div>
      <label
        class="relative bg-brand-surface-dark/60 upload-dashed-border p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all block cursor-pointer"
      >
        <input
          type="file"
          accept=".pdf"
          onchange={handleFileUpload}
          disabled={isLoading || !pdfjsLib}
          class="hidden"
        />
        <div
          class="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-2"
        >
          {#if isLoading}
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"
            ></div>
          {:else}
            <Upload class="text-brand-primary w-8 h-8" />
          {/if}
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white">
            {isLoading ? "Processing..." : "Open PDF"}
          </h2>
          <p class="text-brand-text-muted text-sm">Tap to browse files</p>
        </div>
        <div class="pt-4 flex items-center space-x-2">
          <Clock class="text-brand-primary w-4 h-4" />
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-brand-primary"
            >Instant • Zero Latency</span
          >
        </div>
      </label>
      {#if debugStatus && debugStatus !== "Ready" && !isLoading && debugStatus !== "Done"}
        <p
          class="mt-2 text-xs text-red-400 text-center absolute bottom-[-20px] left-0 right-0"
        >
          {debugStatus}
        </p>
      {/if}
    </div>

    <!-- Recent Stories -->
    <section class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-lg font-bold text-white">Recent Stories</h3>
      </div>
      <div class="space-y-3">
        {#each recentUploads as file, index (file.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="bg-brand-surface/50 border border-white/5 rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-brand-surface/70 transition-colors"
            onclick={() => handleRecentClick(file.id)}
            in:fly={{ y: 20, duration: 300, delay: index * 50 }}
          >
            <!-- Book Cover Placeholder -->
            <div
              class="w-12 h-14 bg-brand-surface-dark rounded flex items-center justify-center overflow-hidden relative shrink-0"
            >
              <div
                class="w-full h-full bg-gradient-to-br from-brand-surface to-brand-surface-dark opacity-50"
              ></div>
              <BookOpen class="absolute text-brand-primary w-5 h-5" />
            </div>

            <div class="flex-grow min-w-0">
              <div class="flex justify-between items-start">
                <h4 class="font-bold text-sm truncate pr-2 text-white">
                  {file.name}
                </h4>
                <span
                  class="text-[10px] text-brand-text-muted font-medium shrink-0"
                  >Recent</span
                >
              </div>
              <p class="text-[11px] text-brand-text-muted mt-1">
                Part {file.currentPage} of {file.totalPages} • {file.progress}%
                watched
              </p>
              <!-- Progress Bar -->
              <div
                class="mt-3 w-full bg-white/5 rounded-full h-1.5 overflow-hidden"
              >
                <div
                  class="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full"
                  style="width: {file.progress}%"
                ></div>
              </div>
            </div>
          </div>
        {/each}
        {#if recentUploads.length === 0}
          <div class="text-center py-8 text-brand-text-muted text-sm">
            No recent stories yet. Upload a PDF to get started!
          </div>
        {/if}
      </div>
    </section>
  </main>

  <!-- Bottom Navigation -->
  <nav
    class="fixed bottom-0 w-full max-w-md px-6 pt-2 pb-8 bg-brand-surface-dark/90 backdrop-blur-xl border-t border-white/5 z-10 left-1/2 -translate-x-1/2"
  >
    <div class="flex items-center justify-between px-6">
      <div class="flex flex-col items-center space-y-1">
        <Home class="text-brand-primary w-6 h-6" />
        <span
          class="text-[10px] font-bold uppercase tracking-wider text-brand-primary"
          >Home</span
        >
      </div>
      <div
        class="flex flex-col items-center space-y-1 text-brand-text-muted opacity-50"
      >
        <Library class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-wider"
          >Library</span
        >
      </div>
      <div
        class="flex flex-col items-center space-y-1 text-brand-text-muted opacity-50"
      >
        <Settings class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-wider"
          >Settings</span
        >
      </div>
    </div>
  </nav>

  <!-- Background Blurs -->
  <div
    class="fixed top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"
  ></div>
  <div
    class="fixed bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"
  ></div>
</div>
