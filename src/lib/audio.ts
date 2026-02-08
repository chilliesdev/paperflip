// paperflip/src/lib/audio.ts

let synth: SpeechSynthesis;
let utterance: SpeechSynthesisUtterance | null = null;
let currentBoundaryCallback:
  | ((word: string, charIndex: number, charLength: number) => void)
  | null = null;

// Manual state tracking to avoid browser inconsistencies
let manualSpeaking = false;
let manualPaused = false;

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
) {
  if (!synth) {
    console.warn("SpeechSynthesis not initialized.");
    return;
  }

  // Stop any currently speaking utterance
  if (utterance) {
    synth.cancel();
  }

  manualSpeaking = true;
  manualPaused = false;

  utterance = new SpeechSynthesisUtterance(text);
  // You can set voice, pitch, rate here
  // utterance.voice = ...;
  // utterance.pitch = 1;
  // utterance.rate = 1;

  if (onBoundary) {
    currentBoundaryCallback = onBoundary;
    utterance.onboundary = (event) => {
      if (event.name === "word" && currentBoundaryCallback) {
        const word = text.substring(
          event.charIndex,
          event.charIndex + event.charLength,
        );
        currentBoundaryCallback(word, event.charIndex, event.charLength);
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
}
