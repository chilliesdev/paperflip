## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-06-05 - Frequent Component Remounting in Virtualized Lists

**Learning:** The manual virtualization pattern (`{#if Math.abs(i - activeIndex) <= 2}`) causes frequent unmounting and remounting of `FeedSlide` components as the user swipes. This means any expensive initialization logic in the child component (like regex parsing text into words) runs repeatedly for the same content.
**Action:** Lift expensive computations out of the virtualized child component and into the parent (`Feed.svelte`) or a store. Pass pre-calculated data as props to ensure child mounting is cheap.
