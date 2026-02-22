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

  const icons = [
    "science",
    "history_edu",
    "psychology",
    "code",
    "article",
    "menu_book",
  ];
  const colors = [
    { text: "text-brand-primary", bg: "bg-brand-primary" },
    { text: "text-brand-secondary", bg: "bg-brand-secondary" },
    { text: "text-purple-400", bg: "bg-purple-400" },
    { text: "text-yellow-400", bg: "bg-yellow-400" },
    { text: "text-pink-400", bg: "bg-pink-400" },
  ];

  const hash = $derived(
    document.documentId
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0),
  );
  const icon = $derived(icons[hash % icons.length]);
  const colorObj = $derived(colors[hash % colors.length]);
</script>

<div
  class="bg-brand-surface border border-white/5 rounded-xl overflow-hidden flex flex-col h-full hover:border-white/10 transition-colors group relative"
>
  <a
    href="{resolve('/feed')}?id={encodeURIComponent(document.documentId)}"
    class="flex flex-col h-full w-full"
  >
    <div class="h-24 bg-brand-surface-dark relative">
      <div
        class="w-full h-full bg-gradient-to-br from-brand-surface-dark to-[#050510] flex items-center justify-center"
      >
        <span
          class="material-symbols-outlined {colorObj.text} opacity-40 text-4xl"
        >
          {icon}
        </span>
      </div>
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

    <div class="p-2 flex-grow flex flex-col justify-between">
      <div>
        <h4 class="font-bold text-xs text-white leading-tight truncate mb-1">
          {document.documentId}
        </h4>
        <p class="text-[9px] text-brand-text-muted truncate">
          {document.totalSegments ?? document.segments?.length ?? 0} Segments • PDF
        </p>
      </div>
      <div class="mt-2">
        <div class="w-full bg-white/5 rounded-full h-0.5 overflow-hidden">
          <div
            class="{colorObj.bg} h-full rounded-full shadow-[0_0_8px_rgba(0,255,136,0.6)]"
            style="width: {progress}%"
          ></div>
        </div>
      </div>
    </div>
  </a>

  <button
    class="absolute top-1 right-1 p-2 rounded-full text-white/50 hover:text-white hover:bg-black/20 z-20 transition-all"
    onclick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onShowOptions?.(document);
    }}
    aria-label="More options"
  >
    <span class="material-symbols-outlined text-lg">more_vert</span>
  </button>
</div>
