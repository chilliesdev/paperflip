// paperflip/src/lib/segmenter.ts

let cachedSentenceSegmenter: Intl.Segmenter | null = null;

const DEFAULT_MAX_SEGMENT_LENGTH = 1000;

/**
 * Splits raw text into manageable segments for processing.
 *
 * The segmentation process follows these rules:
 * 1. Initially splits text into paragraphs using double newlines.
 * 2. Paragraphs shorter than maxChars are kept as-is.
 * 3. Longer paragraphs are split into sentences using Intl.Segmenter.
 * 4. Sentences are recombined into chunks that stay within the limit.
 * 5. If a single sentence exceeds limit, it is force-split at the nearest
 *    word boundary (space).
 *
 * @param text - The raw input text to be segmented.
 * @param maxChars - The maximum number of characters per segment. Defaults to 1000.
 * @returns An array of trimmed text segments, each within the length limit.
 */
export function segmentText(
  text: string,
  maxChars: number = DEFAULT_MAX_SEGMENT_LENGTH,
): string[] {
  // Ensure maxChars is at least 1 to avoid infinite loops in chunking
  maxChars = Math.max(1, maxChars);

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      segments.push(paragraph.trim());
      continue;
    }

    // Paragraph is too long, split into sentences and recombine
    const sentences = splitSentences(paragraph);
    let currentChunkParts: string[] = [];
    let currentChunkLength = 0;

    for (const { text: sentence } of sentences) {
      if (sentence.length > maxChars) {
        if (currentChunkParts.length > 0) {
          segments.push(currentChunkParts.join("").trim());
          currentChunkParts = [];
          currentChunkLength = 0;
        }
        segments.push(...chunkText(sentence, maxChars));
      } else if (currentChunkLength + sentence.length > maxChars) {
        if (currentChunkParts.length > 0) {
          segments.push(currentChunkParts.join("").trim());
        }
        currentChunkParts = [sentence];
        currentChunkLength = sentence.length;
      } else {
        currentChunkParts.push(sentence);
        currentChunkLength += sentence.length;
      }
    }

    if (currentChunkParts.length > 0) {
      segments.push(currentChunkParts.join("").trim());
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

  const useIntl = typeof Intl !== "undefined" && (Intl as any).Segmenter;

  if (useIntl) {
    try {
      if (!cachedSentenceSegmenter) {
        cachedSentenceSegmenter = new (Intl as any).Segmenter(undefined, {
          granularity: "sentence",
        });
      }
      const segmenter = cachedSentenceSegmenter!;
      for (const { segment, index } of segmenter.segment(text)) {
        if (segment.trim().length > 0) {
          sentences.push({
            text: segment,
            start: index,
            end: index + segment.length,
          });
        }
      }
      if (sentences.length > 0) return sentences;
    } catch (e) {
      console.warn("[Core] Intl.Segmenter failed, falling back to regex", e);
    }
  }

  // Fallback: simpler regex-based split that preserves offsets
  // Improved regex to handle abbreviations and common sentence endings
  const regex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const s = match[0];
    if (s.trim().length > 0) {
      sentences.push({
        text: s,
        start: match.index,
        end: match.index + s.length,
      });
    }
  }

  return sentences;
}
