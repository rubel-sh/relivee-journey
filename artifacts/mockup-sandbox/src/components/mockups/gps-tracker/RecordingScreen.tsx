import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Square,
  Pause,
  Play,
  Video,
  User,
  History,
  BarChart2,
  MapPin,
  Zap,
  Navigation,
  Mountain,
  TrendingUp,
  Film,
  Timer,
  MoreVertical,
} from "lucide-react";

const COLORS = {
  primary: "#6D9E51",
  background: "#EAEFEF",
  text: "#262626",
  trace: "#982598",
  accent: "#088395",
};

const GPS_TRACE: [number, number][] = [
  [48.20480, 16.36880],
  [48.20510, 16.37020],
  [48.20560, 16.37140],
  [48.20620, 16.37230],
  [48.20690, 16.37300],
  [48.20750, 16.37390],
  [48.20810, 16.37480],
  [48.20870, 16.37560],
  [48.20920, 16.37650],
  [48.20970, 16.37730],
  [48.21020, 16.37810],
  [48.21070, 16.37890],
  [48.21120, 16.37960],
  [48.21160, 16.38040],
  [48.21190, 16.38130],
  [48.21200, 16.38230],
  [48.21180, 16.38320],
  [48.21150, 16.38400],
  [48.21100, 16.38460],
  [48.21040, 16.38510],
  [48.20980, 16.38540],
];

const CENTER: [number, number] = [48.20840, 16.37710];

function TileColorFilter() {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPanes().tilePane as HTMLElement;
    pane.style.filter =
      "sepia(18%) hue-rotate(88deg) saturate(0.55) brightness(1.04)";
    return () => {
      pane.style.filter = "";
    };
  }, [map]);
  return null;
}

