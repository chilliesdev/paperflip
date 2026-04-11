import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import FeedScreen from '../feed';
import * as core from '@paperflip/core';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  getDb: jest.fn().mockResolvedValue({}),
  getDocument: jest.fn(),
  getSettings: jest.fn(),
  resegmentDocument: jest.fn(),
  DEFAULT_SETTINGS: {
    videoLength: 60,
    autoResume: true,
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
  })),
}));

// Mock Feed component to avoid complex speech/video logic in screen test
jest.mock('../../src/components/feed/Feed', () => ({
  Feed: ({ segments, documentId }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    return (
      <View testID="mock-feed">
        <Text>Feed for {documentId}</Text>
        <Text>{segments.length} segments</Text>
      </View>
    );
  },
}));

describe('FeedScreen', () => {
  const mockRouter = { back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'test-doc-123' });
    (core.getSettings as jest.Mock).mockResolvedValue({
      videoLength: 60,
      autoResume: true,
    });
  });

  it('renders loading state initially', () => {
    (core.getDocument as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    const { getByText } = render(<FeedScreen />);
    expect(getByText('Loading feed...')).toBeTruthy();
  });

  it('renders feed when document is loaded', async () => {
    const mockDoc = {
      documentId: 'test-doc-123',
      segments: ['S1', 'S2'],
      videoLengthAtSegmentation: 60,
    };
    (core.getDocument as jest.Mock).mockResolvedValue(mockDoc);

    const { getByTestId, getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByTestId('mock-feed')).toBeTruthy();
      expect(getByText('Feed for test-doc-123')).toBeTruthy();
      expect(getByText('2 segments')).toBeTruthy();
    });
  });

  it('handles document not found', async () => {
    (core.getDocument as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Document not found')).toBeTruthy();
    });

    const goBackButton = getByText('Go back');
    fireEvent.press(goBackButton);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('triggers resegmentation if videoLength mismatched', async () => {
    const mockDoc = {
      documentId: 'test-doc-123',
      segments: ['S1', 'S2'],
      videoLengthAtSegmentation: 30, // Mismatch with settings 60
      fullText: 'Full text content',
    };
    (core.getDocument as jest.Mock).mockResolvedValue(mockDoc);
    
    let resolveResegment: (val: any) => void = () => {};
    const resegmentPromise = new Promise((resolve) => {
      resolveResegment = resolve;
    });
    (core.resegmentDocument as jest.Mock).mockReturnValue(resegmentPromise);

    const resegmentedDoc = {
      ...mockDoc,
      videoLengthAtSegmentation: 60,
      segments: ['RS1', 'RS2', 'RS3'],
    };

    const { getByText } = render(<FeedScreen />);

    // Should see "Resegmenting..."
    await waitFor(() => {
      expect(getByText('Resegmenting...')).toBeTruthy();
    }, { timeout: 2000 });

    // Now resolve
    resolveResegment(resegmentedDoc);

    await waitFor(() => {
      expect(core.resegmentDocument).toHaveBeenCalledWith('test-doc-123', 60);
      expect(getByText('3 segments')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('handles error during loading', async () => {
    (core.getDocument as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Failed to load document')).toBeTruthy();
    });
  });
});
