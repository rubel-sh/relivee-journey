import React from "react";
import { View, StyleSheet } from "react-native";

const MapView = React.forwardRef<any, any>(({ style, children }, ref) => (
  <View
    ref={ref}
    style={[styles.map, style]}
  >
    <View style={styles.placeholder} />
    {children}
  </View>
));
MapView.displayName = "MapView";

export default MapView;

export const Polyline = () => null;
export const Circle = () => null;
export const Marker = () => null;
export const PROVIDER_DEFAULT = null;
export const PROVIDER_GOOGLE = null;

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: "#d4e0c8",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#d4e0c8",
  },
});