export function RecordingScreen() {
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);

  const menuActions = [
    {
      icon: Square,
      label: "Stop",
      bg: "#ff4444",
      iconColor: "white",
      fill: true,
    },
    {
      icon: paused ? Play : Pause,
      label: paused ? "Resume" : "Pause",
      bg: COLORS.primary,
      iconColor: "white",
      fill: paused,
      onPress: () => setPaused(!paused),
    },
    {
      icon: Timer,
      label: "Lap",
      bg: "white",
      iconColor: COLORS.accent,
      fill: false,
    },
    {
      icon: MapPin,
      label: "Pin",
      bg: "white",
      iconColor: COLORS.trace,
      fill: false,
    },
  ];

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Map: fills all space above nav ── */}
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          center={CENTER}
          zoom={15}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          <TileColorFilter />
          <Polyline
            positions={GPS_TRACE}
            pathOptions={{
              color: COLORS.trace,
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <CircleMarker
            center={GPS_TRACE[0]}
            radius={6}
            pathOptions={{
              color: "white",
              weight: 2,
              fillColor: COLORS.primary,
              fillOpacity: 1,
            }}
          />
          <CircleMarker
            center={GPS_TRACE[GPS_TRACE.length - 1]}
            radius={9}
            pathOptions={{
              color: "white",
              weight: 2.5,
              fillColor: COLORS.trace,
              fillOpacity: 1,
            }}
          />
          <CircleMarker
            center={GPS_TRACE[GPS_TRACE.length - 1]}
            radius={18}
            pathOptions={{
              color: COLORS.trace,
              weight: 0,
              fillColor: COLORS.trace,
              fillOpacity: 0.18,
            }}
          />
        </MapContainer>

        {/* ── Status bar overlay ── */}
        <div
          className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 pt-3 pb-2 pointer-events-none"
          style={{
            zIndex: 1000,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, transparent 100%)",
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: COLORS.text }}
          >
            9:41
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: "#ff4444",
                boxShadow: "0 0 0 3px rgba(255,68,68,0.25)",
              }}
            />
            <span className="text-xs font-bold" style={{ color: "#ff4444" }}>
              RECORDING
            </span>
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: COLORS.text }}
          >
            ●●●
          </span>
        </div>

        {/* ── Top badges ── */}
        <div className="absolute top-10 left-3 right-3 flex justify-between pointer-events-none" style={{ zIndex: 1000 }}>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Navigation size={11} style={{ color: COLORS.accent }} />
            <span
              className="text-[11px] font-semibold"
              style={{ color: COLORS.text }}
            >
              GPS ±3 m
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            <MapPin size={11} style={{ color: COLORS.primary }} />
            <span
              className="text-[11px] font-semibold"
              style={{ color: COLORS.text }}
            >
              Running
            </span>
          </div>
        </div>

        {/* ── Stats floating card — bottom-left ── */}
        <div
          className="absolute bottom-4 left-3 rounded-2xl px-4 py-3"
          style={{
            zIndex: 1000,
            background: "rgba(255,255,255,0.93)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            minWidth: 220,
          }}
        >
          {/* Timer */}
          <div
            className="text-3xl font-black tracking-tight leading-none mb-2"
            style={{ color: COLORS.text, fontVariantNumeric: "tabular-nums" }}
          >
            28:14
            <span
              className="text-xs font-medium ml-1.5"
              style={{ color: "#aaa" }}
            >
              duration
            </span>
          </div>

          {/* 3 inline stats */}
          <div className="flex gap-3">
            {[
              { icon: MapPin, value: "5.24", unit: "km", color: COLORS.primary },
              { icon: Zap, value: "11.2", unit: "km/h", color: COLORS.accent },
              { icon: Mountain, value: "+64", unit: "m", color: COLORS.trace },
            ].map((s) => (
              <div key={s.unit} className="flex items-center gap-1">
                <s.icon size={12} style={{ color: s.color }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: COLORS.text }}
                >
                  {s.value}
                </span>
                <span className="text-[10px]" style={{ color: "#aaa" }}>
                  {s.unit}
                </span>
              </div>
            ))}
          </div>

          {/* Secondary row */}
          <div
            className="flex gap-3 mt-1.5 pt-1.5"
            style={{ borderTop: "1px solid #f0f0f0" }}
          >
            <div className="flex items-center gap-1">
              <TrendingUp size={11} style={{ color: COLORS.primary }} />
              <span className="text-[11px] font-semibold" style={{ color: "#666" }}>
                14.8 km/h max
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Film size={11} style={{ color: COLORS.trace }} />
              <span className="text-[11px] font-semibold" style={{ color: "#666" }}>
                4K · 60fps
              </span>
            </div>
          </div>
        </div>

        {/* ── Dots menu — bottom-right ── */}
        <div className="absolute bottom-4 right-3 flex flex-col items-center gap-2" style={{ zIndex: 1000 }}>
          {/* Expanded action buttons (shown stacked above the trigger) */}
          {menuOpen && (
            <div className="flex flex-col items-center gap-2">
              {menuActions.map((action) => (
                <div key={action.label} className="flex items-center gap-2 justify-end">
                  {/* Label pill */}
                  <div
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.93)",
                      backdropFilter: "blur(8px)",
                      color: COLORS.text,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {action.label}
                  </div>
                  {/* Action button */}
                  <button
                    onClick={action.onPress}
                    className="rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: action.bg,
                      boxShadow:
                        action.bg === "#ff4444"
                          ? "0 4px 14px rgba(255,68,68,0.4)"
                          : action.bg === COLORS.primary
                          ? `0 4px 14px ${COLORS.primary}55`
                          : "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <action.icon
                      size={18}
                      color={action.iconColor}
                      fill={action.fill ? action.iconColor : "none"}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ⋮ trigger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full flex items-center justify-center shadow-xl"
            style={{
              width: 44,
              height: 44,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            }}
          >
            <MoreVertical size={20} style={{ color: COLORS.text }} />
          </button>
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <div
        className="flex items-center pb-5"
        style={{
          background: "white",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
        }}
      >
        <button className="flex-1 flex flex-col items-center gap-1 pt-3">
          <BarChart2 size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Dashboard
          </span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1 pt-3">
          <History size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            History
          </span>
        </button>

        {/* FAB — inline pause/resume */}
        <button
          onClick={() => setPaused(!paused)}
          className="flex-1 flex items-center justify-center pt-2"
        >
          <div
            className="rounded-full flex items-center justify-center shadow-md"
            style={{
              width: 52,
              height: 52,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              boxShadow: `0 4px 16px ${COLORS.primary}55`,
            }}
          >
            {paused ? (
              <Play size={22} color="white" fill="white" />
            ) : (
              <Pause size={22} color="white" />
            )}
          </div>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1 pt-3">
          <Video size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Videos
          </span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1 pt-3">
          <User size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>
            Profile
          </span>
        </button>
      </div>
    </div>
  );
}
