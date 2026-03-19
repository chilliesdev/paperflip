module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@paperflip/.*|@react-native/.*|expo-modules-core/.*|@testing-library/react-native/.*|rxdb/.*|rxjs/.*|expo/.*))"
  ],
  setupFilesAfterEnv: ["./jest.setup.cjs"],
  moduleNameMapper: {
    "\\.css$": "identity-obj-proxy",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
