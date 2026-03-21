import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../index';

jest.mock('expo-pdf-text-extract', () => ({
  extractText: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('App', () => {
  it('renders correctly', async () => {
    const { getByText } = render(<App />);
    await waitFor(() => expect(getByText(/Transform PDFs into immersive stories/i)).toBeTruthy());
  });
});
