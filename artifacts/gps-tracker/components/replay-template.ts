import { Coordinate } from "@/context/ActivityContext";

interface ReplayConfig {
  coordinates: Coordinate[];
  activityType: string;
  distance: number;
  duration: number;
  elevationGain: number;
  activityName: string;
}

const TYPE_COLORS: Record<string, string> = {
  run: "#6D9E51",
  cycle: "#088395",
  hike: "#8B6914",
  walk: "#5B7070",
};

export function buildReplayHtml(config: ReplayConfig): string {
  const color = TYPE_COLORS[config.activityType] || "#6D9E51";
  const coordsJson = JSON.stringify(
    config.coordinates.map((c) => [c.latitude, c.longitude])
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
#map{width:100%;height:100%;position:absolute;top:0;left:0}
.stats-overlay{position:absolute;bottom:20px;left:12px;right:12px;z-index:1000;
  background:rgba(10,10,20,0.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-radius:16px;padding:14px 16px;color:#fff;border:1px solid rgba(255,255,255,0.08)}
.stats-row{display:flex;justify-content:space-between;align-items:center}
.stat-item{text-align:center;flex:1}
.stat-value{font-size:18px;font-weight:700;letter-spacing:-0.3px}
.stat-label{font-size:10px;opacity:0.55;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px}
.progress-bar{width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:12px;overflow:hidden}
.progress-fill{height:100%;background:${color};border-radius:2px;width:0%;transition:width 0.3s linear}
.speed-badge{position:absolute;top:16px;right:12px;z-index:1000;
  background:rgba(10,10,20,0.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-radius:20px;padding:6px 14px;color:#fff;font-size:12px;font-weight:600;
  border:1px solid rgba(255,255,255,0.1);cursor:pointer;-webkit-tap-highlight-color:transparent}
.activity-badge{position:absolute;top:16px;left:12px;z-index:1000;
  background:rgba(10,10,20,0.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-radius:20px;padding:6px 14px;color:#fff;font-size:12px;font-weight:600;
  border:1px solid rgba(255,255,255,0.1)}
.play-overlay{position:absolute;inset:0;z-index:2000;display:flex;align-items:center;
  justify-content:center;background:rgba(0,0,0,0.45);cursor:pointer;-webkit-tap-highlight-color:transparent}
.play-btn{width:64px;height:64px;border-radius:50%;background:${color};display:flex;
  align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.4)}
.play-btn svg{margin-left:4px}
.hidden{display:none}
.leaflet-control-zoom,.leaflet-control-attribution{display:none!important}
</style>
</head>
<body>
<div id="map"></div>

<div class="activity-badge" id="actBadge">${config.activityName}</div>
<div class="speed-badge" id="speedBadge" onclick="cycleSpeed()">1x</div>

<div class="play-overlay" id="playOverlay" onclick="startReplay()">
  <div class="play-btn">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21"/></svg>
  </div>
</div>

<div class="stats-overlay" id="statsOverlay">
  <div class="stats-row">
    <div class="stat-item">
      <div class="stat-value" id="distVal">0.00</div>
      <div class="stat-label">km</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="timeVal">00:00</div>
      <div class="stat-label">time</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="elevVal">0</div>
      <div class="stat-label">elev m</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="speedVal">0.0</div>
      <div class="stat-label">km/h</div>
    </div>
  </div>
  <div class="progress-bar"><div class="progress-fill" id="progFill"></div></div>
</div>

<script>
var COORDS = ${coordsJson};
var TOTAL_DIST = ${config.distance};
var TOTAL_DUR = ${config.duration};
var TOTAL_ELEV = ${config.elevationGain};
var COLOR = "${color}";

var map = L.map("map",{zoomControl:false,attributionControl:false,dragging:true,scrollWheelZoom:true});
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);

if(COORDS.length>1){
  var bounds=L.latLngBounds(COORDS.map(function(c){return[c[0],c[1]]}));
  map.fitBounds(bounds,{padding:[40,40]});
}else if(COORDS.length===1){
  map.setView(COORDS[0],15);
}

var trailLine=L.polyline([],{color:COLOR,weight:4,opacity:0.85,lineCap:"round",lineJoin:"round"}).addTo(map);
var shadowLine=L.polyline([],{color:"#000",weight:8,opacity:0.15,lineCap:"round",lineJoin:"round"}).addTo(map);

var pulseIcon=L.divIcon({
  className:"",
  html:'<div style="width:16px;height:16px;border-radius:50%;background:'+COLOR+';border:3px solid white;box-shadow:0 0 12px rgba(0,0,0,0.35),0 0 0 6px '+COLOR+'33;"></div>',
  iconSize:[16,16],iconAnchor:[8,8]
});
var marker=L.marker(COORDS[0]||[0,0],{icon:pulseIcon}).addTo(map);

var startIcon=L.divIcon({
  className:"",
  html:'<div style="width:12px;height:12px;border-radius:50%;background:white;border:3px solid '+COLOR+';box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize:[12,12],iconAnchor:[6,6]
});

var playing=false;
var currentIdx=0;
var speeds=[1,2,4,8];
var speedIdx=0;
var animFrame=null;
var lastTime=0;

var distEl=document.getElementById("distVal");
var timeEl=document.getElementById("timeVal");
var elevEl=document.getElementById("elevVal");
var speedEl=document.getElementById("speedVal");
var progEl=document.getElementById("progFill");
var overlay=document.getElementById("playOverlay");
var speedBadge=document.getElementById("speedBadge");

function haversine(a,b){
  var R=6371000;
  var dLat=(b[0]-a[0])*Math.PI/180;
  var dLon=(b[1]-a[1])*Math.PI/180;
  var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function formatTime(s){
  var m=Math.floor(s/60);
  var sec=Math.floor(s%60);
  return (m<10?"0":"")+m+":"+(sec<10?"0":"")+sec;
}

function updateStats(idx){
  var frac=idx/(COORDS.length-1||1);
  var dist=TOTAL_DIST*frac/1000;
  var dur=TOTAL_DUR*frac;
  var elev=Math.round(TOTAL_ELEV*frac);
  var spd=dur>0?(dist/(dur/3600)):0;
  distEl.textContent=dist.toFixed(2);
  timeEl.textContent=formatTime(dur);
  elevEl.textContent=elev;
  speedEl.textContent=spd.toFixed(1);
  progEl.style.width=(frac*100).toFixed(1)+"%";
}

function cycleSpeed(){
  speedIdx=(speedIdx+1)%speeds.length;
  speedBadge.textContent=speeds[speedIdx]+"x";
}

function startReplay(){
  overlay.classList.add("hidden");
  currentIdx=0;
  trailLine.setLatLngs([]);
  shadowLine.setLatLngs([]);
  playing=true;

  L.marker(COORDS[0],{icon:startIcon}).addTo(map);

  var baseInterval=TOTAL_DUR*1000/(COORDS.length||1);
  var minInterval=16;

  lastTime=performance.now();

  function step(ts){
    if(!playing)return;
    var dt=ts-lastTime;
    var interval=Math.max(baseInterval/speeds[speedIdx],minInterval);
    if(dt>=interval){
      lastTime=ts;
      if(currentIdx<COORDS.length){
        var ll=COORDS[currentIdx];
        trailLine.addLatLng(ll);
        shadowLine.addLatLng(ll);
        marker.setLatLng(ll);

        if(currentIdx%3===0||currentIdx===COORDS.length-1){
          map.panTo(ll,{animate:true,duration:0.3,easeLinearity:0.5});
        }

        updateStats(currentIdx);
        currentIdx++;
      }else{
        playing=false;
        map.fitBounds(trailLine.getBounds(),{padding:[40,40],animate:true,duration:1});
        try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:"replay_complete"}))}catch(e){}
        return;
      }
    }
    animFrame=requestAnimationFrame(step);
  }
  animFrame=requestAnimationFrame(step);
}

window.addEventListener("message",function(e){
  try{
    var msg=JSON.parse(e.data);
    if(msg.type==="play")startReplay();
    if(msg.type==="pause"){playing=false;if(animFrame)cancelAnimationFrame(animFrame);}
    if(msg.type==="resume"){playing=true;lastTime=performance.now();animFrame=requestAnimationFrame(function step(ts){if(!playing)return;var dt=ts-lastTime;var baseInterval=TOTAL_DUR*1000/(COORDS.length||1);var interval=Math.max(baseInterval/speeds[speedIdx],16);if(dt>=interval){lastTime=ts;if(currentIdx<COORDS.length){var ll=COORDS[currentIdx];trailLine.addLatLng(ll);shadowLine.addLatLng(ll);marker.setLatLng(ll);if(currentIdx%3===0)map.panTo(ll,{animate:true,duration:0.3});updateStats(currentIdx);currentIdx++;}else{playing=false;map.fitBounds(trailLine.getBounds(),{padding:[40,40],animate:true,duration:1});return;}}animFrame=requestAnimationFrame(step);});}
    if(msg.type==="speed")cycleSpeed();
  }catch(ex){}
});
<\/script>
</body>
</html>`;
}
