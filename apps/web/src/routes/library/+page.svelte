<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAllDocuments,
    deleteDocument,
    toggleFavourite,
  } from "$lib/database";
  import LibraryHeader from "$lib/components/LibraryHeader.svelte";
  import FavouriteCard from "$lib/components/FavouriteCard.svelte";
  import DocumentList from "$lib/components/DocumentList.svelte";
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";
  import OptionsSheet from "$lib/components/OptionsSheet.svelte";

  type PaperFlipDocument = {
    documentId: string;
    isFavourite?: boolean;
    [key: string]: unknown;
  };

  let documents: PaperFlipDocument[] = $state([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let viewMode: "list" | "grid" = $state("list");
  let selectedDocument: PaperFlipDocument | null = $state(null);

  const favouriteDocs = $derived(documents.filter((doc) => doc.isFavourite));
  const filteredDocs = $derived(
    documents.filter((doc) =>
      doc.documentId.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
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
      {#if favouriteDocs.length > 0 && !searchQuery}
        <section>
          <div class="flex items-center justify-between px-6 mb-3">
            <h3 class="text-lg font-bold text-white">Favourites</h3>
            <button
              class="text-xs font-semibold text-brand-primary uppercase tracking-wider hover:text-brand-secondary transition-colors"
              onclick={() =>
                document
                  .getElementById("all-documents")
                  ?.scrollIntoView({ behavior: "smooth" })}
            >
              See All
            </button>
          </div>
          <div
            class="flex space-x-4 overflow-x-auto px-6 pb-2 no-scrollbar snap-x scroll-smooth"
          >
            {#each favouriteDocs as doc (doc.documentId)}
              <FavouriteCard document={doc} />
            {/each}
          </div>
        </section>
      {/if}

      <div id="all-documents">
        <DocumentList
          documents={filteredDocs}
          bind:viewMode
          onShowOptions={(doc: PaperFlipDocument) => (selectedDocument = doc)}
        />
      </div>
    </main>

    <BottomNavigation activeTab="library" />

    {#if selectedDocument}
      <OptionsSheet
        document={selectedDocument}
        onClose={() => (selectedDocument = null)}
        onDelete={async (id: string) => {
          await deleteDocument(id);
          documents = documents.filter((d) => d.documentId !== id);
        }}
        onToggleFavourite={async (id: string) => {
          const newStatus = await toggleFavourite(id);
          documents = documents.map((d) =>
            d.documentId === id ? { ...d, isFavourite: newStatus } : d,
          );
        }}
      />
    {/if}

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
