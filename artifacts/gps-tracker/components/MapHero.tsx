import React, { useMemo } from "react";
import { Platform, View } from "react-native";
import { Coordinate } from "@/context/ActivityContext";

let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").default;
  } catch {}
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLeafletHTML(
  coords: Coordinate[],
  startLabel: string,
  endLabel: string,
  accentColor: string
): string {
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padLat = (maxLat - minLat) * 0.15 || 0.002;
  const padLon = (maxLon - minLon) * 0.15 || 0.002;

  const coordsJson = JSON.stringify(coords.map((c) => [c.latitude, c.longitude]));
  const startCoord = `[${coords[0].latitude}, ${coords[0].longitude}]`;
  const endCoord = `[${coords[coords.length - 1].latitude}, ${coords[coords.length - 1].longitude}]`;

  const safeStartLabel = escapeHtml(startLabel);
  const safeEndLabel = escapeHtml(endLabel);
  const safeColor = escapeHtml(accentColor);

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#e8e8e8}
  .marker-label{
    background:white;padding:3px 8px;border-radius:12px;
    font:600 11px/1.2 -apple-system,sans-serif;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;
    border:2px solid ${safeColor};color:#222;
  }
  .start-dot,.end-dot{
    width:16px;height:16px;border-radius:50%;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  }
  .start-dot{background:#22c55e}
  .end-dot{background:#ef4444}
</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map',{
  zoomControl:false,attributionControl:false,
  dragging:true,scrollWheelZoom:true,touchZoom:true
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19
}).addTo(map);

var bounds = [[${minLat - padLat},${minLon - padLon}],[${maxLat + padLat},${maxLon + padLon}]];
map.fitBounds(bounds);

var coords = ${coordsJson};

L.polyline(coords,{
  color:'white',weight:8,opacity:0.3,
  lineCap:'round',lineJoin:'round'
}).addTo(map);

L.polyline(coords,{
  color:'${safeColor}',weight:4,opacity:0.9,
  lineCap:'round',lineJoin:'round'
}).addTo(map);

var startIcon = L.divIcon({
  className:'',
  html:'<div class="start-dot"></div>',
  iconSize:[16,16],iconAnchor:[8,8]
});
var endIcon = L.divIcon({
  className:'',
  html:'<div class="end-dot"></div>',
  iconSize:[16,16],iconAnchor:[8,8]
});

L.marker(${startCoord},{icon:startIcon}).addTo(map);
L.marker(${endCoord},{icon:endIcon}).addTo(map);

if('${safeStartLabel}'){
  var sLabel = L.divIcon({
    className:'',
    html:'<div class="marker-label" style="border-color:#22c55e">${safeStartLabel}</div>',
    iconSize:[0,0],iconAnchor:[-12,8]
  });
  L.marker(${startCoord},{icon:sLabel}).addTo(map);
}
if('${safeEndLabel}'){
  var eLabel = L.divIcon({
    className:'',
    html:'<div class="marker-label" style="border-color:#ef4444">${safeEndLabel}</div>',
    iconSize:[0,0],iconAnchor:[-12,8]
  });
  L.marker(${endCoord},{icon:eLabel}).addTo(map);
}
<\/script>
</body></html>`;
}

function WebFallback({
  coords,
  accentColor,
  height,
}: {
  coords: Coordinate[];
  accentColor: string;
  height: number;
}) {
  const html = useMemo(() => {
    return buildLeafletHTML(coords, "", "", accentColor);
  }, [coords, accentColor]);

  return (
    <iframe
      srcDoc={html}
      style={{ width: "100%", height, border: "none" }}
      sandbox="allow-scripts"
    />
  );
}

function MapHeroView({
  coords,
  startLabel,
  endLabel,
  accentColor,
  height,
}: {
  coords: Coordinate[];
  startLabel: string;
  endLabel: string;
  accentColor: string;
  height: number;
}) {
  const html = useMemo(
    () => buildLeafletHTML(coords, startLabel, endLabel, accentColor),
    [coords, startLabel, endLabel, accentColor]
  );

  if (Platform.OS === "web") {
    return (
      <WebFallback
        coords={coords}
        accentColor={accentColor}
        height={height}
      />
    );
  }

  if (!WebView) {
    return <View style={{ height, backgroundColor: "#ddd" }} />;
  }

  return (
    <WebView
      source={{ html }}
      style={{ height, width: "100%" }}
      scrollEnabled={false}
      javaScriptEnabled
      originWhitelist={["*"]}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default React.memo(MapHeroView);
