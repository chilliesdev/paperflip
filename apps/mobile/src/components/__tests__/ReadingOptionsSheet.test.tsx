import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReadingOptionsSheet } from '../ReadingOptionsSheet';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}));

describe('ReadingOptionsSheet', () => {
  const onClose = jest.fn();
  const onPlaybackRateChange = jest.fn();
  const onAutoScrollToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <ReadingOptionsSheet
        visible={true}
        onClose={onClose}
        playbackRate={1.0}
        onPlaybackRateChange={onPlaybackRateChange}
        autoScroll={true}
        onAutoScrollToggle={onAutoScrollToggle}
      />
    );
    
    expect(getByText('Adjust Speed')).toBeTruthy();
    expect(getByText('Auto Scroll')).toBeTruthy();
    expect(getByText('1x')).toBeTruthy();
    expect(getByText('1.5x')).toBeTruthy();
  });

  it('calls onPlaybackRateChange when rate is pressed', () => {
    const { getByText } = render(
      <ReadingOptionsSheet
        visible={true}
        onClose={onClose}
        playbackRate={1.0}
        onPlaybackRateChange={onPlaybackRateChange}
        autoScroll={true}
        onAutoScrollToggle={onAutoScrollToggle}
      />
    );
    
    const rateButton = getByText('1.5x');
    fireEvent.press(rateButton);
    
    expect(onPlaybackRateChange).toHaveBeenCalledWith(1.5);
  });

  it('calls onAutoScrollToggle when toggle is pressed', () => {
    const { getByTestId } = render(
      <ReadingOptionsSheet
        visible={true}
        onClose={onClose}
        playbackRate={1.0}
        onPlaybackRateChange={onPlaybackRateChange}
        autoScroll={true}
        onAutoScrollToggle={onAutoScrollToggle}
      />
    );
    
    const toggle = getByTestId('auto-scroll-toggle');
    fireEvent.press(toggle);
    
    expect(onAutoScrollToggle).toHaveBeenCalled();
  });
});
