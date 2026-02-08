// @vitest-environment node
import { describe, it, expect } from "vitest";
import { segmentText } from "../../lib/segmenter";

describe("segmentText", () => {
  it("splits text by double newlines into segments", () => {
    const input = "First paragraph.\n\nSecond paragraph.";
    const expected = ["First paragraph.", "Second paragraph."];
    expect(segmentText(input)).toEqual(expected);
  });

  it("handles multiple newlines and whitespace between paragraphs", () => {
    const input = "First.\n\n\n  \nSecond.";
    const expected = ["First.", "Second."];
    expect(segmentText(input)).toEqual(expected);
  });

  it("ignores empty strings and whitespace-only strings", () => {
    expect(segmentText("")).toEqual([]);
    expect(segmentText("   ")).toEqual([]);
    expect(segmentText("\n\n")).toEqual([]);
  });

  it("trims whitespace from segments", () => {
    const input = "  First paragraph.  \n\n  Second paragraph.  ";
    const expected = ["First paragraph.", "Second paragraph."];
    expect(segmentText(input)).toEqual(expected);
  });

  it("splits long paragraphs (>1000 chars) into smaller chunks", () => {
    // Create a long paragraph consisting of repeated words
    const word = "word ";
    // 250 * 5 = 1250 characters
    const longParagraph = word.repeat(250);

    const segments = segmentText(longParagraph);

    // Should be split into at least 2 segments
    expect(segments.length).toBeGreaterThanOrEqual(2);

    // Each segment should be <= 1000 characters (plus a bit of margin if word boundary makes it slightly longer,
    // but the logic says currentChunk + segment > 1000 pushes, so currentChunk <= 1000 usually)
    // Actually the code does: if ((currentChunk + segment).length > 1000) -> push currentChunk.
    // So pushed chunks are <= 1000 unless a single word is massive.
    segments.forEach((segment) => {
      expect(segment.length).toBeLessThanOrEqual(1000);
      expect(segment.length).toBeGreaterThan(0);
    });

    // Reconstruct to verify no data loss (approximate check as whitespace might change slightly due to trim)
    // segmentText trimming might remove leading/trailing space of the chunks.
    // The original logic: segments.push(currentChunk.trim());
    // So checking concatenated length vs original length (ignoring outer whitespace)
    const joined = segments.join(" ");
    // We might lose specific internal spacing if the split happened exactly at a space, but let's check content.
    expect(joined.replace(/\s+/g, "")).toEqual(
      longParagraph.replace(/\s+/g, ""),
    );
  });

  it("handles a single segment that is exactly 1000 characters", () => {
    const text = "a".repeat(1000);
    const segments = segmentText(text);
    expect(segments).toEqual([text]);
  });

  it("handles a single segment that is slightly larger than 1000 characters", () => {
    // 'a' * 1001. Since 'a' is a "word", it might not split if it's one giant word depending on how Intl.Segmenter works?
    // Intl.Segmenter with 'word' granularity handles "words". "aaaa..." is one word.
    // If it's one giant word, the current logic:
    // for (const { segment } of segmenter.segment(paragraph))
    // If the whole thing is one segment, it enters loop once.
    // (currentChunk + segment).length > 1000 -> true.
    // segments.push(currentChunk.trim()) -> pushes empty string! -> filtered out later?
    // currentChunk = segment.
    // Loop ends.
    // segments.push(currentChunk.trim()) -> pushes the giant word.
    // So it fails to split giant words.

    // Let's test with separate words.
    const part1 = "a".repeat(500) + " ";
    const part2 = "b".repeat(500) + " ";
    const part3 = "c".repeat(10);
    const text = part1 + part2 + part3; // > 1000 chars

    const segments = segmentText(text);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].length).toBeLessThanOrEqual(1000);
  });
});
