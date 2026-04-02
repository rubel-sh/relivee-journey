import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import Svg, {
  Circle,
  Path,
  G,
} from "react-native-svg";

const { width: W, height: H } = Dimensions.get("window");

const AnimatedG = Animated.createAnimatedComponent(G);

const ROUTE_POINTS = [
  [0.15, 0.55],
  [0.25, 0.35],
  [0.38, 0.58],
  [0.5, 0.3],
  [0.62, 0.52],
  [0.75, 0.28],
  [0.85, 0.48],
];

function buildPath(pts: number[][], size: number): string {
  const mapped = pts.map(([x, y]) => [x * size, y * size]);
  let d = `M ${mapped[0][0].toFixed(1)} ${mapped[0][1].toFixed(1)}`;
  for (let i = 1; i < mapped.length; i++) {
    const mx = ((mapped[i - 1][0] + mapped[i][0]) / 2).toFixed(1);
    const my = ((mapped[i - 1][1] + mapped[i][1]) / 2).toFixed(1);
    d += ` Q ${mapped[i - 1][0].toFixed(1)} ${mapped[i - 1][1].toFixed(1)} ${mx} ${my}`;
  }
  d += ` L ${mapped[mapped.length - 1][0].toFixed(1)} ${mapped[mapped.length - 1][1].toFixed(1)}`;
  return d;
}

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const routeOpacity = useRef(new Animated.Value(0)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  const pinBounce = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(200),

      Animated.parallel([
        Animated.timing(routeOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotProgress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.spring(pinBounce, {
          toValue: 1,
          damping: 8,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.6,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          damping: 14,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      Animated.delay(600),

      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const iconSize = 120;
  const routeSize = W * 0.55;
  const routePath = buildPath(ROUTE_POINTS, routeSize);

  const startPt = { x: ROUTE_POINTS[0][0] * routeSize, y: ROUTE_POINTS[0][1] * routeSize };
  const endPt = {
    x: ROUTE_POINTS[ROUTE_POINTS.length - 1][0] * routeSize,
    y: ROUTE_POINTS[ROUTE_POINTS.length - 1][1] * routeSize,
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#1A2A1A",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        opacity: fadeOut,
      }}
    >
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          marginBottom: 32,
        }}
      >
        <View style={{ width: iconSize, height: iconSize, alignItems: "center", justifyContent: "center" }}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 120 120">
            <Circle cx={60} cy={60} r={56} fill="#6D9E51" />

            <Path
              d="M60 28C49.5 28 41 36.5 41 47c0 14 19 33 19 33s19-19 19-33c0-10.5-8.5-19-19-19z"
              fill="white"
            />
            <Circle cx={60} cy={47} r={8} fill="#6D9E51" />

            <Path
              d="M38 75 Q49 65 60 72 Q71 79 82 69"
              stroke="white"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              opacity={0.7}
            />
            <Path
              d="M35 85 Q48 76 60 82 Q72 88 85 78"
              stroke="white"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              opacity={0.4}
            />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: routeOpacity,
          height: routeSize * 0.65,
          width: routeSize,
          marginBottom: 36,
        }}
      >
        <Svg
          width={routeSize}
          height={routeSize * 0.65}
          viewBox={`0 ${routeSize * 0.18} ${routeSize} ${routeSize * 0.65}`}
        >
          <Path
            d={routePath}
            stroke="rgba(109,158,81,0.3)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={routePath}
            stroke="#6D9E51"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 5"
          />

          <Circle cx={startPt.x} cy={startPt.y} r={6} fill="#6D9E51" opacity={0.3} />
          <Circle cx={startPt.x} cy={startPt.y} r={4} fill="#6D9E51" />

          <AnimatedG
            style={{
              opacity: pinBounce,
              transform: [{ scale: pinBounce }],
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                left: endPt.x - 10,
                top: endPt.y - 10,
                width: 20,
                height: 20,
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Circle cx={10} cy={10} r={8} fill="rgba(109,158,81,0.2)" />
                <Circle cx={10} cy={10} r={5} fill="white" />
                <Circle cx={10} cy={10} r={3} fill="#6D9E51" />
              </Svg>
            </Animated.View>
          </AnimatedG>
        </Svg>
      </Animated.View>

      <Animated.Text
        style={{
          color: "white",
          fontSize: 36,
          fontFamily: "Inter_700Bold",
          letterSpacing: 1.5,
          opacity: textOpacity,
          transform: [{ translateY: textSlide }],
        }}
      >
        Journey
      </Animated.Text>

      <Animated.Text
        style={{
          color: "rgba(109,158,81,0.7)",
          fontSize: 14,
          fontFamily: "Inter_500Medium",
          letterSpacing: 3,
          marginTop: 8,
          opacity: subtitleOpacity,
          textTransform: "uppercase",
        }}
      >
        Track · Record · Relive
      </Animated.Text>
    </Animated.View>
  );
}
