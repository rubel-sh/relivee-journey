import { Coordinate } from "@/context/ActivityContext";

interface VideoGenConfig {
  activityName: string;
  activityType: string;
  coordinates: Coordinate[];
  distance: number;
  duration: number;
  elevationGain: number;
  avgSpeed: number;
  videoDurationSec?: number;
  videoWidth?: number;
  videoHeight?: number;
  videoFps?: number;
  playbackSpeed?: number;
}

const TYPE_COLORS: Record<string, string> = {
  run: "#6D9E51",
  cycle: "#088395",
  hike: "#8B6914",
  walk: "#5B7070",
};

function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export function buildVideoGeneratorHTML(config: VideoGenConfig): string {
  const {
    activityName,
    activityType,
    coordinates,
    distance,
    duration,
    elevationGain,
    avgSpeed,
    videoDurationSec = 20,
    videoWidth = 720,
    videoHeight = 720,
    videoFps = 30,
    playbackSpeed = 1,
  } = config;

  const routeColor = TYPE_COLORS[activityType] || "#6D9E51";

  const lats = coordinates.map((c) => c.latitude);
  const lons = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  const latSpan = maxLat - minLat;
  const lonSpan = maxLon - minLon;
  const maxSpan = Math.max(latSpan, lonSpan);

  let zoom = 16;
  if (maxSpan > 0.2) zoom = 11;
  else if (maxSpan > 0.1) zoom = 12;
  else if (maxSpan > 0.05) zoom = 13;
  else if (maxSpan > 0.02) zoom = 14;
  else if (maxSpan > 0.01) zoom = 15;

  const padding = 0.3;
  const padLat = latSpan * padding;
  const padLon = lonSpan * padding;

  const tileMin = latLonToTile(maxLat + padLat, minLon - padLon, zoom);
  const tileMax = latLonToTile(minLat - padLat, maxLon + padLon, zoom);

  const tileMinX = Math.max(0, tileMin.x - 1);
  const tileMaxX = tileMax.x + 1;
  const tileMinY = Math.max(0, tileMin.y - 1);
  const tileMaxY = tileMax.y + 1;

  const tilesX = tileMaxX - tileMinX + 1;
  const tilesY = tileMaxY - tileMinY + 1;

  const maxTiles = 64;
  const totalTiles = tilesX * tilesY;
  let adjustedZoom = zoom;
  if (totalTiles > maxTiles) {
    adjustedZoom = Math.max(zoom - 2, 10);
    const newTileMin = latLonToTile(maxLat + padLat, minLon - padLon, adjustedZoom);
    const newTileMax = latLonToTile(minLat - padLat, maxLon + padLon, adjustedZoom);
    return buildVideoGeneratorHTMLInternal({
      ...config,
      videoDurationSec,
      routeColor,
      zoom: adjustedZoom,
      tileMinX: Math.max(0, newTileMin.x - 1),
      tileMaxX: newTileMax.x + 1,
      tileMinY: Math.max(0, newTileMin.y - 1),
      tileMaxY: newTileMax.y + 1,
      centerLat,
      centerLon,
    });
  }

  return buildVideoGeneratorHTMLInternal({
    ...config,
    videoDurationSec,
    routeColor,
    zoom,
    tileMinX,
    tileMaxX,
    tileMinY,
    tileMaxY,
    centerLat,
    centerLon,
  });
}

interface InternalConfig extends VideoGenConfig {
  routeColor: string;
  zoom: number;
  tileMinX: number;
  tileMaxX: number;
  tileMinY: number;
  tileMaxY: number;
  centerLat: number;
  centerLon: number;
}

