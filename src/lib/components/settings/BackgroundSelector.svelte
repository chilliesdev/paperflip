<script lang="ts">
  let { selected = $bindable() } = $props();

  const backgrounds = [
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDgF10K7pouD7MG0K5YctMikezJ5XfImNw9DYPsUR7RFZ-5RFY3q9CI6mP4_DJC8F_Z48Nl-fqAgGUGUnBGKQ8GyDJ8S30tkqqdiACXwlpD6bnlXILCxggTZX3yHKKuhnVD9PKwN7TARWIcKFeca5gJw-FO1gE_6VPnWaw79EOoxNbmR2M9hXtOmr6xzBYy6Qe4H_1dsHo3Dc0cJyOEvJdcK79wFWOfyQs-ajw50B9e_1xviY_Z7Q88v2o-EvbWN_lWcwDUJ57Bfn",
      alt: "Nebula background",
      name: "Nebula",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkHZkdKSjJpO6nVpPIUdwpC-gUZaaBNPNs8ziAehYw9IXATqyVkFgESUKZJ4IprybuEb4MMYq6dZyLgEHSsmjfAl4F_aeYE90_2nKDgYlm9utzLItT6Bd7qBKio3o74es2v9Gl7FW2MhOFqVfYtxYTm0HfeR3dzg-zn3tYF6Q-5CxmKxGqEWld99xvWmInYFVUrzWQf6epqBMZAm2lIQ4i4DzITgsnz8_NHjyMKpdLP5GLhF9aNQgPZV833qBHE-Dqs3PEjOasdCCb",
      alt: "Forest background",
      name: "Forest",
    },
  ];

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
    {#each backgrounds as bg (bg.url)}
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
          src={bg.url}
          alt={bg.alt}
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
