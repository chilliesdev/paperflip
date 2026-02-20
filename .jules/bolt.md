## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-06-05 - Frequent Component Remounting in Virtualized Lists

**Learning:** The manual virtualization pattern (`{#if Math.abs(i - activeIndex) <= 2}`) causes frequent unmounting and remounting of `FeedSlide` components as the user swipes. This means any expensive initialization logic in the child component (like regex parsing text into words) runs repeatedly for the same content.
**Action:** Lift expensive computations out of the virtualized child component and into the parent (`Feed.svelte`) or a store. Pass pre-calculated data as props to ensure child mounting is cheap.

## 2025-05-31 - String Concatenation vs Array Join in Segmenter

**Learning:** `segmentText` was using `currentChunk += sentence` inside a loop, creating O(N^2) string copying overhead. While `MAX_SEGMENT_LENGTH` limited the damage, this pattern is inefficient and can cause GC pressure.
**Action:** Replaced string concatenation with array accumulation (`parts.push(sentence)` then `parts.join('')`). This is O(N) and standard practice. Also optimized the length check to use integer arithmetic instead of temporary string allocation.

## 2025-05-30 - Non-blocking Video Asset Loading

**Learning:** Blocking the application initialization (`await Promise.all(...)`) for large assets like video blobs degrades LCP and TTI significantly. However, switching to non-blocking loading introduces a race condition where components might mount before assets are ready. If components reactively update their source when the asset loads, it can cause playback interruptions (glitches/reloads).
**Action:** Use non-blocking promises for asset loading in `+layout.svelte`. In consuming components (`FeedSlide.svelte`), use `$derived.by` with `untrack()` to read the asset store. This allows the component to use the asset if available at mount (or when other dependencies like `videoSource` change), but ignore subsequent store updates, effectively "locking" the resource for the component's lifecycle to ensure stable playback.

