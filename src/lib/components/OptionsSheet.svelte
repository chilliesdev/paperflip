<script lang="ts">
  let { document, onClose, onDelete, onToggleFavourite } = $props();

  let isFavourite = $derived(document.isFavourite);

  function handleBackdropClick() {
    onClose();
  }

  function handleToggleFavourite() {
    onToggleFavourite(document.documentId);
    onClose();
  }

  function handleDelete() {
    onDelete(document.documentId);
    onClose();
  }
</script>

<div class="fixed inset-0 z-50 flex flex-col justify-end">
  <button
    type="button"
    class="absolute inset-0 bg-brand-bg/60 backdrop-blur-sm transition-opacity w-full h-full cursor-default border-none p-0 m-0"
    onclick={handleBackdropClick}
    aria-label="Close options"
    onkeydown={(e) => e.key === "Escape" && onClose()}
  ></button>
  <div
    class="relative w-full bg-black/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl pb-10 pt-4 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 pointer-events-auto"
  >
    <div class="w-full flex justify-center mb-6">
      <div class="w-12 h-1.5 bg-white/20 rounded-full"></div>
    </div>
    <div class="px-6 flex flex-col space-y-2">
      <button
        class="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group"
        onclick={handleToggleFavourite}
      >
        <div
          class="w-10 h-10 rounded-full bg-brand-surface-dark border border-white/10 flex items-center justify-center shrink-0"
        >
          <span
            class="material-symbols-outlined {isFavourite
              ? 'text-brand-primary'
              : 'text-brand-gradient'} fill-1"
          >
            star
          </span>
        </div>
        <span class="text-white font-semibold text-base">
          {isFavourite ? "Remove from Favourites" : "Set as Favourite"}
        </span>
      </button>
      <button
        class="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-red-500/10 active:bg-red-500/20 transition-colors group"
        onclick={handleDelete}
      >
        <div
          class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0"
        >
          <span class="material-symbols-outlined text-red-500">delete</span>
        </div>
        <span class="text-red-500 font-semibold text-base">Delete Document</span
        >
      </button>
    </div>
  </div>
</div>
