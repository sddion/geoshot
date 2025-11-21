module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};