import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Feed } from '../Feed';
import * as Speech from 'expo-speech';
import { Dimensions } from 'react-native';

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
      expect(Speech.speak).toHaveBeenCalledWith('Segment 1', expect.any(Object));
    }, { timeout: 1000 });
  });

  it('switches segments when scrolled', async () => {
    const { getByText, getByTestId } = render(
      <Feed segments={segments} documentId={documentId} />
    );

    await waitFor(() => expect(Speech.speak).toHaveBeenCalledWith('Segment 1', expect.any(Object)));

    // Mock scrolling to second segment
    // ScrollView height is 'height' which is mocked by Dimensions.get('window')
    // Since we can't easily trigger native scroll events that RN would pick up as MomentumScrollEnd
    // we manually call the handler if we can, or we simulate the event.
    // In our Feed component, we have handleMomentumScrollEnd.
    
    // Most RNTL users simulate the event on the ScrollView
    const scrollView = getByTestId('tap-to-playback').children[0];
    
    // Simulate scroll to index 1 (y = height)
    // We need to know what 'height' is. It's from Dimensions.get('window').
    // By default in jest-expo it might be 1334 or something.
    const { height } = Dimensions.get('window');
    
    fireEvent(scrollView, 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { y: height },
        layoutMeasurement: { height },
        contentSize: { height: height * 3 },
      },
    });

    await waitFor(() => {
      expect(getByText('Short 2 / 3')).toBeTruthy();
      expect(Speech.speak).toHaveBeenCalledWith('Segment 2', expect.any(Object));
    });
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
