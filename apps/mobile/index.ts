import "react-native-get-random-values";
import { polyfillWebCrypto } from "expo-standard-web-crypto";

// Polyfill Web Crypto for RxDB in React Native
polyfillWebCrypto();

// Just in case, ensure it is on global and globalThis
if (typeof global.crypto !== "object") {
  (global as any).crypto = (globalThis as any).crypto;
}

import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
