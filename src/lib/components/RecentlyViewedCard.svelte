<script lang="ts">
  import { resolve } from "$app/paths";

  let { document } = $props();

  const progress = $derived.by(() => {
    const totalSegments = document.segments?.length || 0;
    if (totalSegments === 0) return 0;

    const currentIdx = document.currentSegmentIndex || 0;
    const currentProgress = document.currentSegmentProgress || 0;
    const currentSegmentLength = document.segments[currentIdx]?.length || 1;

    // Calculate percentage within current segment
    const segmentPercentage = currentProgress / currentSegmentLength;

    // Calculate total percentage
    return Math.min(
      100,
      Math.round(((currentIdx + segmentPercentage) / totalSegments) * 100)
    );
  });

  const currentPart = $derived.by(() => {
    return (document.currentSegmentIndex || 0) + 1;
  });

  const totalParts = $derived.by(() => {
    return document.segments?.length || 0;
  });

  // Icon/Color logic similar to DocumentListItem
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
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  );
  const icon = $derived(icons[hash % icons.length]);
  const colorObj = $derived(colors[hash % colors.length]);
</script>

<a
  href={`${resolve("/feed")}?id=${encodeURIComponent(document.documentId)}`}
  class="snap-start shrink-0 w-36 bg-brand-surface border border-white/5 rounded-xl overflow-hidden group relative hover:border-white/10 transition-colors"
>
  <div class="h-40 bg-brand-surface-dark relative">
    <div
      class="w-full h-full bg-gradient-to-br from-brand-surface-dark to-[#050510] flex items-center justify-center"
    >
      <span class="material-symbols-outlined {colorObj.text} opacity-40 text-5xl">
        {icon}
      </span>
    </div>
    <div
      class="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent opacity-80"
    ></div>
    <div
      class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <div
        class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"
      >
        <span class="material-symbols-outlined text-white text-xl fill-1"
          >play_arrow</span
        >
      </div>
    </div>
  </div>

  <div class="p-3">
    <h4 class="font-bold text-sm truncate text-white mb-1">
      {document.documentId}
    </h4>
    <div class="w-full bg-white/5 rounded-full h-1">
      <div
        class="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full"
        style="width: {progress}%"
      ></div>
    </div>
    <div class="flex justify-between mt-1.5">
      <span class="text-[10px] text-brand-text-muted"
        >Part {currentPart}/{totalParts}</span
      >
      <span class="text-[10px] text-brand-text-muted">{progress}%</span>
    </div>
  </div>
</a>
