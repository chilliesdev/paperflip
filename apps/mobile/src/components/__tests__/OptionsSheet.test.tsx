import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionsSheet } from '../OptionsSheet';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('OptionsSheet', () => {
  const mockDocument = {
    documentId: 'test-doc-123',
    isFavourite: false,
  };
  const onClose = jest.fn();
  const onDelete = jest.fn();
  const onToggleFavourite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <OptionsSheet
        visible={true}
        document={mockDocument}
        onClose={onClose}
        onDelete={onDelete}
        onToggleFavourite={onToggleFavourite}
      />
    );
    
    expect(getByText('Set as Favourite')).toBeTruthy();
    expect(getByText('Delete Document')).toBeTruthy();
  });

  it('calls onToggleFavourite when favourite button is pressed', () => {
    const { getByText } = render(
      <OptionsSheet
        visible={true}
        document={mockDocument}
        onClose={onClose}
        onDelete={onDelete}
        onToggleFavourite={onToggleFavourite}
      />
    );
    
    const favouriteButton = getByText('Set as Favourite');
    fireEvent.press(favouriteButton);
    
    expect(onToggleFavourite).toHaveBeenCalledWith('test-doc-123');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is pressed', () => {
    const { getByText } = render(
      <OptionsSheet
        visible={true}
        document={mockDocument}
        onClose={onClose}
        onDelete={onDelete}
        onToggleFavourite={onToggleFavourite}
      />
    );
    
    const deleteButton = getByText('Delete Document');
    fireEvent.press(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith('test-doc-123');
    expect(onClose).toHaveBeenCalled();
  });

  it('returns null when document is not provided', () => {
    const { queryByText } = render(
      <OptionsSheet
        visible={true}
        document={null}
        onClose={onClose}
        onDelete={onDelete}
        onToggleFavourite={onToggleFavourite}
      />
    );
    
    expect(queryByText('Delete Document')).toBeNull();
  });
});
