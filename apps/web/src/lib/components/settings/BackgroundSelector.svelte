<script lang="ts">
  import { videoSources } from "$lib/constants";

  let { selected = $bindable() } = $props();

  function selectBackground(url: string) {
    selected = url;
  }
</script>

<div class="glass-panel rounded-2xl p-6">
  <div class="flex justify-between items-center mb-4">
    <h3 class="font-bold text-lg">Background</h3>
    <span
      class="text-xs font-bold text-brand-primary uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
    >
      View All
    </span>
  </div>
  <div class="grid grid-cols-3 gap-3">
    {#each videoSources as bg (bg.url)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="aspect-square rounded-xl relative overflow-hidden cursor-pointer group transition-all duration-200 {selected ===
        bg.url
          ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface'
          : 'border border-white/10 opacity-70 hover:opacity-100'}"
        onclick={() => selectBackground(bg.url)}
      >
        {#if selected === bg.url}
          <div
            class="absolute inset-0 bg-brand-primary/20 z-10 transition-opacity"
          ></div>
        {/if}
        <img
          src={bg.previewUrl}
          alt={bg.name}
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 {selected !==
          bg.url
            ? 'grayscale'
            : ''}"
        />
        {#if selected === bg.url}
          <div
            class="absolute bottom-1 right-1 z-20 bg-black/60 rounded-full p-0.5 animate-in fade-in zoom-in duration-200"
          >
            <span
              class="material-symbols-outlined text-brand-primary text-[14px] font-bold"
              >check</span
            >
          </div>
        {/if}
      </div>
    {/each}

    <!-- Add New Placeholder -->
    <div
      class="aspect-square rounded-xl bg-brand-surface-dark border border-white/10 flex items-center justify-center cursor-pointer hover:bg-brand-surface transition-colors group"
    >
      <span
        class="material-symbols-outlined text-brand-text-muted group-hover:text-white transition-colors"
        >add_photo_alternate</span
      >
    </div>
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(26, 26, 46, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
</style>
