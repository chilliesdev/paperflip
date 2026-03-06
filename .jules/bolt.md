## 2025-05-30 - Virtualization of Swiper Slides in Svelte

**Learning:** In Svelte + Swiper (Web Component), using a standard `{#each}` loop renders all slides into the DOM. This is catastrophic for performance when slides contain heavy media like `<video>`. Swiper's `virtual` module is complex to integrate with `swiper-container` and custom render logic.
**Action:** Use a simple conditional render `{#if Math.abs(i - activeIndex) <= 2}` inside the `swiper-slide` to unmount content of off-screen slides while keeping the `swiper-slide` element as a placeholder. This provides effective "virtualization" with minimal code (< 10 lines) and massive memory savings.

## 2025-05-31 - String Concatenation vs Array Join in Segmenter

**Learning:** `segmentText` was using `currentChunk += sentence` inside a loop, creating O(N^2) string copying overhead. While `MAX_SEGMENT_LENGTH` limited the damage, this pattern is inefficient and can cause GC pressure.
**Action:** Replaced string concatenation with array accumulation (`parts.push(sentence)` then `parts.join('')`). This is O(N) and standard practice. Also optimized the length check to use integer arithmetic instead of temporary string allocation.

## 2025-05-30 - Non-blocking Video Asset Loading

**Learning:** Blocking the application initialization (`await Promise.all(...)`) for large assets like video blobs degrades LCP and TTI significantly. However, switching to non-blocking loading introduces a race condition where components might mount before assets are ready. If components reactively update their source when the asset loads, it can cause playback interruptions (glitches/reloads).
**Action:** Use non-blocking promises for asset loading in `+layout.svelte`. In consuming components (`FeedSlide.svelte`), use `$derived.by` with `untrack()` to read the asset store. This allows the component to use the asset if available at mount (or when other dependencies like `videoSource` change), but ignore subsequent store updates, effectively "locking" the resource for the component's lifecycle to ensure stable playback.

## 2023-10-27 - Sequential vs Concurrent Promise Execution for Parsing
**Learning:** In `PdfUploader.svelte`, looping sequentially through `pdf.numPages` and sequentially awaiting `page = await pdf.getPage(i)` followed by `text = await page.getTextContent()` created a bottleneck where total extraction time equaled the sum of loading times for each individual page. I/O boundaries should be managed concurrently to optimize latency.
**Action:** Create an array of Promises mapping to each PDF page, invoke `.getPage()` and `.getTextContent()` in a `.then()` chain for each page concurrently, and finally `await Promise.all(pagePromises)`. This maximizes I/O throughput and changes processing time from O(n) relative sum of pages, to O(max(page_parse_time)).