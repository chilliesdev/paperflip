import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../settings';
import * as core from '@paperflip/core';

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  getSettings: jest.fn().mockResolvedValue({
    videoLength: 60,
    autoResume: true,
    darkMode: true,
    textScale: 110,
    backgroundUrl: 'url1',
  }),
  updateSettings: jest.fn(),
  videoSources: [
    { url: 'url1', previewUrl: 'preview1' },
    { url: 'url2', previewUrl: 'preview2' },
  ],
  getAllDocuments: jest.fn().mockResolvedValue([]),
  resegmentDocument: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and loads settings', async () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);
    
    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
      expect(getByTestId('duration-label').props.children).toBe('60s');
      expect(getByText('110%')).toBeTruthy();
    });
  });

  it('updates setting when changed', async () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);
    
    await waitFor(() => expect(getByText('Settings')).toBeTruthy());
    
    // Toggle Auto-Resume
    const autoResumeTile = getByText('Auto-Resume');
    fireEvent.press(autoResumeTile);
    
    expect(core.updateSettings).toHaveBeenCalledWith({ autoResume: false });
    
    // Change Video Length
    const ninetyLabel = getByText('90s');
    fireEvent.press(ninetyLabel);
    
    expect(core.updateSettings).toHaveBeenCalledWith({ videoLength: 90 });
  });

  it('resegments documents when videoLength is changed', async () => {
    (core.getAllDocuments as jest.Mock).mockResolvedValue([
      { documentId: 'doc1' },
      { documentId: 'doc2' },
    ]);
    
    const { getByText } = render(<SettingsScreen />);
    
    await waitFor(() => expect(getByText('Settings')).toBeTruthy());
    
    const ninetyLabel = getByText('90s');
    fireEvent.press(ninetyLabel);
    
    await waitFor(() => {
      expect(core.resegmentDocument).toHaveBeenCalledWith('doc1', 90);
      expect(core.resegmentDocument).toHaveBeenCalledWith('doc2', 90);
    });
  });
});
