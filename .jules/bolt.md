## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-05-31 - String Concatenation vs Array Join in Segmenter

**Learning:** `segmentText` was using `currentChunk += sentence` inside a loop, creating O(N^2) string copying overhead. While `MAX_SEGMENT_LENGTH` limited the damage, this pattern is inefficient and can cause GC pressure.
**Action:** Replaced string concatenation with array accumulation (`parts.push(sentence)` then `parts.join('')`). This is O(N) and standard practice. Also optimized the length check to use integer arithmetic instead of temporary string allocation.
