# Specification: Dynamic Document Re-segmentation

This document outlines the strategy for automatically re-segmenting documents when the user changes the **Video Length** setting.

## Background

PaperFlip splits PDFs into "Shorts" (segments) during the initial upload based on the user's preferred video length. Currently, if a user changes this setting, existing documents remain in their original segment lengths. To provide a consistent experience, the app should re-calculate segments for existing documents to match the current preference.

## Proposed Changes

### 1. Data Model Updates (`src/lib/database.ts`)

The `documentSchema` needs to store the original source text and the setting used for its last segmentation.

- **Add `fullText` (string)**: The complete text extracted from the PDF.
- **Add `videoLengthAtSegmentation` (number)**: The `$videoLength` value used when the `segments` array was last generated.

### 2. Storage Logic (`src/lib/database.ts` & `src/routes/+page.svelte`)

- Update `upsertDocument` to accept and store the `fullText`.
- When a document is first uploaded in `+page.svelte`, pass the `fullText` and the current `$videoLength` to the database.

### 3. Detection & Re-segmentation Logic (`src/routes/feed/+page.svelte`)

When loading a document for the feed:

1.  Compare the document's `videoLengthAtSegmentation` with the current `$videoLength` store value.
2.  If they differ:
    - Call `segmentText(doc.fullText, newMaxChars)`.
    - Update the document's `segments` and `videoLengthAtSegmentation` in RxDB.
    - Continue loading the feed with the updated segments.

### 4. Progress Migration

To ensure the user doesn't lose their place after re-segmentation:

1.  **Calculate Global Offset**: Before re-segmenting, calculate the total number of characters the user has read:
    `globalOffset = (previousSegments.slice(0, currentIndex).join("").length) + currentProgress`
2.  **Find New Segment**: After re-segmenting, find the new `currentSegmentIndex` and `currentSegmentProgress` that corresponds to that same `globalOffset`.

## User Experience

- The re-segmentation should happen silently and nearly instantaneously when the user opens a document.
- If a document is extremely large, a brief "Optimizing for new settings..." loading state may be shown.

## Success Metrics

- Changing the "Video Length" in Settings immediately affects the "Shorts" count and length in previously uploaded documents upon next viewing.
- Users remain on the same sentence/word after a re-segmentation occurs.
