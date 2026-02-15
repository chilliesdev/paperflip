// @vitest-environment node
import { describe, it, expect } from "vitest";
import { segmentText, splitSentences } from "../../lib/segmenter";

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

    segments.forEach((segment) => {
      expect(segment.length).toBeLessThanOrEqual(1000);
      expect(segment.length).toBeGreaterThan(0);
    });

    const joined = segments.join(" ");
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
    const part1 = "a".repeat(500) + " ";
    const part2 = "b".repeat(500) + " ";
    const part3 = "c".repeat(10);
    const text = part1 + part2 + part3; // > 1000 chars

    const segments = segmentText(text);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].length).toBeLessThanOrEqual(1000);
  });

  it("does not split between sentences when long paragraph is split", () => {
    // Each sentence is ~75 chars.
    const sentence =
      "This is a relatively long sentence that should stay together if possible. ";
    const sentences = [];
    for (let i = 0; i < 30; i++) {
      sentences.push(sentence);
    }
    const longParagraph = sentences.join("");
    // 30 * 74 = 2220 chars.

    const segments = segmentText(longParagraph);

    expect(segments.length).toBeGreaterThanOrEqual(3);
    segments.forEach((segment) => {
      expect(segment.length).toBeLessThanOrEqual(1000);
      // Each segment should end with the sentence terminator and space (trimmed)
      // Since segmentText calls .trim() on the result, it should end with the period.
      expect(segment).toMatch(/[.!?]$/);
    });
  });

  it("splits a single word that exceeds 1000 characters", () => {
    // 2500 'a's
    const longWord = "a".repeat(2500);
    const segments = segmentText(longWord);

    // Should be split into 3 segments: 1000, 1000, 500
    expect(segments.length).toBe(3);
    expect(segments[0].length).toBe(1000);
    expect(segments[1].length).toBe(1000);
    expect(segments[2].length).toBe(500);
    expect(segments.join("")).toBe(longWord);
  });
});

describe("splitSentences", () => {
  it("splits text into sentences with correct offsets", () => {
    const text = "Hello world. This is a test! Is it working?";
    const result = splitSentences(text);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      text: "Hello world. ",
      start: 0,
      end: 13,
    });
    expect(result[1]).toEqual({
      text: "This is a test! ",
      start: 13,
      end: 29,
    });
    expect(result[2]).toEqual({
      text: "Is it working?",
      start: 29,
      end: 43,
    });
  });

  it("handles a single sentence", () => {
    const text = "Just one sentence.";
    const result = splitSentences(text);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Just one sentence.");
  });

  it("handles trailing spaces", () => {
    const text = "Sentence one. ";
    const result = splitSentences(text);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Sentence one. ");
  });
});
