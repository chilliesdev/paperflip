<script lang="ts">
  let { searchQuery = $bindable("") } = $props();
</script>

<header class="pt-12 pb-6 px-6">
  <h1 class="text-3xl font-extrabold tracking-tight text-foreground">
    My <span
      class="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
      >Library</span
    >
  </h1>
  <div class="mt-4 relative">
    <span
      class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-brand-text-muted text-lg"
    >
      search
    </span>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search your stories..."
      aria-label="Search your stories"
      class="w-full bg-brand-surface/40 border border-brand-primary/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-brand-text-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
    />
  </div>
</header>
