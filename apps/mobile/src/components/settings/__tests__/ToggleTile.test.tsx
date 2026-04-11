import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ToggleTile } from '../ToggleTile';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: {
    glyphMap: {
      'auto-stories': 'auto-stories',
    },
  },
}));

// Mock MaterialIcons component
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props: any) => <Text>{props.name}</Text>,
  };
});

describe('ToggleTile', () => {
  const onChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <ToggleTile
        title="Test Title"
        description="Test Description"
        icon="auto-stories"
        checked={false}
        onChange={onChange}
      />
    );
    
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('auto-stories')).toBeTruthy();
  });

  it('calls onChange when pressed', () => {
    const { getByText } = render(
      <ToggleTile
        title="Test Title"
        description="Test Description"
        icon="auto-stories"
        checked={false}
        onChange={onChange}
      />
    );
    
    const tile = getByText('Test Title');
    fireEvent.press(tile);
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const { getByText } = render(
      <ToggleTile
        title="Test Title"
        description="Test Description"
        icon="auto-stories"
        checked={false}
        onChange={onChange}
        disabled={true}
      />
    );
    
    const tile = getByText('Test Title');
    fireEvent.press(tile);
    
    expect(onChange).not.toHaveBeenCalled();
  });
});
