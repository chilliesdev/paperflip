<script lang="ts">
  import { onMount } from "svelte";
  import { getAllDocuments } from "$lib/database";
  import LibraryHeader from "$lib/components/LibraryHeader.svelte";
  import RecentlyViewedCard from "$lib/components/RecentlyViewedCard.svelte";
  import DocumentList from "$lib/components/DocumentList.svelte";
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";

  let documents: any[] = $state([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let viewMode: "list" | "grid" = $state("list");

  const recentDocs = $derived(documents.slice(0, 5));
  const filteredDocs = $derived(
    documents.filter((doc) =>
      doc.documentId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  onMount(async () => {
    try {
      documents = await getAllDocuments();
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>PaperFlip - Library</title>
</svelte:head>

{#if isLoading}
  <LoadingScreen />
{:else}
  <div
    class="max-w-md mx-auto min-h-screen bg-brand-bg relative flex flex-col overflow-hidden pb-10 text-white font-display"
  >
    <LibraryHeader bind:searchQuery />

    <main class="flex-grow flex flex-col space-y-8 pb-24">
      {#if recentDocs.length > 0 && !searchQuery}
        <section>
          <div class="flex items-center justify-between px-6 mb-3">
            <h3 class="text-lg font-bold text-white">Recently Viewed</h3>
            <button
              class="text-xs font-semibold text-brand-primary uppercase tracking-wider hover:text-brand-secondary transition-colors"
            >
              See All
            </button>
          </div>
          <div
            class="flex space-x-4 overflow-x-auto px-6 pb-2 no-scrollbar snap-x scroll-smooth"
          >
            {#each recentDocs as doc (doc.documentId)}
              <RecentlyViewedCard document={doc} />
            {/each}
          </div>
        </section>
      {/if}

      <DocumentList documents={filteredDocs} bind:viewMode />
    </main>

    <BottomNavigation activeTab="library" />

    <!-- Ambient Background Gradients -->
    <div
      class="fixed top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none z-0"
    ></div>
    <div
      class="fixed bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none z-0"
    ></div>
  </div>
{/if}

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
