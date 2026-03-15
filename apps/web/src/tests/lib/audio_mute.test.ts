// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock SpeechSynthesis and SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  volume: number = 1;
  onboundary: any = null;
  onend: any = null;
  onerror: any = null;

  constructor(text: string) {
    this.text = text;
  }
}

class MockSpeechSynthesis {
  speak(_utterance: any) {}
  cancel() {}
  getVoices() {
    return [];
  }
}

const mockSynth = new MockSpeechSynthesis();
const speakSpy = vi.spyOn(mockSynth, "speak");

// Stub the global constructors and objects BEFORE importing audio.ts
vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
vi.stubGlobal("window", {
  speechSynthesis: mockSynth,
  SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
});

import { isMuted } from "../../lib/stores/audio";
import { speakText, initializeTTS, resetTTS } from "../../lib/audio";

describe("audio mute integration", () => {
  beforeEach(() => {
    speakSpy.mockClear();
    isMuted.set(false);
    resetTTS();
    initializeTTS();
  });

  it("sets volume to 0 when isMuted is true", () => {
    isMuted.set(true);
    speakText("Hello");

    const utterance = speakSpy.mock.calls[0][0] as any;
    expect(utterance.volume).toBe(0);
  });

  it("sets volume to 1 when isMuted is false", () => {
    isMuted.set(false);
    speakText("Hello");

    const utterance = speakSpy.mock.calls[0][0] as any;
    expect(utterance.volume).toBe(1);
  });

  it("updates volume of active utterance when isMuted changes", () => {
    isMuted.set(false);
    speakText("Hello");

    const utterance1 = speakSpy.mock.calls[0][0] as any;
    expect(utterance1.volume).toBe(1);

    isMuted.set(true);
    // Should have called speak again (restart)
    expect(speakSpy).toHaveBeenCalledTimes(2);
    const utterance2 = speakSpy.mock.calls[1][0] as any;
    expect(utterance2.volume).toBe(0);

    isMuted.set(false);
    // Should have called speak again (restart)
    expect(speakSpy).toHaveBeenCalledTimes(3);
    const utterance3 = speakSpy.mock.calls[2][0] as any;
    expect(utterance3.volume).toBe(1);
  });
});
