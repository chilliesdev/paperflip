// paperflip/src/lib/audio.ts

let synth: SpeechSynthesis;
let utterance: SpeechSynthesisUtterance | null = null;
let currentBoundaryCallback: ((word: string) => void) | null = null;

export function initializeTTS() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    synth = window.speechSynthesis;
  } else {
    console.warn("Web Speech API not supported in this browser.");
  }
}

export function speakText(text: string, onBoundary?: (word: string) => void) {
  if (!synth) {
    console.warn("SpeechSynthesis not initialized.");
    return;
  }

  // Stop any currently speaking utterance
  if (utterance) {
    synth.cancel();
  }

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
        currentBoundaryCallback(word);
      }
    };
  } else {
    utterance.onboundary = null;
    currentBoundaryCallback = null;
  }

  utterance.onend = () => {
    utterance = null;
    currentBoundaryCallback = null;
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesisUtterance error:", event);
    utterance = null;
    currentBoundaryCallback = null;
  };

  synth.speak(utterance);
}

export function stopTTS() {
  if (synth && utterance) {
    synth.cancel();
    utterance = null;
    currentBoundaryCallback = null;
  }
}

export function pauseTTS() {
  if (synth && synth.speaking) {
    synth.pause();
  }
}

export function resumeTTS() {
  if (synth && synth.paused) {
    synth.resume();
  }
}

export function isSpeaking(): boolean {
  return synth ? synth.speaking : false;
}

// For testing purposes - resets module state
export function resetTTS() {
  utterance = null;
  currentBoundaryCallback = null;
}