function buildVideoGeneratorHTMLInternal(cfg: InternalConfig): string {
  const {
    activityName,
    activityType,
    coordinates,
    distance,
    duration,
    elevationGain,
    avgSpeed,
    videoDurationSec = 20,
    videoWidth = 720,
    videoHeight = 720,
    videoFps = 30,
    playbackSpeed = 1,
    routeColor,
    zoom,
    tileMinX,
    tileMaxX,
    tileMinY,
    tileMaxY,
    centerLat,
    centerLon,
  } = cfg;

  const tilesX = tileMaxX - tileMinX + 1;
  const tilesY = tileMaxY - tileMinY + 1;

  const coordsJSON = JSON.stringify(coordinates);

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;font-family:-apple-system,sans-serif}
canvas{display:block}
#progress-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;color:white}
#progress-overlay h2{font-size:18px;margin-bottom:20px;font-weight:600}
#progress-bar-bg{width:240px;height:6px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden}
#progress-bar{height:100%;width:0%;background:${routeColor};border-radius:3px;transition:width 0.3s}
#progress-text{margin-top:12px;font-size:13px;opacity:0.7}
#status-text{margin-top:8px;font-size:11px;opacity:0.5}
</style>
</head><body>
<div id="progress-overlay">
  <h2>Generating 3D Video</h2>
  <div id="progress-bar-bg"><div id="progress-bar"></div></div>
  <div id="progress-text">Loading map tiles...</div>
  <div id="status-text">This may take a moment</div>
