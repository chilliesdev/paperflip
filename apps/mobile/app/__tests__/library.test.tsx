import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import LibraryScreen from '../library';
import * as core from '@paperflip/core';

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  getDb: jest.fn().mockResolvedValue({
    documents: {
      find: jest.fn().mockReturnValue({
        $: {
          subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
        },
      }),
    },
  }),
  getAllDocuments: jest.fn(),
  toggleFavourite: jest.fn(),
  deleteDocument: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Link: ({ children, href, asChild }: any) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable } = require('react-native');
      if (asChild) {
        return React.cloneElement(children, {
          onPress: () => console.log(`Navigating to ${href}`),
        });
      }
      return <Pressable onPress={() => console.log(`Navigating to ${href}`)}>{children}</Pressable>;
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('LibraryScreen', () => {
  const mockDocuments = [
    { documentId: 'doc1', title: 'Document 1', totalSegments: 5, isFavourite: false, lastViewedAt: Date.now() },
    { documentId: 'doc2', title: 'Document 2', totalSegments: 10, isFavourite: true, lastViewedAt: Date.now() - 1000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (core.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);
  });

  it('renders correctly and loads documents', async () => {
    const { getByText, queryByText } = render(<LibraryScreen />);
    
    // Should show loading initially
    // Then should show documents
    await waitFor(() => {
      expect(getByText('doc1')).toBeTruthy();
      expect(getByText('doc2')).toBeTruthy();
    });
    
    expect(getByText('2 Documents')).toBeTruthy();
  });

  it('filters documents based on search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LibraryScreen />);
    
    await waitFor(() => expect(getByText('doc1')).toBeTruthy());
    
    const searchInput = getByPlaceholderText('Search your stories...');
    fireEvent.changeText(searchInput, 'doc1');
    
    expect(getByText('doc1')).toBeTruthy();
    expect(queryByText('doc2')).toBeNull();
    expect(getByText('1 Documents')).toBeTruthy();
  });

  it('switches between grid and list view', async () => {
    const { getByTestId, getByText } = render(<LibraryScreen />);
    
    await waitFor(() => expect(getByText('doc1')).toBeTruthy());
    
    const listButton = getByTestId('list-view-button');
    fireEvent.press(listButton);
    
    // In list view, it should still show documents
    expect(getByText('doc1')).toBeTruthy();
    
    const gridButton = getByTestId('grid-view-button');
    fireEvent.press(gridButton);
    expect(getByText('doc1')).toBeTruthy();
  });

  it('shows empty state when no documents', async () => {
    (core.getAllDocuments as jest.Mock).mockResolvedValue([]);
    
    const { getByText } = render(<LibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('Your library is empty')).toBeTruthy();
    });
  });

  it('shows error state when loading fails', async () => {
    (core.getAllDocuments as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText } = render(<LibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('Failed to load library')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
    });
  });
});
