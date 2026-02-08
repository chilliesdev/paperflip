// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock SpeechSynthesis and SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

class MockSpeechSynthesis {
  speaking = false;
  paused = false;
  pending = false;
  private utterances: MockSpeechSynthesisUtterance[] = [];

  speak(utterance: MockSpeechSynthesisUtterance) {
    this.speaking = true;
    this.utterances.push(utterance);
    // Simulate async speech - trigger onend after a short delay
    setTimeout(() => {
      if (utterance.onend) {
        utterance.onend();
      }
      this.speaking = false;
    }, 10);
  }

  cancel() {
    this.speaking = false;
    this.paused = false;
    this.utterances = [];
  }

  pause() {
    if (this.speaking) {
      this.paused = true;
    }
  }

  resume() {
    if (this.paused) {
      this.paused = false;
    }
  }

  getVoices() {
    return [];
  }
}

// Setup global mocks using vi.stubGlobal
let mockSynth: MockSpeechSynthesis;

mockSynth = new MockSpeechSynthesis();

// Stub the global constructors and objects
vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
vi.stubGlobal("window", {
  speechSynthesis: mockSynth,
  SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
});

// Now import the module after mocks are set up
import {
  initializeTTS,
  speakText,
  stopTTS,
  pauseTTS,
  resumeTTS,
  isSpeaking,
  isPaused,
  resetTTS,
} from "../../lib/audio";

