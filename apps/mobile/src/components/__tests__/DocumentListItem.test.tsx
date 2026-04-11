import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DocumentListItem } from '../DocumentListItem';

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

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('DocumentListItem', () => {
  const mockDocument = {
    documentId: 'test-doc-123',
    totalSegments: 10,
    currentSegmentIndex: 2,
    currentSegmentProgress: 5,
    currentSegmentLength: 10,
    thumbnailUri: null,
  };

  it('renders correctly', () => {
    const { getByText } = render(<DocumentListItem document={mockDocument} />);
    
    expect(getByText('test-doc-123')).toBeTruthy();
    expect(getByText('10 segments • PDF')).toBeTruthy();
  });

  it('calls onShowOptions when more icon is pressed', () => {
    const onShowOptions = jest.fn();
    const { getByTestId } = render(
      <DocumentListItem document={mockDocument} onShowOptions={onShowOptions} />
    );
    
    const moreButton = getByTestId('more-options-button');
    fireEvent.press(moreButton, { stopPropagation: jest.fn() });
    
    expect(onShowOptions).toHaveBeenCalledWith(mockDocument);
  });
});
