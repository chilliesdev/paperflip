<script lang="ts">
  let { scale = $bindable(110) } = $props();
</script>

<div class="glass-panel rounded-2xl p-6">
  <div class="flex justify-between items-center mb-2">
    <h3 class="font-bold text-lg">Text Scale</h3>
    <span class="text-xs font-mono text-brand-secondary">{scale}%</span>
  </div>

  <div
    class="h-16 flex items-center justify-center bg-brand-surface-dark/50 rounded-lg mb-4 border border-white/5 overflow-hidden"
  >
    <p
      class="text-white/90 leading-snug text-center px-4 transition-all duration-300 whitespace-nowrap"
      style="font-size: {scale / 100}rem;"
    >
      The quick brown fox jumps over the lazy dog.
    </p>
  </div>

  <div class="flex items-center space-x-3">
    <span class="material-symbols-outlined text-brand-text-muted text-xs"
      >text_fields</span
    >
    <input
      class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
      max="150"
      min="80"
      type="range"
      bind:value={scale}
    />
    <span class="material-symbols-outlined text-white text-lg">text_fields</span
    >
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(26, 26, 46, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Slider Styling */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    margin-top: -8px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }

  /* Firefox */
  input[type="range"]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    border: none;
  }
</style>
