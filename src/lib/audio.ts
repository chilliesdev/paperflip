// paperflip/src/lib/audio.ts
import { isMuted } from "$lib/stores/audio";
import { get } from "svelte/store";

let synth: SpeechSynthesis;
let utterance: SpeechSynthesisUtterance | null = null;
let currentBoundaryCallback:
  | ((word: string, charIndex: number, charLength: number) => void)
  | null = null;

// Manual state tracking to avoid browser inconsistencies
let manualSpeaking = false;
let manualPaused = false;
let currentText = "";
let currentOnBoundary:
  | ((word: string, charIndex: number, charLength: number) => void)
  | undefined = undefined;
let currentOnEnd: (() => void) | undefined = undefined;
let currentStartIndex = 0;
let lastCharIndex = 0;

// Subscribe to mute changes
if (typeof window !== "undefined") {
  isMuted.subscribe((muted) => {
    if (utterance && synth) {
      // In many browsers, changing volume on a live utterance doesn't work.
      // We need to restart from the last known position if it's currently speaking.
      if (manualSpeaking && !manualPaused) {
        const resumeIndex = currentStartIndex + lastCharIndex;
        speakText(
          currentText,
          currentOnBoundary,
          currentOnEnd,
          resumeIndex,
          true, // internal restart flag
        );
      } else {
        utterance.volume = muted ? 0 : 1;
      }
    }
  });
}

export function initializeTTS() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    synth = window.speechSynthesis;
  } else {
    console.warn("Web Speech API not supported in this browser.");
  }
}

export function speakText(
  text: string,
  onBoundary?: (word: string, charIndex: number, charLength: number) => void,
  onEnd?: () => void,
  startIndex: number = 0,
  isRestart: boolean = false,
) {
  if (!synth) {
    console.warn("SpeechSynthesis not initialized.");
    return;
  }

  // Store current state for potential restarts (mute/unmute)
  if (!isRestart) {
    currentText = text;
    currentOnBoundary = onBoundary;
    currentOnEnd = onEnd;
    currentStartIndex = startIndex;
    lastCharIndex = 0;
  }

  // Stop any currently speaking utterance
  if (utterance) {
    synth.cancel();
  }

  manualSpeaking = true;
  manualPaused = false;

  const textToSpeak = startIndex > 0 ? text.substring(startIndex) : text;
  utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.volume = get(isMuted) ? 0 : 1;
  // You can set voice, pitch, rate here
  // utterance.voice = ...;
  // utterance.pitch = 1;
  // utterance.rate = 1;

  if (onBoundary) {
    currentBoundaryCallback = onBoundary;
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        lastCharIndex = event.charIndex;
        if (currentBoundaryCallback) {
          // Adjust index to match original text
          const adjustedIndex = event.charIndex + startIndex;
          const word = text.substring(
            adjustedIndex,
            adjustedIndex + event.charLength,
          );
          currentBoundaryCallback(word, adjustedIndex, event.charLength);
        }
      }
    };
  } else {
    utterance.onboundary = null;
    currentBoundaryCallback = null;
  }

  // Capture the utterance instance to prevent race conditions with cancel/speak
  const currentUtterance = utterance;

  utterance.onend = () => {
    // Only reset if this is still the active utterance
    if (utterance === currentUtterance) {
      utterance = null;
      currentBoundaryCallback = null;
      manualSpeaking = false;
      manualPaused = false;
      if (onEnd) onEnd();
    }
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesisUtterance error:", event);
    // Only reset if this is still the active utterance
    if (utterance === currentUtterance) {
      utterance = null;
      currentBoundaryCallback = null;
      manualSpeaking = false;
      manualPaused = false;
      if (onEnd) onEnd();
    }
  };

  synth.speak(utterance);
}

export function stopTTS() {
  if (synth && (manualSpeaking || utterance)) {
    synth.cancel();
    utterance = null;
    currentBoundaryCallback = null;
    manualSpeaking = false;
    manualPaused = false;
    lastCharIndex = 0;
  }
}

export function pauseTTS() {
  if (synth && manualSpeaking && !manualPaused) {
    synth.pause();
    manualPaused = true;
  }
}

export function resumeTTS() {
  if (synth && manualPaused) {
    synth.resume();
    manualPaused = false;
  }
}

export function isSpeaking(): boolean {
  return manualSpeaking;
}

export function isPaused(): boolean {
  return manualPaused;
}

// For testing purposes - resets module state
export function resetTTS() {
  utterance = null;
  currentBoundaryCallback = null;
  manualSpeaking = false;
  manualPaused = false;
  lastCharIndex = 0;
}

export function waitForVoices(): Promise<void> {
  return new Promise((resolve) => {
    initializeTTS(); // Ensure synth is initialized

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve(); // Not supported, just proceed
      return;
    }

    if (synth.getVoices().length > 0) {
      resolve();
      return;
    }

    const handler = () => {
      synth.removeEventListener("voiceschanged", handler);
      resolve();
    };
    synth.addEventListener("voiceschanged", handler);

    // Fallback timeout in case voiceschanged never fires
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", handler);
      resolve();
    }, 2000);
  });
}
