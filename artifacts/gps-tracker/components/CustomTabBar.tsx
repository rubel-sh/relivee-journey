import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";

const TAB_CONFIG: Record<
  string,
  { outline: string; filled: string; label: string }
> = {
  index: { outline: "bar-chart-outline", filled: "bar-chart", label: "Dashboard" },
  history: { outline: "time-outline", filled: "time", label: "History" },
  videos: { outline: "videocam-outline", filled: "videocam", label: "Videos" },
  profile: { outline: "person-outline", filled: "person", label: "Profile" },
};

export function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const paddingBottom = isWeb ? 34 : insets.bottom;

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const onTabPress = (routeName: string, routeKey: string, index: number) => {
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
      Haptics.selectionAsync();
    }
  };

  const onFABPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/recording" as never);
  };

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {leftRoutes.map((route, i) => {
        const isFocused = state.index === i;
        const cfg = TAB_CONFIG[route.name];
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => onTabPress(route.name, route.key, i)}
            activeOpacity={0.7}
            testID={`tab-${route.name}`}
          >
            <Icon
              name={isFocused ? cfg?.filled : cfg?.outline}
              size={22}
              color={isFocused ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.mutedForeground },
              ]}
            >
              {cfg?.label}
            </Text>
            {isFocused && (
              <View
                style={[styles.activeDot, { backgroundColor: colors.primary }]}
              />
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.tab}
        onPress={onFABPress}
        activeOpacity={0.85}
        testID="tab-record"
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Icon name="play" size={22} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {rightRoutes.map((route, i) => {
        const actualIndex = i + 2;
        const isFocused = state.index === actualIndex;
        const cfg = TAB_CONFIG[route.name];
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => onTabPress(route.name, route.key, actualIndex)}
            activeOpacity={0.7}
            testID={`tab-${route.name}`}
          >
            <Icon
              name={isFocused ? cfg?.filled : cfg?.outline}
              size={22}
              color={isFocused ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.mutedForeground },
              ]}
            >
              {cfg?.label}
            </Text>
            {isFocused && (
              <View
                style={[styles.activeDot, { backgroundColor: colors.primary }]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    gap: 3,
    minHeight: 50,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D9E51",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
