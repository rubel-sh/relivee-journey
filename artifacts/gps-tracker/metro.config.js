const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const WEB_STUBS = {
  "react-native-maps": path.resolve(__dirname, "modules/react-native-maps.web.tsx"),
  "react-native-webview": path.resolve(__dirname, "modules/react-native-webview.web.tsx"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBS[moduleName]) {
    return { filePath: WEB_STUBS[moduleName], type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
