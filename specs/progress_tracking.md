# Progress Tracking Test Specifications

## Overview

This document outlines the test cases for the progress tracking feature in PaperFlip. The feature ensures that user progress is saved at the document and segment level (granular character index) and persists across sessions.

## 1. Database Schema & Migration

**Goal:** Verify that the database schema correctly supports progress tracking and that existing data is migrated without loss.

- [ ] **TC-DB-001: Schema Validation**
  - **Setup:** Initialize the database.
  - **Action:** Inspect the `documents` collection schema.
  - **Expected:** Schema version is `2`. Fields `currentSegmentIndex` (number) and `currentSegmentProgress` (number) exist.

- [ ] **TC-DB-002: Migration from Version 1**
  - **Setup:** Create a mock database with version 1 schema. Insert a document with only `currentSegmentIndex`.
  - **Action:** Upgrade database to version 2 (trigger migration).
  - **Expected:** The document exists. `currentSegmentProgress` is initialized to `0`. `currentSegmentIndex` remains unchanged.

- [ ] **TC-DB-003: Update Progress Functionality**
  - **Setup:** create a document with ID `doc-1`.
  - **Action:** Call `updateDocumentProgress('doc-1', 5, 120)`.
  - **Expected:** Database query for `doc-1` returns `currentSegmentIndex: 5` and `currentSegmentProgress: 120`.

## 2. Audio Engine (TTS)

**Goal:** Verify that the TTS engine can start playback from a specific character index and correctly report boundary events relative to the full text.

- [ ] **TC-AUDIO-001: Start from Beginning**
  - **Setup:** Text "Hello world".
  - **Action:** `speakText("Hello world", ..., 0)`.
  - **Expected:** Full text is spoken. First boundary event starts at index `0`.

- [ ] **TC-AUDIO-002: Start from Offset**
  - **Setup:** Text "Hello world", start index `6` (starts at "world").
  - **Action:** `speakText("Hello world", ..., 6)`.
  - **Expected:** Only "world" is spoken. First boundary event for "world" reports index `6` (not `0`), correctly matching the original string.

- [ ] **TC-AUDIO-003: Invalid Offset Handling**
  - **Setup:** Text "Hi", start index `10`.
  - **Action:** `speakText("Hi", ..., 10)`.
  - **Expected:** Should gracefully handle (empty string or no playback) without crashing.

## 3. Feed Component (Playback & Saving)

**Goal:** Verify that the UI correctly initializes state, tracks progress during playback, and saves it at appropriate moments.

- [ ] **TC-FEED-001: Initialize with Saved Progress**
  - **Setup:** Component props `initialIndex=2`, `initialProgress=50`.
  - **Action:** Mount component.
  - **Expected:** Swiper starts at slide 2. TTS starts speaking segment 2 from character index 50.

- [ ] **TC-FEED-002: Save on Pause**
  - **Setup:** Playing slide 1. Current char index reaches `100`.
  - **Action:** User clicks to pause.
  - **Expected:** `updateDocumentProgress` is called with `index=1`, `progress=100`.

- [ ] **TC-FEED-003: Save on Slide Change**
  - **Setup:** Playing slide 1.
  - **Action:** User swipes to slide 2.
  - **Expected:**
    1. `updateDocumentProgress` called for slide 2 (index=2, progress=0).
    2. TTS stops for slide 1 and starts for slide 2 from beginning (progress=0).

- [ ] **TC-FEED-004: Save on Unmount**
  - **Setup:** Playing slide 3.
  - **Action:** User navigates back (unmounts component).
  - **Expected:** `updateDocumentProgress` is called with the last known index and progress.

- [ ] **TC-FEED-005: Resume Only Once**
  - **Setup:** Start at slide 0, progress 50.
  - **Action:** Let slide 0 finish. Swipe to slide 1. Swipe back to slide 0.
  - **Expected:**
    - First play of slide 0 starts at 50.
    - Second play of slide 0 (after swipe back) starts at 0 (beginning).

## 4. PDF Uploader (File List UI)

**Goal:** Verify that the file list accurately reflects the calculated granular progress.

- [ ] **TC-LIST-001: Display Granular Progress**
  - **Setup:**
    - Document A: 10 segments. Current index 4. Progress within segment 5 (halfway).
  - **Action:** Render file list.
  - **Expected:** Progress bar shows ~45% (4.5/10). Text shows "45% watched".

- [ ] **TC-LIST-002: Zero Progress**
  - **Setup:** New document.
  - **Action:** Render list.
  - **Expected:** 0% progress. Part 1 of X.

- [ ] **TC-LIST-003: Completed Document**
  - **Setup:** Last segment, progress at end.
  - **Action:** Render list.
  - **Expected:** 100% (or near 100%) progress.

## 5. Integration / User Flow

**Goal:** Verify the full user journey.

- [ ] **TC-FLOW-001: Seamless Resume**
  - **Step 1:** Upload PDF.
  - **Step 2:** Listen to Segment 1. Pause halfway.
  - **Step 3:** Go back to home. Verify progress bar.
  - **Step 4:** Re-open document.
  - **Expected:** Player opens directly to Segment 1 and resumes audio exactly where paused.
