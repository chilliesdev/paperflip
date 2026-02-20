<script lang="ts">
  let {
    checked = $bindable(false),
    title = "",
    description = "",
    icon = "",
    disabled = false,
  } = $props();

  let id = $derived(`toggle-${title.replace(/\s+/g, "-").toLowerCase()}`);
</script>

<div
  class="rounded-2xl p-4 flex flex-col justify-between h-32 relative overflow-hidden transition-all duration-300 {checked
    ? 'glass-panel-active'
    : 'glass-panel'}"
>
  {#if checked}
    <div
      class="absolute -right-4 -top-4 w-16 h-16 bg-brand-primary/10 rounded-full blur-xl pointer-events-none"
    ></div>
  {/if}

  <div class="flex justify-between items-start">
    <div
      class="p-2 rounded-lg inline-flex {checked
        ? 'bg-brand-primary/10 text-brand-primary'
        : 'bg-white/5 text-brand-text-muted'}"
    >
      <span class="material-symbols-outlined">{icon}</span>
    </div>

    <!-- Toggle Switch -->
    <div
      class="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in"
    >
      <input
        type="checkbox"
        {id}
        bind:checked
        {disabled}
        class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-brand-surface appearance-none cursor-pointer transition-all duration-300 {checked
          ? 'right-0 border-brand-primary shadow-[0_0_10px_rgba(0,255,136,0.5)]'
          : 'left-0 border-brand-text-muted/50'}"
      />
      <label
        for={id}
        class="toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 {checked
          ? 'bg-brand-primary/30'
          : 'bg-white/10'}"
      ></label>
    </div>
  </div>

  <div>
    <h4
      class="font-bold text-sm transition-colors {checked
        ? 'text-white'
        : 'text-brand-text-muted'}"
    >
      {title}
    </h4>
    <p class="text-[10px] text-brand-text-muted mt-1 leading-tight">
      {description}
    </p>
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(26, 26, 46, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .glass-panel-active {
    background: rgba(26, 26, 46, 0.7);
    border: 1px solid rgba(0, 255, 136, 0.3);
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.1);
  }
  /* Checkbox styling logic moved to inline classes for dynamic values, but key behavior is here */
  .toggle-checkbox:checked {
    right: 0;
    border-color: #00ff88;
  }
  /* Svelte handles binding, so we rely on 'checked' prop for classes mostly */
</style>
