import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import App from './App';
import { DEFAULT_SETTINGS, getDb } from '@paperflip/core';

describe('App', () => {
  it('renders correctly and initializes database', async () => {
    render(<App />);

    // Verify paperflip core imports are working correctly and being displayed
    expect(screen.getByText('Paperflip Mobile')).toBeTruthy();
    expect(screen.getByText(`Default Video Length: ${DEFAULT_SETTINGS.videoLength}s`)).toBeTruthy();
    expect(
      screen.getByText(`Karaoke Mode: ${DEFAULT_SETTINGS.karaokeMode ? 'Enabled' : 'Disabled'}`)
    ).toBeTruthy();

    // Verify DB initial state
    expect(screen.getByText('Initializing DB...')).toBeTruthy();

    // Verify that DB initialization completes
    await waitFor(() => {
      expect(screen.getByText('DB Initialized Successfully!')).toBeTruthy();
    });

    // Ensure getDb was called successfully (since state updated)
    const db = await getDb();
    expect(db).toBeDefined();
  });
});
