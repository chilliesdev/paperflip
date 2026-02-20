<script lang="ts">
  import DocumentListItem from "./DocumentListItem.svelte";
  import DocumentGridItem from "./DocumentGridItem.svelte";

  let { documents = [], viewMode = $bindable("list") } = $props();
</script>

<section class="px-6 flex-grow">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-white">All Documents</h3>
    <div class="flex space-x-2">
      <button
        class="p-1 rounded hover:bg-white/5 {viewMode === 'list'
          ? 'text-brand-primary'
          : 'text-brand-text-muted'}"
        onclick={() => (viewMode = "list")}
        aria-label="List view"
      >
        <span class="material-symbols-outlined text-lg">view_list</span>
      </button>
      <button
        class="p-1 rounded hover:bg-white/5 {viewMode === 'grid'
          ? 'text-brand-primary'
          : 'text-brand-text-muted'}"
        onclick={() => (viewMode = "grid")}
        aria-label="Grid view"
      >
        <span class="material-symbols-outlined text-lg">grid_view</span>
      </button>
    </div>
  </div>

  {#if documents.length === 0}
    <div class="text-center py-10 text-brand-text-muted">
      No documents found.
    </div>
  {:else if viewMode === "list"}
    <div class="flex flex-col gap-4">
      {#each documents as doc (doc.documentId)}
        <DocumentListItem document={doc} />
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-3">
      {#each documents as doc (doc.documentId)}
        <DocumentGridItem document={doc} />
      {/each}
    </div>
  {/if}
</section>
