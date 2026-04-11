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
  const segment = "This is a test.";
  // Words: This (0-4), is (5-7), a (8-9), test (10-14), . (14-15) - actually regex \S+
  // regex \S+: This (0-4), is (5-7), a (8-9), test. (10-15)
  
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

    expect(getByText('This')).toBeTruthy();
    expect(getByText('is')).toBeTruthy();
    expect(getByText('a')).toBeTruthy();
    expect(getByText('test.')).toBeTruthy();
  });

  it('highlights the active word', () => {
    const { getByText } = render(
      <FeedSlide
        segment={segment}
        isActive={true}
        isPlaying={true}
        currentCharIndex={5} // "is"
        videoSource="mock-video.mp4"
      />
    );

    const activeWord = getByText('is');
    // Based on renderWord: active word has text-[#00FF88] class which we can't easily check,
    // but we can check the style props we added.
    expect(activeWord.props.style).toMatchObject({
      textShadowColor: '#00FF88',
      transform: [{ scale: 1.1 }],
    });

    const inactiveWord = getByText(/This/);
    expect(inactiveWord.props.style).toMatchObject({
      textShadowColor: 'transparent',
      transform: [{ scale: 1 }],
    });
  });

  it('calculates progress correctly', () => {
    const { getByTestId } = render(
      <FeedSlide
        segment={segment}
        isActive={true}
        isPlaying={true}
        currentCharIndex={7.5} // Exactly half of 15
        videoSource="mock-video.mp4"
      />
    );

    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.style).toMatchObject({
      width: '50%',
    });
  });
});
