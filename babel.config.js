module.exports = function (api) {
  // Metro passes platform via caller — skip the Reanimated Babel plugin on web
  // because it scans every module for `worklet` tags and hangs on certain packages
  const isWeb = api.caller((caller) => caller?.platform === "web");
  api.cache(() => isWeb);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: isWeb ? [] : ["react-native-reanimated/plugin"],
  };
};
