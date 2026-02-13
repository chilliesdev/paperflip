// paperflip/src/lib/segmenter.ts

let wordSegmenter: Intl.Segmenter | null | undefined;
let sentenceSegmenter: Intl.Segmenter | null | undefined;

function getWordSegmenter(): Intl.Segmenter | null {
  if (wordSegmenter !== undefined) return wordSegmenter;

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  } else {
    wordSegmenter = null;
  }
  return wordSegmenter;
}

function getSentenceSegmenter(): Intl.Segmenter | null {
  if (sentenceSegmenter !== undefined) return sentenceSegmenter;

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
  } else {
    sentenceSegmenter = null;
  }
  return sentenceSegmenter;
}

/**
 * Splits raw text into segments (e.g., paragraphs or sentences).
 * @param text The raw text to segment.
 * @returns An array of text segments.
 */
export function segmentText(text: string): string[] {
  const segments: string[] = [];
  // Split by one or more blank lines to get initial paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const segmenter = getWordSegmenter();

  for (const paragraph of paragraphs) {
    if (paragraph.length <= 1000) {
      segments.push(paragraph.trim());
    } else {
      // Paragraph is too long, split into ~1000 character chunks
      let currentChunk = "";
      if (segmenter) {
        // Use Intl.Segmenter to split by words for more natural breaks
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - TS types for Intl.Segmenter might be missing in some environments
        for (const { segment } of segmenter.segment(paragraph)) {
          if (
            (currentChunk + segment).length > 1000 &&
            currentChunk.length > 0
          ) {
            segments.push(currentChunk.trim());
            currentChunk = segment;
          } else {
            currentChunk += segment;
          }
        }
        if (currentChunk.length > 0) {
          segments.push(currentChunk.trim());
        }
      } else {
        // Fallback for environments without Intl.Segmenter or for simpler char-based split
        // This is less ideal as it might split words
        for (let i = 0; i < paragraph.length; i += 1000) {
          segments.push(paragraph.substring(i, i + 1000).trim());
        }
      }
    }
  }

  return segments.filter((s) => s.length > 0); // Filter out any empty segments
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
  const segmenter = getSentenceSegmenter();

  if (segmenter) {
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
