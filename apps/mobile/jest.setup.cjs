
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
  digestStringAsync: jest.fn(),
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
