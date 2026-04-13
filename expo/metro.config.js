const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = (config.resolver.sourceExts || []).filter(
  (ext) => ext !== 'txt'
);
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'txt'];

module.exports = config;
