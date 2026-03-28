import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

interface CountryPin {
  name: string;
  lat: number;
  lng: number;
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

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Pin({ lat, lng, name }: CountryPin) {
  const pos = useMemo(() => latLngToVector3(lat, lng, 1.01), [lat, lng]);
  const outerPos = useMemo(() => latLngToVector3(lat, lng, 1.06), [lat, lng]);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2 + lat) * 0.3;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Pin dot */}
      <mesh ref={meshRef} position={pos}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef} position={pos}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>
      {/* Spike line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([pos.x, pos.y, pos.z, outerPos.x, outerPos.y, outerPos.z]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </line>
    </group>
  );
}

function Earth() {
  const groupRef = useRef<THREE.Group>(null);

  const earthMap = useLoader(THREE.TextureLoader, "https://cdn.jsdelivr.net/npm/three-globe@2.34.1/example/img/earth-blue-marble.jpg");
  const bumpMap = useLoader(THREE.TextureLoader, "https://cdn.jsdelivr.net/npm/three-globe@2.34.1/example/img/earth-topology.png");

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
    }
  });

  return (
    <group>
      {/* Rotating group: earth + pins move together */}
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhongMaterial
            map={earthMap}
            bumpMap={bumpMap}
            bumpScale={0.04}
            specular={new THREE.Color("#1a3a5c")}
            shininess={15}
          />
        </mesh>

        {/* Country pins */}
        {COUNTRIES.map((c) => (
          <Pin key={c.name} {...c} />
        ))}
      </group>

      {/* Atmosphere glow (doesn't rotate) */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 0.6;
            }
          `}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.8} color="#e0f0ff" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#38bdf8" />
      <Stars radius={100} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4}
        autoRotate
        autoRotateSpeed={0.3}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </>
  );
}

const Globe: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/50 hidden sm:block">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
};

export default Globe;
