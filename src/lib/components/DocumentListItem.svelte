<script lang="ts">
  import { resolve } from "$app/paths";

  let { document, onShowOptions } = $props();

  const progress = $derived.by(() => {
    const totalSegments =
      document.totalSegments ?? document.segments?.length ?? 0;
    if (totalSegments === 0) return 0;

    const currentIdx = document.currentSegmentIndex || 0;
    const currentProgress = document.currentSegmentProgress || 0;
    const rawLength =
      document.currentSegmentLength ??
      document.segments?.[currentIdx]?.length ??
      0;
    const currentSegmentLength = rawLength || 1;

    // Calculate percentage within current segment
    const segmentPercentage = currentProgress / currentSegmentLength;

    // Calculate total percentage
    return Math.min(
      100,
      Math.round(((currentIdx + segmentPercentage) / totalSegments) * 100),
    );
  });

  // Simple deterministic color/icon selection
  const icons = [
    "science",
    "history_edu",
    "psychology",
    "code",
    "article",
    "menu_book",
  ];
  const colors = [
    "text-brand-primary",
    "text-brand-secondary",
    "text-purple-400",
    "text-yellow-400",
    "text-pink-400",
  ];

  const hash = $derived(
    document.documentId
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0),
  );
  const icon = $derived(icons[hash % icons.length]);
  const colorClass = $derived(colors[hash % colors.length]);
</script>

<div
  class="bg-brand-surface border border-white/5 rounded-xl overflow-hidden flex flex-row h-24 relative hover:border-white/10 transition-colors group"
>
  <a
    href="{resolve('/feed')}?id={encodeURIComponent(document.documentId)}"
    class="flex flex-row flex-grow min-w-0"
  >
    <div class="w-24 bg-brand-surface-dark relative flex-shrink-0">
      <div
        class="w-full h-full bg-gradient-to-br from-brand-surface-dark to-[#050510] flex items-center justify-center"
      >
        <span
          class="material-symbols-outlined {colorClass} opacity-40 text-3xl"
        >
          {icon}
        </span>
      </div>
      <!-- Play overlay -->
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div
          class="w-8 h-8 rounded-full bg-brand-primary/20 backdrop-blur flex items-center justify-center border border-brand-primary/50"
        >
          <span
            class="material-symbols-outlined text-brand-primary text-base fill-1"
            >play_arrow</span
          >
        </div>
      </div>
    </div>

    <div class="p-3 flex-grow flex flex-col justify-center min-w-0">
      <div>
        <h4
          class="font-bold text-sm text-white leading-tight line-clamp-1 mb-1"
        >
          {document.documentId}
        </h4>
        <p class="text-[10px] text-brand-text-muted">
          {document.totalSegments ?? document.segments?.length ?? 0} segments • PDF
        </p>
      </div>
    </div>
  </a>

  <button
    class="shrink-0 p-3 flex items-center justify-center text-brand-text-muted hover:text-white z-10 transition-colors"
    onclick={(e) => {
      e.stopPropagation();
      onShowOptions?.(document);
    }}
    aria-label="More options"
  >
    <span class="material-symbols-outlined">more_vert</span>
  </button>

  <div class="absolute bottom-0 left-0 right-0 pointer-events-none">
    <div class="w-full bg-white/5 h-1">
      <div
        class="{colorClass.replace(
          'text-',
          'bg-',
        )} h-full shadow-[0_0_8px_rgba(0,255,136,0.6)]"
        style="width: {progress}%"
      ></div>
    </div>
  </div>
</div>