</div>
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
<script>
(function(){
  const COORDS = ${coordsJSON};
  const ZOOM = ${zoom};
  const TILE_MIN_X = ${tileMinX}, TILE_MAX_X = ${tileMaxX};
  const TILE_MIN_Y = ${tileMinY}, TILE_MAX_Y = ${tileMaxY};
  const TILES_X = ${tilesX}, TILES_Y = ${tilesY};
  const CENTER_LAT = ${centerLat}, CENTER_LON = ${centerLon};
  const ROUTE_COLOR = "${routeColor}";
  const ACTIVITY_NAME = ${JSON.stringify(activityName)};
  const DISTANCE = ${distance};
  const DURATION = ${duration};
  const ELEV_GAIN = ${elevationGain};
  const AVG_SPEED = ${avgSpeed};
  const VIDEO_DURATION = ${videoDurationSec};
  const TILE_SIZE = 256;
  const GROUND_SCALE = 0.02;

  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const statusText = document.getElementById('status-text');
  const overlay = document.getElementById('progress-overlay');

  function setProgress(pct, text, status) {
    progressBar.style.width = pct + '%';
    if (text) progressText.textContent = text;
    if (status) statusText.textContent = status;
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'progress', percent: pct, text: text || '' })); } catch(e) {}
  }

  function tileToWorld(tileX, tileY) {
    const n = Math.pow(2, ZOOM);
    const centerTileX = ((CENTER_LON + 180) / 360) * n;
    const centerLatRad = CENTER_LAT * Math.PI / 180;
    const centerTileY = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * n;
    const wx = (tileX - centerTileX) * TILE_SIZE * GROUND_SCALE;
    const wy = (tileY - centerTileY) * TILE_SIZE * GROUND_SCALE;
    return { x: wx, z: wy };
  }

  function latLonToWorld(lat, lon) {
    const n = Math.pow(2, ZOOM);
    const tileX = ((lon + 180) / 360) * n;
    const latRad = lat * Math.PI / 180;
    const tileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
    return tileToWorld(tileX, tileY);
  }

  function loadTiles() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = TILES_X * TILE_SIZE;
      canvas.height = TILES_Y * TILE_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e8e0d8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let loaded = 0;
      const total = TILES_X * TILES_Y;

      for (let ty = TILE_MIN_Y; ty <= TILE_MAX_Y; ty++) {
        for (let tx = TILE_MIN_X; tx <= TILE_MAX_X; tx++) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const dx = (tx - TILE_MIN_X) * TILE_SIZE;
          const dy = (ty - TILE_MIN_Y) * TILE_SIZE;
          img.onload = function() {
            ctx.drawImage(img, dx, dy, TILE_SIZE, TILE_SIZE);
            loaded++;
            setProgress(Math.round((loaded / total) * 40), 'Loading tiles ' + loaded + '/' + total);
            if (loaded === total) resolve(canvas);
          };
          img.onerror = function() {
            loaded++;
            if (loaded === total) resolve(canvas);
          };
          img.src = 'https://tile.openstreetmap.org/' + ZOOM + '/' + tx + '/' + ty + '.png';
        }
      }
      if (total === 0) resolve(canvas);
    });
  }

  function formatDur(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  async function generate() {
    setProgress(0, 'Loading map tiles...', 'Downloading OpenStreetMap tiles');
    const tileCanvas = await loadTiles();
    setProgress(40, 'Building 3D scene...', 'Creating terrain and route');

    const W = ${videoWidth}, H = ${videoHeight};
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x87CEEB, 1);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 80, 30);
    scene.add(dirLight);

    const groundW = TILES_X * TILE_SIZE * GROUND_SCALE;
    const groundH = TILES_Y * TILE_SIZE * GROUND_SCALE;
    const groundGeo = new THREE.PlaneGeometry(groundW, groundH, 1, 1);
    const texture = new THREE.CanvasTexture(tileCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const groundMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;

    const topLeftW = tileToWorld(TILE_MIN_X, TILE_MIN_Y);
    const botRightW = tileToWorld(TILE_MAX_X + 1, TILE_MAX_Y + 1);
    const groundCenterX = (topLeftW.x + botRightW.x) / 2;
    const groundCenterZ = (topLeftW.z + botRightW.z) / 2;
    ground.position.set(groundCenterX, -0.01, groundCenterZ);
    scene.add(ground);

    const routePoints = COORDS.map(c => {
      const w = latLonToWorld(c.latitude, c.longitude);
      return new THREE.Vector3(w.x, 0.05, w.z);
    });

    if (routePoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(routePoints, false, 'centripetal', 0.5);
      const tubeGeo = new THREE.TubeGeometry(curve, routePoints.length * 20, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ROUTE_COLOR),
        emissive: new THREE.Color(ROUTE_COLOR),
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.1,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);

      const glowGeo = new THREE.TubeGeometry(curve, routePoints.length * 20, 0.3, 8, false);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ROUTE_COLOR),
        transparent: true,
        opacity: 0.15,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);
    }

    const markerGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(ROUTE_COLOR),
      emissiveIntensity: 0.5,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(routePoints[0]);
    scene.add(marker);

    const pulseGeo = new THREE.RingGeometry(0.3, 0.5, 32);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ROUTE_COLOR),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.copy(routePoints[0]);
    pulse.position.y = 0.02;
    scene.add(pulse);

    const startGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
    const startMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    const startPin = new THREE.Mesh(startGeo, startMat);
    startPin.position.set(routePoints[0].x, 0.3, routePoints[0].z);
    scene.add(startPin);

    const endGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
    const endMat = new THREE.MeshStandardMaterial({ color: 0xF44336 });
    const endPin = new THREE.Mesh(endGeo, endMat);
    const lastPt = routePoints[routePoints.length - 1];
    endPin.position.set(lastPt.x, 0.3, lastPt.z);
    scene.add(endPin);

    setProgress(50, 'Rendering 3D video...', 'Recording frames');

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    const overlayCtx = overlayCanvas.getContext('2d');

    function drawOverlay(t) {
      overlayCtx.clearRect(0, 0, W, H);

      overlayCtx.fillStyle = 'rgba(0,0,0,0.5)';
      overlayCtx.beginPath();
      overlayCtx.roundRect(16, 16, 200, 36, 18);
      overlayCtx.fill();
      overlayCtx.fillStyle = 'white';
      overlayCtx.font = 'bold 14px -apple-system, sans-serif';
      overlayCtx.textAlign = 'left';
      overlayCtx.fillText(ACTIVITY_NAME, 32, 40);

      const barY = H - 60;
      overlayCtx.fillStyle = 'rgba(0,0,0,0.65)';
      overlayCtx.beginPath();
      overlayCtx.roundRect(0, barY, W, 60, 0);
      overlayCtx.fill();

      const stats = [
        { label: 'KM', value: ((DISTANCE / 1000) * t).toFixed(2) },
        { label: 'TIME', value: formatDur(DURATION * t) },
        { label: 'ELEV', value: Math.round(ELEV_GAIN * t) + 'm' },
        { label: 'KM/H', value: AVG_SPEED.toFixed(1) },
      ];
      const sw = W / stats.length;
      stats.forEach((s, i) => {
        const cx = sw * i + sw / 2;
        overlayCtx.fillStyle = 'white';
        overlayCtx.font = 'bold 16px -apple-system, sans-serif';
        overlayCtx.textAlign = 'center';
        overlayCtx.fillText(s.value, cx, barY + 24);
        overlayCtx.fillStyle = 'rgba(255,255,255,0.6)';
        overlayCtx.font = '10px -apple-system, sans-serif';
        overlayCtx.fillText(s.label, cx, barY + 42);
      });

      const progY = barY - 4;
      overlayCtx.fillStyle = 'rgba(255,255,255,0.15)';
      overlayCtx.fillRect(0, progY, W, 4);
      overlayCtx.fillStyle = ROUTE_COLOR;
      overlayCtx.fillRect(0, progY, W * t, 4);
    }

    const FPS = ${videoFps};
    const PLAYBACK_SPEED = ${playbackSpeed};
    const TOTAL_FRAMES = Math.round(VIDEO_DURATION * FPS / PLAYBACK_SPEED);

    let curve;
    if (routePoints.length >= 2) {
      curve = new THREE.CatmullRomCurve3(routePoints, false, 'centripetal', 0.5);
    }

    const allBbox = {
      minX: Math.min(...routePoints.map(p => p.x)),
      maxX: Math.max(...routePoints.map(p => p.x)),
      minZ: Math.min(...routePoints.map(p => p.z)),
      maxZ: Math.max(...routePoints.map(p => p.z)),
    };
    const bboxW = allBbox.maxX - allBbox.minX;
    const bboxH = allBbox.maxZ - allBbox.minZ;
    const bboxSize = Math.max(bboxW, bboxH, 2);
    const routeCenterX = (allBbox.minX + allBbox.maxX) / 2;
    const routeCenterZ = (allBbox.minZ + allBbox.maxZ) / 2;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = W;
    finalCanvas.height = H;
    const finalCtx = finalCanvas.getContext('2d');

    let mediaRecorder;
    let chunks = [];
    let recordingResolve;
    const recordingPromise = new Promise(r => { recordingResolve = r; });

    const stream = finalCanvas.captureStream(0);
    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    let selectedMime = 'video/webm';
    for (const mt of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mt)) {
        selectedMime = mt;
        break;
      }
    }

    if (typeof MediaRecorder === 'undefined') {
      setProgress(0, 'MediaRecorder not supported', 'This device cannot generate videos');
      try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: 'MediaRecorder not supported on this device' })); } catch(e) {}
      return;
    }

    mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 2500000 });
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => { recordingResolve(); };
    mediaRecorder.start();

    let frame = 0;

    function renderFrame() {
      if (frame > TOTAL_FRAMES) {
        mediaRecorder.stop();
        finalize();
        return;
      }

      const t = frame / TOTAL_FRAMES;
      const pct = 50 + Math.round(t * 40);
      if (frame % FPS === 0) {
        setProgress(pct, 'Rendering frame ' + frame + '/' + TOTAL_FRAMES, 'Recording video at ' + FPS + ' fps');
      }

      if (curve) {
        const introT = 0.08;
        const outroT = 0.92;

        if (t < introT) {
          const it = t / introT;
          const height = bboxSize * 2.5 * (1 - it * 0.6);
          const angle = it * 0.6;
          camera.position.set(
            routeCenterX + Math.sin(angle) * bboxSize * 0.3,
            height,
            routeCenterZ + Math.cos(angle) * bboxSize * 0.5
          );
          camera.lookAt(routeCenterX, 0, routeCenterZ);
        } else if (t > outroT) {
          const ot = (t - outroT) / (1 - outroT);
          const pt = curve.getPoint(1);
          const height = bboxSize * 0.8 + ot * bboxSize * 1.5;
          camera.position.set(
            pt.x + (routeCenterX - pt.x) * ot,
            height,
            pt.z + (routeCenterZ - pt.z) * ot + bboxSize * 0.3
          );
          camera.lookAt(
            pt.x + (routeCenterX - pt.x) * ot,
            0,
            pt.z + (routeCenterZ - pt.z) * ot
          );
        } else {
          const ct = (t - introT) / (outroT - introT);
          const pt = curve.getPoint(ct);
          const tangent = curve.getTangent(ct);
          const camHeight = bboxSize * 0.8;
          const camDist = bboxSize * 0.5;
          camera.position.set(
            pt.x - tangent.x * camDist + tangent.z * camDist * 0.3,
            camHeight,
            pt.z - tangent.z * camDist - tangent.x * camDist * 0.3
          );
          const lookAhead = Math.min(ct + 0.05, 1);
          const lookPt = curve.getPoint(lookAhead);
          camera.lookAt(lookPt.x, 0, lookPt.z);
        }

        const routeT = Math.min(Math.max((t - 0.05) / 0.9, 0), 1);
        const markerPt = curve.getPoint(routeT);
        marker.position.copy(markerPt);
        marker.position.y = 0.2;
        pulse.position.set(markerPt.x, 0.02, markerPt.z);
        const pulseScale = 1 + Math.sin(t * 30) * 0.3;
        pulse.scale.set(pulseScale, pulseScale, 1);
        pulseMat.opacity = 0.3 + Math.sin(t * 30) * 0.15;
      } else {
        camera.position.set(routeCenterX, bboxSize * 2, routeCenterZ + bboxSize);
        camera.lookAt(routeCenterX, 0, routeCenterZ);
      }

      renderer.render(scene, camera);
      drawOverlay(Math.min(Math.max((t - 0.05) / 0.9, 0), 1));

      finalCtx.drawImage(renderer.domElement, 0, 0);
      finalCtx.drawImage(overlayCanvas, 0, 0);

      stream.getVideoTracks()[0].requestFrame();
      frame++;

      requestAnimationFrame(renderFrame);
    }

    renderFrame();

    async function finalize() {
      await recordingPromise;
      setProgress(92, 'Encoding video...', 'Creating video file');

      const blob = new Blob(chunks, { type: selectedMime });
      setProgress(95, 'Transferring video...', 'Sending ' + (blob.size / 1024 / 1024).toFixed(1) + ' MB to app');

      const reader = new FileReader();
      reader.onload = function() {
        const base64 = reader.result.split(',')[1];
        const CHUNK_SIZE = 512 * 1024;
        const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

        try {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'video-start',
            totalSize: base64.length,
            totalChunks: totalChunks,
            mimeType: selectedMime,
            fileSizeBytes: blob.size,
          }));
        } catch(e) {}

        for (let i = 0; i < totalChunks; i++) {
          const chunk = base64.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          try {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'video-chunk',
              index: i,
              data: chunk,
            }));
          } catch(e) {}
          setProgress(95 + Math.round((i / totalChunks) * 4), 'Transferring...', 'Chunk ' + (i+1) + '/' + totalChunks);
        }

        try {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'video-complete',
            durationMs: VIDEO_DURATION * 1000,
            fileSizeBytes: blob.size,
          }));
        } catch(e) {}

        setProgress(100, 'Video generated!', 'Saving to device');
      };
      reader.readAsDataURL(blob);
    }
  }

  generate().catch(err => {
    try { window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: err.message || String(err) })); } catch(e) {}
  });
})();
</script>
</body></html>`;
}
