import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VideoLengthDial } from '../VideoLengthDial';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('VideoLengthDial', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <VideoLengthDial value={60} onChange={onChange} />
    );
    
    expect(getByText('Video Length')).toBeTruthy();
    expect(getByTestId('duration-label').props.children).toBe('60s');
  });

  it('calls onChange when an option is pressed', () => {
    const { getByText } = render(
      <VideoLengthDial value={60} onChange={onChange} />
    );
    
    // Finding by text '90s' might still be ambiguous if it was in two places,
    // but in VideoLengthDial, options are rendered in a loop, and the main label is separate.
    // If there's only one '90s' in the options, it should be fine.
    const ninetyLabel = getByText('90s');
    fireEvent.press(ninetyLabel);
    
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('renders correctly with different values', () => {
    const { getByTestId } = render(
      <VideoLengthDial value={180} onChange={onChange} />
    );
    
    // 180s should be displayed as 3m
    expect(getByTestId('duration-label').props.children).toBe('3m');
  });
});
