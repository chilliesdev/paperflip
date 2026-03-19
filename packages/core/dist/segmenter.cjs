"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/segmenter.ts
var segmenter_exports = {};
__export(segmenter_exports, {
  segmentText: () => segmentText,
  splitSentences: () => splitSentences
});
module.exports = __toCommonJS(segmenter_exports);
var cachedSentenceSegmenter = null;
var DEFAULT_MAX_SEGMENT_LENGTH = 1e3;
function segmentText(text, maxChars = DEFAULT_MAX_SEGMENT_LENGTH) {
  maxChars = Math.max(1, maxChars);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const segments = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      segments.push(paragraph.trim());
      continue;
    }
    const sentences = splitSentences(paragraph);
    let currentChunkParts = [];
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
function chunkText(text, maxLength) {
  const chunks = [];
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
    while (start < text.length && text[start] === " ") {
      start++;
    }
  }
  return chunks;
}
function splitSentences(text) {
  const sentences = [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    if (!cachedSentenceSegmenter) {
      cachedSentenceSegmenter = new Intl.Segmenter(void 0, {
        granularity: "sentence"
      });
    }
    const segmenter = cachedSentenceSegmenter;
    for (const { segment, index } of segmenter.segment(text)) {
      if (segment.trim().length > 0) {
        sentences.push({
          text: segment,
          start: index,
          end: index + segment.length
        });
      }
    }
  } else {
    const regex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].trim().length > 0) {
        sentences.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  }
  return sentences;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  segmentText,
  splitSentences
});
//# sourceMappingURL=segmenter.cjs.map