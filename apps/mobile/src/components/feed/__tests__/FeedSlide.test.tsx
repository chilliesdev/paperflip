import React from 'react';
import { render } from '@testing-library/react-native';
import { FeedSlide } from '../FeedSlide';

// Mocking some parts manually for the test
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    muted: false,
    loop: false,
  })),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  splitSentences: jest.fn((text) => [{ text, start: 0, end: text.length }]),
}));

describe('FeedSlide', () => {
  const segment = "This is a test segment for the mobile reader.";
  
  it('renders the segment text correctly', () => {
    const { getByText } = render(
      <FeedSlide
        segment={segment}
        isActive={true}
        isPlaying={true}
        currentCharIndex={-1}
        videoSource="mock-video.mp4"
      />
    );

    // Should find individual words (renderWord uses inline Text for each word)
    expect(getByText(/This/)).toBeTruthy();
    expect(getByText(/test/)).toBeTruthy();
    expect(getByText(/reader/)).toBeTruthy();
  });
});
