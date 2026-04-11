
const React = require('react');

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }) => React.createElement(React.Fragment, null, children),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  SafeAreaView: ({ children }) => React.createElement(React.Fragment, null, children),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: (props) => React.createElement(FlatList, props),
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn(),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
  })),
  openDatabaseSync: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
  digestStringAsync: jest.fn().mockResolvedValue('mocked-hash'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}), { virtual: true });

// Mock nativewind
jest.mock('nativewind', () => ({
  styled: (component) => component,
  withExpoSnack: (component) => component,
  useColorScheme: () => ({ colorScheme: 'light', toggleColorScheme: jest.fn() }),
}));

// Set up globals that might be needed
global.console = {
  ...console,
  // ignore specific console errors/warnings if needed
};
