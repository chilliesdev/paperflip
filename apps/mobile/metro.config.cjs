const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow hierarchical lookup to resolve pnpm's nested dependencies
config.resolver.disableHierarchicalLookup = false;

// 4. Prioritize .js, .mjs, .cjs and .json over .ts to avoid resolving to broken .ts files in node_modules/rxdb
config.resolver.sourceExts = ['js', 'mjs', 'cjs', 'jsx', 'json', 'ts', 'tsx'];

module.exports = withNativeWind(config, { input: './global.css' });
