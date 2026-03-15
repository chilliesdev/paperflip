<script lang="ts">
  let { value = $bindable(15) } = $props();

  const options = [15, 30, 60, 90];

  function getRotation(val: number) {
    switch (val) {
      case 15:
        return -135;
      case 30:
        return -45;
      case 60:
        return 45;
      case 90:
        return 135;
      default:
        return -135;
    }
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
  <h3 class="font-bold text-lg mb-6">Video Length</h3>
  <div class="flex flex-col items-center justify-center relative py-2">
    <!-- Dial Container -->
    <div
      class="w-48 h-48 rounded-full bg-brand-surface-dark relative flex items-center justify-center shadow-inner border border-white/5"
    >
      <!-- Gradient Arc -->
      <!-- We rotate this to match the filled amount.
           The gradient provided in reference is: conic-gradient(from 180deg at 50% 50%, #00bfff 0deg, #1a1a2e 240deg, #1a1a2e 360deg)
           If we rotate it, the 'start' (blue) moves.
           Actually, to make it fill from start (-135) to current, we need a different approach or just rotate the gradient mask.
           But let's stick to the reference visual for now: rotating the gradient background.
      -->
      <div
        class="absolute inset-0 rounded-full opacity-80 transition-transform duration-500 ease-out"
        style="background: conic-gradient(from 180deg at 50% 50%, #00bfff 0deg, #1a1a2e 240deg, #1a1a2e 360deg); transform: rotate({rotation}deg);"
      ></div>

      <!-- Inner Circle (Mask) -->
      <div
        class="absolute inset-4 bg-brand-surface rounded-full flex flex-col items-center justify-center z-10 border border-white/5"
      >
        <span class="text-4xl font-black text-brand-secondary tracking-tighter">
          {value}<span
            class="text-lg align-top text-brand-text-muted font-normal ml-1"
            >s</span
          >
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
        <!-- The marker is at the top (0deg visual relative to container), so rotating the container moves it -->
        <!-- But wait, 0deg is top.
             If rotation is -135 (top-left), the marker should be there.
             The marker div below is at 'top-2' which is top center.
             So applying rotate(-135deg) to the parent moves it to -135deg. Correct.
        -->
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
            : 'hover:text-white'}"
          onclick={() => selectValue(opt)}
        >
          {opt}s
        </button>
      {/each}
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
