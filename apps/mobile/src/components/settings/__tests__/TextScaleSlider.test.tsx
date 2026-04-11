import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextScaleSlider } from '../TextScaleSlider';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('TextScaleSlider', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <TextScaleSlider scale={100} onChange={onChange} />
    );
    
    expect(getByText('Text Scale')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
  });

  it('calls onChange with incremented value when plus is pressed', () => {
    const { getByTestId } = render(
      <TextScaleSlider scale={100} onChange={onChange} />
    );
    
    const plusButton = getByTestId('increment-button');
    fireEvent.press(plusButton);
    
    expect(onChange).toHaveBeenCalledWith(110);
  });

  it('calls onChange with decremented value when minus is pressed', () => {
    const { getByTestId } = render(
      <TextScaleSlider scale={100} onChange={onChange} />
    );
    
    const minusButton = getByTestId('decrement-button');
    fireEvent.press(minusButton);
    
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('clamps value between 80 and 150', () => {
    const { getByTestId, rerender } = render(
      <TextScaleSlider scale={150} onChange={onChange} />
    );
    
    const plusButton = getByTestId('increment-button');
    fireEvent.press(plusButton);
    expect(onChange).toHaveBeenCalledWith(150); // Still 150

    rerender(<TextScaleSlider scale={80} onChange={onChange} />);
    const minusButton = getByTestId('decrement-button');
    fireEvent.press(minusButton);
    expect(onChange).toHaveBeenCalledWith(80); // Still 80
  });
});
