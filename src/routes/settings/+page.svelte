<script lang="ts">
  import BottomNavigation from "$lib/components/BottomNavigation.svelte";
</script>

<svelte:head>
  <title>PaperFlip - Settings</title>
</svelte:head>

<div
  class="max-w-md mx-auto min-h-screen bg-brand-bg relative flex flex-col overflow-hidden pb-24 text-white font-display"
>
  <header class="pt-12 pb-6 px-6">
    <h1 class="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
  </header>

  <main class="flex-grow flex flex-col space-y-8 px-6">
    <div class="text-brand-text-muted">
      <p>Settings page coming soon.</p>
    </div>
  </main>

  <BottomNavigation activeTab="settings" />

  <!-- Ambient Background Gradients -->
  <div
    class="fixed top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none z-0"
  ></div>
  <div
    class="fixed bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none z-0"
  ></div>
</div>
