import React, { forwardRef } from "react";
import { View } from "react-native";

const WebView = forwardRef<any, any>(({ source, style, ...props }, ref) => {
  if (source?.html) {
    return (
      <View style={[{ flex: 1 }, style]}>
        <iframe
          ref={ref as any}
          srcDoc={source.html}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </View>
    );
  }
  return <View style={[{ flex: 1 }, style]} />;
});

WebView.displayName = "WebView";

export { WebView };
export default WebView;