describe("audio.ts", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create fresh mock instance
    mockSynth = new MockSpeechSynthesis();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Update global mocks
    vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
    vi.stubGlobal("window", {
      speechSynthesis: mockSynth,
      SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    });

    // Reset module state
    resetTTS();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("initializeTTS", () => {
    it("initializes speech synthesis when available", () => {
      initializeTTS();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("warns when Web Speech API is not supported", () => {
      vi.stubGlobal("window", {});
      initializeTTS();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Web Speech API not supported in this browser.",
      );
      // Restore for other tests
      vi.stubGlobal("window", {
        speechSynthesis: mockSynth,
        SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
      });
    });

    it("handles missing window object (server-side)", () => {
      vi.stubGlobal("window", undefined);
      initializeTTS();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Web Speech API not supported in this browser.",
      );
      // Restore
      vi.stubGlobal("window", {
        speechSynthesis: mockSynth,
        SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
      });
    });
  });

  describe("speakText", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("speaks the provided text", () => {
      const text = "Hello, world!";
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText(text);

      expect(speakSpy).toHaveBeenCalledTimes(1);
      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      expect(utterance.text).toBe(text);
    });

    it("cancels previous utterance before speaking new text", () => {
      const cancelSpy = vi.spyOn(mockSynth, "cancel");

      speakText("First text");
      speakText("Second text");

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it("calls onBoundary callback when word boundaries are reached", () => {
      const text = "Hello world";
      const onBoundary = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText(text, onBoundary);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      expect(utterance.onboundary).not.toBeNull();

      // Simulate boundary event for the word "Hello"
      const boundaryEvent = {
        name: "word",
        charIndex: 0,
        charLength: 5,
      } as SpeechSynthesisEvent;

      utterance.onboundary!(boundaryEvent);
      expect(onBoundary).toHaveBeenCalledWith("Hello", 0, 5);

      // Simulate boundary event for the word "world"
      const boundaryEvent2 = {
        name: "word",
        charIndex: 6,
        charLength: 5,
      } as SpeechSynthesisEvent;

      utterance.onboundary!(boundaryEvent2);
      expect(onBoundary).toHaveBeenCalledWith("world", 6, 5);
      expect(onBoundary).toHaveBeenCalledTimes(2);
    });

    it("ignores non-word boundary events", () => {
      const text = "Hello world";
      const onBoundary = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText(text, onBoundary);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // Simulate sentence boundary event (should be ignored)
      const sentenceBoundary = {
        name: "sentence",
        charIndex: 0,
        charLength: 11,
      } as SpeechSynthesisEvent;

      utterance.onboundary!(sentenceBoundary);
      expect(onBoundary).not.toHaveBeenCalled();
    });

    it("sets onboundary to null when no callback is provided", () => {
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("Test text");

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      expect(utterance.onboundary).toBeNull();
    });

    it("clears utterance and callback on end event", () => {
      const onBoundary = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("Test", onBoundary);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // Trigger onend
      utterance.onend!();

      // Verify cleanup - subsequent speak should not cancel (since utterance is null)
      const cancelSpy = vi.spyOn(mockSynth, "cancel");
      speakText("New text");
      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it("handles error events and cleans up", () => {
      const onBoundary = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("Test", onBoundary);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // Simulate error
      const errorEvent = {
        error: "network",
        message: "Network error",
      } as unknown as SpeechSynthesisErrorEvent;

      utterance.onerror!(errorEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "SpeechSynthesisUtterance error:",
        errorEvent,
      );

      // Verify cleanup
      const cancelSpy = vi.spyOn(mockSynth, "cancel");
      speakText("New text");
      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it("calls onEnd callback when speech ends", () => {
      const onEnd = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("Test", undefined, onEnd);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // Trigger onend
      utterance.onend!();

      expect(onEnd).toHaveBeenCalled();
    });

    it("calls onEnd callback when speech errors", () => {
      const onEnd = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("Test", undefined, onEnd);

      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // Simulate error
      const errorEvent = {
        error: "network",
        message: "Network error",
      } as unknown as SpeechSynthesisErrorEvent;

      utterance.onerror!(errorEvent);

      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe("stopTTS", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("cancels current speech and clears utterance", () => {
      const cancelSpy = vi.spyOn(mockSynth, "cancel");

      speakText("Test text");
      stopTTS();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it("does nothing when no utterance is active", () => {
      const cancelSpy = vi.spyOn(mockSynth, "cancel");

      stopTTS();

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it("clears boundary callback when stopping", () => {
      const onBoundary = vi.fn();

      speakText("Test", onBoundary);
      stopTTS();

      // After stopping, speaking new text without callback should work
      const speakSpy = vi.spyOn(mockSynth, "speak");
      speakText("New text");
      const utterance = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;
      expect(utterance.onboundary).toBeNull();
    });
  });

  describe("pauseTTS", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("pauses speech when speaking", () => {
      const pauseSpy = vi.spyOn(mockSynth, "pause");

      speakText("Test text");
      // manualSpeaking is set to true by speakText
      pauseTTS();

      expect(pauseSpy).toHaveBeenCalledTimes(1);
    });

    it("does nothing when not speaking", () => {
      const pauseSpy = vi.spyOn(mockSynth, "pause");

      stopTTS(); // Ensure manualSpeaking is false
      pauseTTS();

      expect(pauseSpy).not.toHaveBeenCalled();
    });
  });

  describe("resumeTTS", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("resumes speech when paused", () => {
      const resumeSpy = vi.spyOn(mockSynth, "resume");

      speakText("Test text");
      pauseTTS(); // Sets manualPaused = true
      resumeTTS();

      expect(resumeSpy).toHaveBeenCalledTimes(1);
    });

    it("does nothing when not paused", () => {
      const resumeSpy = vi.spyOn(mockSynth, "resume");

      speakText("Test"); // manualPaused is false initially
      resumeTTS();

      expect(resumeSpy).not.toHaveBeenCalled();
    });
  });

  describe("isSpeaking", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("returns true when speech synthesis is speaking", () => {
      speakText("Test");
      expect(isSpeaking()).toBe(true);
    });

    it("returns false when speech synthesis is not speaking", () => {
      // Intentionally not calling speakText or calling stopTTS
      stopTTS();
      expect(isSpeaking()).toBe(false);
    });

    it("returns false when synth is not initialized", () => {
      vi.stubGlobal("window", {});

      expect(isSpeaking()).toBe(false);

      // Restore
      vi.stubGlobal("window", {
        speechSynthesis: mockSynth,
        SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
      });
    });
  });

  describe("Integration scenarios", () => {
    beforeEach(() => {
      initializeTTS();
    });

    it("handles complete speak-pause-resume-stop workflow", () => {
      const text = "This is a test of the complete workflow.";
      const onBoundary = vi.fn();

      // Speak
      speakText(text, onBoundary);
      expect(isSpeaking()).toBe(true);
      expect(isPaused()).toBe(false);

      // Pause
      pauseTTS();
      expect(isSpeaking()).toBe(true);
      expect(isPaused()).toBe(true);

      // Resume
      resumeTTS();
      expect(isSpeaking()).toBe(true);
      expect(isPaused()).toBe(false);

      // Stop
      stopTTS();
      expect(isSpeaking()).toBe(false);
      expect(isPaused()).toBe(false);
    });

    it("handles rapid consecutive speak calls", () => {
      const cancelSpy = vi.spyOn(mockSynth, "cancel");

      speakText("First");
      speakText("Second");
      speakText("Third");

      // Should cancel twice (before second and third)
      expect(cancelSpy).toHaveBeenCalledTimes(2);
    });

    it("maintains separate boundary callbacks for different utterances", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const speakSpy = vi.spyOn(mockSynth, "speak");

      speakText("First text", callback1);

      speakText("Second text", callback2);
      const utterance2 = speakSpy.mock
        .calls[1][0] as MockSpeechSynthesisUtterance;

      // Simulate boundary on second utterance
      const boundaryEvent = {
        name: "word",
        charIndex: 0,
        charLength: 6,
      } as SpeechSynthesisEvent;

      utterance2.onboundary!(boundaryEvent);

      // Only callback2 should be called (callback1 was cleared when utterance was cancelled)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith("Second", 0, 6);
    });

    it("handles race condition where previous utterance onend fires after new speakText", () => {
      const speakSpy = vi.spyOn(mockSynth, "speak");

      // 1. Start speaking first text
      speakText("First");
      const utterance1 = speakSpy.mock
        .calls[0][0] as MockSpeechSynthesisUtterance;

      // 2. Stop (which cancels) - this is what happens when changing slides
      stopTTS();

      // 3. Immediately speak second text
      speakText("Second");
      const utterance2 = speakSpy.mock
        .calls[1][0] as MockSpeechSynthesisUtterance;

      expect(isSpeaking()).toBe(true);
      // Ensure we have a different utterance
      expect(utterance1).not.toBe(utterance2);

      // 4. Simulate delayed onend from First utterance (caused by cancel in step 2)
      // In the browser, cancel() triggers onend/onerror asynchronously.
      // If this fires now, valid implementation should ignore it for state reset.
      if (utterance1.onend) {
        utterance1.onend();
      }

      // 5. Verification: Should still be speaking because Second is active
      expect(isSpeaking()).toBe(true);
    });
  });
});
