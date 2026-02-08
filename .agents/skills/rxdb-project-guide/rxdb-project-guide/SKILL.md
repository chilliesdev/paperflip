---
name: rxdb-project-guide
description: Guide for interacting with RxDB within the 'paperflip' project. Provides instructions and examples for using the existing database API, defining schemas, and extending database functionality.
---

# RxDB Project Guide

## Overview

This skill provides guidance for interacting with RxDB specifically within the 'paperflip' project, leveraging its existing architecture and conventions. It covers understanding the current setup, using established API functions, and extending database functionality.

## Existing RxDB Architecture (`src/lib/database.ts`)

The project centralizes all RxDB configuration and interaction logic within `src/lib/database.ts`. This module exports a singleton `getDb()` function, which initializes the `paperflipdb` database using the `pouchdb-adapter-idb` adapter.

The primary collection is `documents`, defined with the following schema:

```typescript
// Simplified schema for illustration
const documentSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 }, // PDF filename
    title: { type: "string" },
    text: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          segment: { type: "string" },
          index: { type: "number" },
        },
      },
    },
    updatedAt: { type: "number" },
  },
  required: ["id", "title", "text", "segments", "updatedAt"],
};
```

This file also exports high-level asynchronous functions that abstract direct RxDB calls:

- `upsertDocument(id: string, title: string, text: string, segments: {segment: string, index: number}[]): Promise<RxDocument>`: Inserts or updates a document.
- `getRecentUploads(limit: number = 5): Promise<RxDocument[]>`: Retrieves a list of recently uploaded documents.
- `getDocument(id: string): Promise<RxDocument | null>`: Fetches a single document by its ID.

## How to Use Existing API Functions

To interact with the database, import functions directly from `src/lib/database.ts`.

**Example: Fetching recent uploads in a Svelte component**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { getRecentUploads } from "$lib/database";

  let recentDocuments: any[] = []; // Type should be more specific, e.g., RxDocument<DocumentType>[]

  onMount(async () => {
    recentDocuments = await getRecentUploads(10);
  });
</script>

{#each recentDocuments as doc}
  <p>{doc.title}</p>
{/each}
```

**Example: Upserting a document**

```typescript
import { upsertDocument } from "$lib/database";
import { segmentText } from "$lib/segmenter"; // Assuming segmentText is used

async function savePdfContent(filename: string, rawText: string) {
  const segments = segmentText(rawText);
  await upsertDocument(filename, filename, rawText, segments);
  console.log(`Document '${filename}' saved successfully.`);
}
```

## Extending Database Functionality: Implementing Document Deletion

Currently, there is no explicit function for deleting documents. Here's how you can add one and integrate it.

### Step 1: Add `deleteDocument` to `src/lib/database.ts`

```typescript
// In src/lib/database.ts, add the following function:

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  const documentCollection = db.collections.documents;
  try {
    const doc = await documentCollection.findOne(id).exec();
    if (doc) {
      await doc.remove();
      console.log(`Document with ID '${id}' deleted successfully.`);
    } else {
      console.warn(`Document with ID '${id}' not found for deletion.`);
    }
  } catch (error) {
    console.error(`Error deleting document with ID '${id}':`, error);
    throw error;
  }
}
```

### Step 2: Integrate into a Svelte Component

You can now use `deleteDocument` in any Svelte component. For instance, to add a delete button next to each document in `PdfUploader.svelte` (or `+page.svelte`):

```svelte
<!-- Example within a Svelte component, e.g., +page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { getRecentUploads, deleteDocument } from "$lib/database";

  let recentDocuments: any[] = [];

  onMount(async () => {
    recentDocuments = await getRecentUploads(10);
  });

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      // Refresh the list after deletion
      recentDocuments = recentDocuments.filter((doc) => doc.id !== id);
      console.log("Document deleted and list refreshed.");
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }
</script>

<h1>Recent Uploads</h1>
{#each recentDocuments as doc (doc.id)}
  <div>
    <span>{doc.title}</span>
    <button on:click={() => handleDelete(doc.id)}>Delete</button>
  </div>
{/each}
```

## Defining New Collections and Schemas

If you need to store different types of data, you'll need to define a new collection and its corresponding schema.

### Step 1: Define a new schema

Create a new schema object, similar to `documentSchema`.

```typescript
// Example: New schema for a 'notes' collection
const noteSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    content: { type: "string" },
    createdAt: { type: "number" },
  },
  required: ["id", "content", "createdAt"],
};
```

### Step 2: Add the collection to `getDb()`

Modify the `getDb()` function in `src/lib/database.ts` to add the new collection.

```typescript
// Inside the getDb() function in src/lib/database.ts
if (!db.collections.notes) {
  // Check if collection already exists
  await db.addCollections({
    notes: {
      schema: noteSchema,
      // Optional: other RxCollection options
    },
  });
}
```

Remember to also create wrapper functions (like `addNote`, `getNote`, etc.) for your new collection, following the existing abstraction pattern in `database.ts`.

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/

Executable code that can be run directly to perform specific operations.

**Examples from other skills:**

- PDF skill: fill_fillable_fields.cjs, extract_form_field_info.cjs - utilities for PDF manipulation
- CSV skill: normalize_schema.cjs, merge_datasets.cjs - utilities for tabular data manipulation

**Appropriate for:** Node.cjs scripts (cjs), shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Gemini CLI for patching or environment adjustments.

### references/

Documentation and reference material intended to be loaded into context to inform Gemini CLI's process and thinking.

**Examples from other skills:**

- Product management: communication.md, context_building.md - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Gemini CLI should reference while working.

### assets/

Files not intended to be loaded into context, but rather used within the output Gemini CLI produces.

**Examples from other skills:**

- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
