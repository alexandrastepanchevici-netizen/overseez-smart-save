import React, { useRef, useEffect, useState, useCallback } from "react";

interface CountryPin {
  name: string;
  lat: number;
  lng: number;
  color?: string;
}

const COUNTRIES: CountryPin[] = [
  { name: "Moldova", lat: 47.0, lng: 28.9 },
  { name: "UK", lat: 51.5, lng: -0.1 },
  { name: "USA", lat: 38.9, lng: -77.0 },
  { name: "Canada", lat: 45.4, lng: -75.7 },
  { name: "Spain", lat: 40.4, lng: -3.7 },
  { name: "Mexico", lat: 19.4, lng: -99.1 },
  { name: "Germany", lat: 52.5, lng: 13.4 },
  { name: "France", lat: 48.9, lng: 2.3 },
  { name: "Italy", lat: 41.9, lng: 12.5 },
  { name: "Japan", lat: 35.7, lng: 139.7 },
  { name: "Australia", lat: -33.9, lng: 151.2 },
  { name: "Brazil", lat: -15.8, lng: -47.9 },
  { name: "South Korea", lat: 37.6, lng: 127.0 },
  { name: "Netherlands", lat: 52.4, lng: 4.9 },
  { name: "Portugal", lat: 38.7, lng: -9.1 },
  { name: "Sweden", lat: 59.3, lng: 18.1 },
  { name: "Poland", lat: 52.2, lng: 21.0 },
  { name: "Romania", lat: 44.4, lng: 26.1 },
  { name: "Turkey", lat: 41.0, lng: 28.9 },
  { name: "UAE", lat: 25.2, lng: 55.3 },
  { name: "India", lat: 28.6, lng: 77.2 },
  { name: "Thailand", lat: 13.8, lng: 100.5 },
  { name: "Argentina", lat: -34.6, lng: -58.4 },
  { name: "Czech Republic", lat: 50.1, lng: 14.4 },
  { name: "New Zealand", lat: -41.3, lng: 174.8 },
];

function latLngTo3D(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
}

function rotateX(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x, y: y * cos - z * sin, z: y * sin + z * cos };
}

// Simplified continent outlines (major landmass boundary points)
const CONTINENT_PATHS: { points: [number, number][] }[] = [
  // North America
  { points: [[-10,72],[-20,68],[-55,58],[-65,47],[-80,38],[-85,30],[-100,28],[-105,22],[-97,16],[-87,14],[-82,10],[-78,8],[-77,18],[-67,18],[-60,47],[-55,50],[-58,55],[-70,60],[-75,65],[-10,72]] },
  // South America
  { points: [[-78,10],[-75,5],[-70,-2],[-75,-15],[-70,-23],[-67,-55],[-75,-50],[-70,-40],[-55,-34],[-48,-28],[-42,-22],[-35,-8],[-50,2],[-60,7],[-70,10],[-78,10]] },
  // Europe
  { points: [[-10,36],[0,38],[3,43],[5,47],[10,46],[13,45],[20,40],[26,40],[28,42],[30,45],[35,46],[40,42],[32,48],[24,55],[22,60],[25,65],[30,70],[20,70],[10,64],[5,62],[0,52],[-5,48],[-10,44],[-10,36]] },
  // Africa
  { points: [[-15,30],[-5,36],[10,37],[12,33],[20,32],[32,32],[35,30],[42,12],[50,2],[45,-12],[40,-16],[35,-25],[30,-34],[20,-35],[15,-28],[12,-18],[10,-5],[5,5],[0,5],[-5,5],[-10,7],[-17,15],[-15,30]] },
  // Asia
  { points: [[30,45],[40,42],[45,40],[50,38],[55,42],[60,42],[65,38],[68,25],[75,15],[78,8],[80,15],[88,22],[92,22],[98,17],[100,14],[105,10],[110,20],[120,23],[122,30],[130,33],[135,35],[140,36],[145,43],[135,50],[130,55],[120,55],[110,50],[100,48],[90,50],[80,55],[70,55],[60,60],[50,65],[70,72],[80,72],[100,75],[140,70],[170,65],[180,65],[180,72],[-180,72],[-170,65],[-165,60],[180,60],[165,55],[155,50],[145,43],[140,50],[130,55],[60,70],[50,65],[40,55],[30,45]] },
  // Australia
  { points: [[115,-35],[120,-34],[130,-32],[137,-35],[140,-38],[148,-43],[152,-38],[153,-28],[148,-20],[143,-15],[137,-12],[130,-12],[125,-15],[115,-22],[114,-30],[115,-35]] },
];

