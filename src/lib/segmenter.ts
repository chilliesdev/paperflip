// paperflip/src/lib/segmenter.ts

/**
 * Splits raw text into segments (e.g., paragraphs or sentences).
 * @param text The raw text to segment.
 * @returns An array of text segments.
 */
export function segmentText(text: string): string[] {
  const segments: string[] = [];
  // Split by one or more blank lines to get initial paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const segmenter =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? new Intl.Segmenter(undefined, { granularity: "word" })
      : null;

  for (const paragraph of paragraphs) {
    if (paragraph.length <= 1000) {
      segments.push(paragraph.trim());
    } else {
      // Paragraph is too long, split into ~1000 character chunks
      let currentChunk = "";
      if (segmenter) {
        // Use Intl.Segmenter to split by words for more natural breaks
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
