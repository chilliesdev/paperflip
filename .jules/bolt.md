## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-06-03 - Performance Cost of Intl.Segmenter Instantiation

**Learning:** Instantiating `Intl.Segmenter` (or other `Intl` objects) is surprisingly expensive (hundreds of microseconds to milliseconds). When called frequently (e.g., in a loop or on every slide transition), this adds up to noticeable jank.
**Action:** Always cache `Intl` instances at the module level if they are used repeatedly with the same configuration. This simple singleton pattern yielded a ~4.3x speedup in sentence splitting.
