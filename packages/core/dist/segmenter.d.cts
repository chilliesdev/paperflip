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
declare function segmentText(text: string, maxChars?: number): string[];
/**
 * Splits text into sentences with their start/end indices.
 * @param text The text to split.
 * @returns An array of sentence objects with text and indices.
 */
declare function splitSentences(text: string): {
    text: string;
    start: number;
    end: number;
}[];

export { segmentText, splitSentences };
