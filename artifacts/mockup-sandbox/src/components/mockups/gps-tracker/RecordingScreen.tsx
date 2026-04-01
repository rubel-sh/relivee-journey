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
  Heart,
  Timer,
  Flame,
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

function PulsingDot() {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#ff4444", boxShadow: "0 0 0 4px rgba(255,68,68,0.22)" }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color: "#ff4444" }}>
        RECORDING
      </span>
    </div>
  );
}

export function RecordingScreen() {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      style={{ background: COLORS.background, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Status bar */}
      <div
        className="flex justify-between items-center px-6 pt-3 pb-1 text-xs font-medium z-10"
        style={{ color: COLORS.text }}
      >
        <span>9:41</span>
        <PulsingDot />
        <span className="font-bold">●●●</span>
      </div>

      {/* Real OSM Map */}
      <div className="w-full relative overflow-hidden" style={{ height: "220px" }}>
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

          {/* GPS trace */}
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

          {/* Start dot */}
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

          {/* Current position */}
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

        {/* Gradient overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-10"
          style={{ background: `linear-gradient(to top, ${COLORS.background}, transparent)` }}
        />

        {/* GPS badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-20 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
        >
          <Navigation size={11} style={{ color: COLORS.accent }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
            GPS ±3 m
          </span>
        </div>

        {/* Activity type badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full z-20 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
        >
          <MapPin size={11} style={{ color: COLORS.primary }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.text }}>
            Running
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className="px-5 pt-3 pb-2">
        <div className="text-center mb-3">
          <div
            className="text-5xl font-black tracking-tight mb-0.5"
            style={{ color: COLORS.text, fontVariantNumeric: "tabular-nums" }}
          >
            28:14
          </div>
          <p className="text-xs font-medium" style={{ color: "#888" }}>
            Duration
          </p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Distance", value: "5.24", unit: "km", icon: MapPin, color: COLORS.primary },
            { label: "Pace", value: "5:23", unit: "/km", icon: Zap, color: COLORS.accent },
            { label: "Calories", value: "312", unit: "kcal", icon: Flame, color: COLORS.trace },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl px-3 py-3 text-center"
              style={{ background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
            >
              <stat.icon size={15} style={{ color: stat.color, margin: "0 auto 4px" }} />
              <div className="text-lg font-bold" style={{ color: COLORS.text }}>
                {stat.value}
              </div>
              <div className="text-[10px] font-medium" style={{ color: "#999" }}>
                {stat.unit}
              </div>
              <div className="text-[9px] font-medium mt-0.5" style={{ color: "#bbb" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Elevation", value: "+64 m", icon: Mountain, color: COLORS.accent },
            { label: "Avg Heart Rate", value: "152 bpm", icon: Heart, color: "#ff6b6b" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}18` }}
              >
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: COLORS.text }}>
                  {stat.value}
                </p>
                <p className="text-[10px]" style={{ color: "#aaa" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Lap / waypoint buttons */}
      <div className="flex items-center justify-center gap-6 px-5 pb-3">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: "white" }}
        >
          <Timer size={20} style={{ color: "#888" }} />
        </button>
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: "white" }}
        >
          <MapPin size={20} style={{ color: "#888" }} />
        </button>
      </div>

      {/* Bottom Nav */}
      <div
        className="relative flex items-center pt-3 pb-5"
        style={{ background: "white", boxShadow: "0 -4px 20px rgba(0,0,0,0.07)" }}
      >
        <button className="flex-1 flex flex-col items-center gap-1">
          <BarChart2 size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Dashboard</span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1">
          <History size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>History</span>
        </button>

        {/* Center spacer */}
        <div className="flex-1" />

        {/* FAB — stop + pause/play */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 flex gap-2">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{ background: "#ff4444", boxShadow: "0 4px 14px rgba(255,68,68,0.4)" }}
          >
            <Square size={18} color="white" fill="white" />
          </button>
          <button
            onClick={() => setPaused(!paused)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-1"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              boxShadow: `0 6px 20px ${COLORS.primary}55`,
            }}
          >
            {paused ? (
              <Play size={22} color="white" fill="white" />
            ) : (
              <Pause size={22} color="white" />
            )}
          </button>
        </div>

        <button className="flex-1 flex flex-col items-center gap-1">
          <Video size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Videos</span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1">
          <User size={22} style={{ color: "#bbb" }} />
          <span className="text-[10px] font-semibold" style={{ color: "#bbb" }}>Profile</span>
        </button>
      </div>
    </div>
  );
}
