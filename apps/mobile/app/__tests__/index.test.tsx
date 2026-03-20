import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../index';

describe('App', () => {
  it('renders correctly', async () => {
    const { getByText } = render(<App />);
    await waitFor(() => expect(getByText('Paperflip Mobile')).toBeTruthy());
  });
});
