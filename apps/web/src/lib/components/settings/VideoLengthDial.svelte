<script lang="ts">
  let { value = $bindable(60) } = $props();

  const options = [60, 90, 180, 300];

  function getRotation(val: number) {
    switch (val) {
      case 60:
        return -135;
      case 90:
        return -45;
      case 180:
        return 45;
      case 300:
        return 135;
      default:
        return -135;
    }
  }

  function getLabel(opt: number) {
    if (opt < 120) return opt + "s";
    return opt / 60 + "m";
  }

  let rotation = $derived(getRotation(value));

  function selectValue(val: number) {
    value = val;
  }
</script>

<div class="glass-panel rounded-2xl p-6 relative overflow-hidden group">
  <div class="absolute top-0 right-0 p-4 opacity-50">
    <span class="material-symbols-outlined text-brand-secondary">timelapse</span
    >
  </div>
  <h3 class="font-bold text-lg mb-6 text-foreground">Video Length</h3>
  <div class="flex flex-col items-center justify-center relative py-2">
    <!-- Dial Container -->
    <div
      class="w-48 h-48 rounded-full bg-brand-surface-dark relative flex items-center justify-center shadow-inner border border-brand-primary/10"
    >
      <!-- Gradient Arc -->
      <div
        class="absolute inset-0 rounded-full opacity-80 transition-transform duration-500 ease-out"
        style="background: conic-gradient(from 180deg at 50% 50%, #00bfff 0deg, var(--brand-surface-dark) 240deg, var(--brand-surface-dark) 360deg); transform: rotate({rotation}deg);"
      ></div>

      <!-- Inner Circle (Mask) -->
      <div
        class="absolute inset-4 bg-brand-surface rounded-full flex flex-col items-center justify-center z-10 border border-brand-primary/10"
      >
        <span class="text-4xl font-black text-brand-secondary tracking-tighter">
          {getLabel(value)}
        </span>
        <span
          class="text-[10px] text-brand-text-muted uppercase tracking-widest mt-1"
          >Duration</span
        >
      </div>

      <!-- Marker (Tick) -->
      <div
        class="absolute inset-0 z-20 transition-transform duration-500 ease-out"
        style="transform: rotate({rotation}deg);"
      >
        <div
          class="w-1 h-2 bg-brand-secondary absolute top-2 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_8px_#00bfff]"
        ></div>
      </div>
    </div>

    <!-- Labels -->
    <div
      class="w-full max-w-[200px] mt-6 flex justify-between text-xs text-brand-text-muted font-medium px-2"
    >
      {#each options as opt (opt)}
        <button
          class="focus:outline-none transition-colors duration-200 {value ===
          opt
            ? 'text-brand-secondary font-bold'
            : 'hover:text-foreground'}"
          onclick={() => selectValue(opt)}
        >
          {getLabel(opt)}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .glass-panel {
    background: var(--brand-surface);
    opacity: 0.8;
    backdrop-filter: blur(12px);
    border: 1px solid var(--brand-primary);
    border-color: rgba(0, 255, 136, 0.1);
  }
</style>
