<script lang="ts">
  import { resolve } from "$app/paths";

  let { activeTab = "home" }: { activeTab?: "home" | "library" | "settings" } = $props();
</script>

<nav
  class="fixed bottom-0 w-full px-6 pt-2 pb-8 bg-brand-surface-dark/90 backdrop-blur-xl border-t border-white/5 z-20 max-w-md left-1/2 -translate-x-1/2"
>
  <div class="flex items-center justify-between px-10">
    <!-- Home -->
    <a href={resolve("/")} class="flex flex-col items-center space-y-1 group">
      <span
        class="material-symbols-outlined {activeTab === 'home'
          ? 'text-brand-primary fill-1'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        home
      </span>
      <span
        class="text-[10px] font-bold uppercase tracking-wider {activeTab ===
        'home'
          ? 'text-brand-primary'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        Home
      </span>
    </a>

    <!-- Library -->
    <a
      href={resolve("/library")}
      class="flex flex-col items-center space-y-1 group"
    >
      <span
        class="material-symbols-outlined {activeTab === 'library'
          ? 'text-brand-primary fill-1'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        auto_stories
      </span>
      <span
        class="text-[10px] font-bold uppercase tracking-wider {activeTab ===
        'library'
          ? 'text-brand-primary'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        Library
      </span>
    </a>

    <!-- Settings -->
    <a
      href={resolve("/settings")}
      class="flex flex-col items-center space-y-1 group"
    >
      <span
        class="material-symbols-outlined {activeTab === 'settings'
          ? 'text-brand-primary fill-1'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        settings
      </span>
      <span
        class="text-[10px] font-bold uppercase tracking-wider {activeTab ===
        'settings'
          ? 'text-brand-primary'
          : 'text-brand-text-muted group-hover:text-white transition-colors'}"
      >
        Settings
      </span>
    </a>
  </div>
</nav>
