// paperflip/src/lib/segmenter.ts

let cachedSentenceSegmenter: Intl.Segmenter | null = null;

const MAX_SEGMENT_LENGTH = 1000;

/**
 * Splits raw text into manageable segments for processing.
 *
 * The segmentation process follows these rules:
 * 1. Initially splits text into paragraphs using double newlines.
 * 2. Paragraphs shorter than MAX_SEGMENT_LENGTH (1000 chars) are kept as-is.
 * 3. Longer paragraphs are split into sentences using Intl.Segmenter.
 * 4. Sentences are recombined into chunks that stay within the 1000 character limit.
 * 5. If a single sentence exceeds 1000 characters, it is force-split at the nearest
 *    word boundary (space).
 *
 * @param text - The raw input text to be segmented.
 * @returns An array of trimmed text segments, each within the length limit.
 */
export function segmentText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_SEGMENT_LENGTH) {
      segments.push(paragraph.trim());
      continue;
    }

    // Paragraph is too long, split into sentences and recombine
    const sentences = splitSentences(paragraph);
    let currentChunk = "";

    for (const { text: sentence } of sentences) {
      if (sentence.length > MAX_SEGMENT_LENGTH) {
        if (currentChunk) {
          segments.push(currentChunk.trim());
          currentChunk = "";
        }
        segments.push(...chunkText(sentence, MAX_SEGMENT_LENGTH));
      } else if ((currentChunk + sentence).length > MAX_SEGMENT_LENGTH) {
        if (currentChunk) {
          segments.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      segments.push(currentChunk.trim());
    }
  }

  return segments.filter((s) => s.length > 0);
}

/**
 * Splits a long string into chunks of a maximum length, attempting to break at spaces.
 * Used as a fallback when a single sentence exceeds the maximum allowed segment length.
 *
 * @param text - The long text string to split.
 * @param maxLength - The maximum allowed length for each chunk.
 * @returns An array of text chunks.
 */
function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);

    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end;
    // Skip leading spaces for the next chunk
    while (start < text.length && text[start] === " ") {
      start++;
    }
  }

  return chunks;
}

/**
 * Splits text into sentences with their start/end indices.
 * @param text The text to split.
 * @returns An array of sentence objects with text and indices.
 */
export function splitSentences(
  text: string,
): { text: string; start: number; end: number }[] {
  const sentences: { text: string; start: number; end: number }[] = [];

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    if (!cachedSentenceSegmenter) {
      cachedSentenceSegmenter = new Intl.Segmenter(undefined, {
        granularity: "sentence",
      });
    }
    const segmenter = cachedSentenceSegmenter;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - TS types for Intl.Segmenter might be missing in some environments
    for (const { segment, index } of segmenter.segment(text)) {
      if (segment.trim().length > 0) {
        sentences.push({
          text: segment,
          start: index,
          end: index + segment.length,
        });
      }
    }
  } else {
    // Fallback: simpler regex-based split that preserves offsets
    const regex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].trim().length > 0) {
        sentences.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
  }

  return sentences;
}
