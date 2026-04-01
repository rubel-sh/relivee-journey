import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
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

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
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
      className="flex-row items-center border-t pt-2"
      style={{
        paddingBottom,
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {leftRoutes.map((route, i) => {
        const isFocused = state.index === i;
        const cfg = TAB_CONFIG[route.name];
        return (
          <TouchableOpacity
            key={route.key}
            className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]"
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
              className="text-[10px] font-inter-semibold"
              style={{ color: isFocused ? colors.primary : colors.mutedForeground }}
            >
              {cfg?.label}
            </Text>
            {isFocused && (
              <View className="w-1 h-1 rounded-full mt-px" style={{ backgroundColor: colors.primary }} />
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]"
        onPress={onFABPress}
        activeOpacity={0.85}
        testID="tab-record"
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-[52px] h-[52px] rounded-[26px] items-center justify-center"
          style={{ shadowColor: "#6D9E51", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
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
            className="flex-1 items-center justify-center pt-1 gap-[3px] min-h-[50px]"
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
              className="text-[10px] font-inter-semibold"
              style={{ color: isFocused ? colors.primary : colors.mutedForeground }}
            >
              {cfg?.label}
            </Text>
            {isFocused && (
              <View className="w-1 h-1 rounded-full mt-px" style={{ backgroundColor: colors.primary }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
