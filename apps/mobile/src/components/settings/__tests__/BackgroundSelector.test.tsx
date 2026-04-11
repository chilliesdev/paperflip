import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackgroundSelector } from '../BackgroundSelector';

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  videoSources: [
    { url: 'url1', previewUrl: 'preview1' },
    { url: 'url2', previewUrl: 'preview2' },
  ],
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('BackgroundSelector', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <BackgroundSelector selected="url1" onChange={onChange} />
    );
    
    expect(getByText('Background')).toBeTruthy();
  });

  it('calls onChange when a background is pressed', () => {
    const { getByTestId } = render(
      <BackgroundSelector selected="url1" onChange={onChange} />
    );
    
    const secondBg = getByTestId('bg-button-url2');
    fireEvent.press(secondBg);
    
    expect(onChange).toHaveBeenCalledWith('url2');
  });
});
