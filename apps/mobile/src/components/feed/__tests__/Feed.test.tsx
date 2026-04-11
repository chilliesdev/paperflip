import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Feed } from '../Feed';
import * as Speech from 'expo-speech';

// Mock @paperflip/core
jest.mock('@paperflip/core', () => ({
  splitSentences: jest.fn((text) => [{ text, start: 0, end: text.length }]),
  videoSources: [{ url: 'mock-video-url' }],
  updateDocumentProgress: jest.fn(),
  getSettings: jest.fn().mockResolvedValue({
    videoLength: 10,
    karaokeMode: true,
    autoResume: true,
    playbackSpeed: 1.0,
  }),
  updateSettings: jest.fn(),
  DEFAULT_SETTINGS: {
    videoLength: 10,
    karaokeMode: true,
    autoResume: true,
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  resume: jest.fn(),
}));

// Mock expo-av and FeedSlide
jest.mock('../FeedSlide', () => ({
  FeedSlide: ({ segment }: { segment: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{segment}</Text>;
  }
}));

describe('Feed', () => {
  const segments = ["Segment 1", "Segment 2", "Segment 3"];
  const documentId = "doc123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with segments', () => {
    const { getByText } = render(
      <Feed segments={segments} documentId={documentId} />
    );

    expect(getByText('Segment 1')).toBeTruthy();
    expect(getByText('Short 1 / 3')).toBeTruthy();
  });

  it('starts speaking on mount after delay', async () => {
    render(<Feed segments={segments} documentId={documentId} />);
    
    // Feed has a setTimeout of 500ms on mount to start speaking
    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('stops speaking and goes back when back button pressed', async () => {
    const { getByTestId } = render(
      <Feed segments={segments} documentId={documentId} />
    );

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    await waitFor(() => {
      expect(Speech.stop).toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('toggles playback when the play/pause button is pressed', async () => {
    const { getByTestId } = render(
      <Feed segments={segments} documentId={documentId} />
    );

    // Initial state after mount should be playing (after 500ms)
    await waitFor(() => {
      expect(Speech.speak).toHaveBeenCalled();
    });

    const toggleButton = getByTestId('tap-to-playback');
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(Speech.pause).toHaveBeenCalled();
    });

    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(Speech.resume).toHaveBeenCalled();
    });
  });
});
