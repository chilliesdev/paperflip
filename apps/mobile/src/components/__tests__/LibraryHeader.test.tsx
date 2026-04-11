import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LibraryHeader } from '../LibraryHeader';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('LibraryHeader', () => {
  it('renders correctly', () => {
    const onSearchChange = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <LibraryHeader searchQuery="" onSearchChange={onSearchChange} />
    );
    
    expect(getByText('My')).toBeTruthy();
    expect(getByText('Library')).toBeTruthy();
    expect(getByPlaceholderText('Search your stories...')).toBeTruthy();
  });

  it('calls onSearchChange when typing', () => {
    const onSearchChange = jest.fn();
    const { getByPlaceholderText } = render(
      <LibraryHeader searchQuery="" onSearchChange={onSearchChange} />
    );
    
    const input = getByPlaceholderText('Search your stories...');
    fireEvent.changeText(input, 'test search');
    
    expect(onSearchChange).toHaveBeenCalledWith('test search');
  });
});
