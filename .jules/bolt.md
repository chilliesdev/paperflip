## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-06-03 - String Concatenation vs Array Join in loops

**Learning:** In `src/lib/segmenter.ts`, accumulating large text segments via string concatenation (`+=`) inside a loop was causing measurable performance degradation (~288ms for 661k chars). While modern JS engines optimize this, replacing it with array accumulation and `join('')` reduced processing time to ~109ms (2.6x speedup).
**Action:** Always prefer array `push` + `join` for constructing strings in loops, especially when the number of iterations or the size of strings is variable or potentially large. Also, `/\S/.test(str)` is faster than `str.trim().length > 0` for checking emptiness as it avoids creating temporary strings.