const Globe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotY, setRotY] = useState(0);
  const [rotXAngle, setRotXAngle] = useState(0.3);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });
  const autoRotRef = useRef(0);
  const animRef = useRef<number>(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, autoRot: number) => {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.38;
    const R = baseR * zoom;
    const totalRotY = rotY + autoRot;

    // Stars
    const starSeed = 42;
    for (let i = 0; i < 120; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % w);
      const sy = ((starSeed * (i + 1) * 104729) % h);
      const brightness = 0.15 + ((i * 31) % 60) / 100;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Globe glow
    const glowGrad = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.6);
    glowGrad.addColorStop(0, "hsla(200,80%,55%,0.08)");
    glowGrad.addColorStop(1, "hsla(200,80%,55%,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Globe sphere
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, R * 0.05, cx, cy, R);
    sphereGrad.addColorStop(0, "hsl(210,40%,14%)");
    sphereGrad.addColorStop(0.7, "hsl(210,45%,10%)");
    sphereGrad.addColorStop(1, "hsl(210,50%,6%)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Globe border
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "hsla(200,80%,55%,0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grid lines (latitude)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "hsla(200,60%,50%,0.06)";
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      const p = latLngTo3D(lat, 0, R);
      const rLat = rotateX(p.x, p.y, p.z, rotXAngle);
      const projY = cy + rLat.y;
      const cosLat = Math.cos(lat * Math.PI / 180);
      const visibleR = R * cosLat;
      if (visibleR > 5) {
        ctx.beginPath();
        ctx.ellipse(cx, projY, visibleR, visibleR * Math.abs(Math.sin(rotXAngle)) * 0.3 + 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Grid lines (longitude)
    for (let lng = 0; lng < 360; lng += 30) {
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = latLngTo3D(lat, lng, R);
        let r = rotateY(p.x, p.y, p.z, totalRotY);
        r = rotateX(r.x, r.y, r.z, rotXAngle);
        if (r.z < 0) { first = true; continue; }
        const px = cx + r.x;
        const py = cy + r.y;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw continents
    ctx.strokeStyle = "hsla(200,80%,55%,0.3)";
    ctx.fillStyle = "hsla(200,60%,40%,0.12)";
    ctx.lineWidth = 1;

    for (const continent of CONTINENT_PATHS) {
      ctx.beginPath();
      let first = true;
      let anyVisible = false;
      for (const [lng, lat] of continent.points) {
        const p = latLngTo3D(lat, lng, R);
        let r = rotateY(p.x, p.y, p.z, totalRotY);
        r = rotateX(r.x, r.y, r.z, rotXAngle);
        if (r.z < 0) { first = true; continue; }
        anyVisible = true;
        const px = cx + r.x;
        const py = cy + r.y;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      if (anyVisible) {
        ctx.fill();
        ctx.stroke();
      }
    }

    // Draw pins
    let newHovered: string | null = null;
    const pinData: { name: string; px: number; py: number; z: number; scale: number }[] = [];

    for (const pin of COUNTRIES) {
      const p = latLngTo3D(pin.lat, pin.lng, R);
      let r = rotateY(p.x, p.y, p.z, totalRotY);
      r = rotateX(r.x, r.y, r.z, rotXAngle);

      if (r.z < 0) continue; // behind globe

      const px = cx + r.x;
      const py = cy + r.y;
      const depthScale = 0.5 + (r.z / R) * 0.5;

      pinData.push({ name: pin.name, px, py, z: r.z, scale: depthScale });
    }

    // Sort by z so front pins draw on top
    pinData.sort((a, b) => a.z - b.z);

    for (const { name, px, py, scale } of pinData) {
      const pinSize = (3 + zoom * 2) * scale;

      // Pin glow
      const pinGlow = ctx.createRadialGradient(px, py, 0, px, py, pinSize * 3);
      pinGlow.addColorStop(0, "hsla(200,80%,55%,0.3)");
      pinGlow.addColorStop(1, "hsla(200,80%,55%,0)");
      ctx.fillStyle = pinGlow;
      ctx.beginPath();
      ctx.arc(px, py, pinSize * 3, 0, Math.PI * 2);
      ctx.fill();

      // Pin dot
      ctx.beginPath();
      ctx.arc(px, py, pinSize, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(200,80%,55%)";
      ctx.fill();

      // Pin ring
      ctx.beginPath();
      ctx.arc(px, py, pinSize * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = "hsla(200,80%,55%,0.4)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Label (show when zoomed or hovered)
      if (zoom > 1.3 || name === hoveredPin) {
        const fontSize = Math.max(9, 10 * scale * Math.min(zoom * 0.7, 1.5));
        ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${0.5 + scale * 0.5})`;
        ctx.textAlign = "center";
        ctx.fillText(name, px, py - pinSize * 2.5);
      }
    }

    ctx.restore();
    ctx.restore();
  }, [zoom, rotY, rotXAngle, hoveredPin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      if (!running) return;
      if (!isDragging) {
        autoRotRef.current += 0.003;
      }
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, autoRotRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw, isDragging]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.6, Math.min(4, z - e.deltaY * 0.002)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRotY(r => r + dx * 0.008);
    setRotXAngle(r => Math.max(-1.2, Math.min(1.2, r + dy * 0.008)));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none" }}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom(z => Math.min(4, z + 0.3))}
          className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-accent/20 transition-colors text-sm font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.6, z - 0.3))}
          className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-accent/20 transition-colors text-sm font-bold"
        >
          −
        </button>
      </div>
      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1 text-xs text-muted-foreground font-medium">
          {zoom.toFixed(1)}×
        </div>
      )}
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/50 hidden sm:block">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
};

export default Globe;
