/* eslint-disable @typescript-eslint/no-explicit-any */
import "react-native-get-random-values";
import { polyfillWebCrypto } from "expo-standard-web-crypto";

// Polyfill Web Crypto for RxDB in React Native
polyfillWebCrypto();

// Just in case, ensure it is on global and globalThis
if (typeof global.crypto !== "object") {
  (global as { crypto?: any }).crypto = (globalThis as { crypto?: any }).crypto;
}


import "expo-router/entry";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
