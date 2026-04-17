import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { type Mesh } from "three";

function Globe() {
  const globeRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.22;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.35;
  });

  return (
    <>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial color="#2563EB" wireframe opacity={0.45} transparent />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 3.2, 0, 0]}>
        <torusGeometry args={[2.3, 0.03, 16, 140]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>
      <mesh position={[0, 0, 1.55]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[1.2, -0.6, -0.85]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-1.1, 0.7, -0.9]}>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.8} />
      </mesh>
    </>
  );
}

export default function NetworkGlobeScene() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-3xl border border-white/30 bg-slate-950 shadow-2xl">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.9} />
        <pointLight position={[4, 3, 4]} intensity={1.6} color="#a855f7" />
        <pointLight position={[-4, -2, -3]} intensity={0.6} color="#22c55e" />
        <Globe />
        <Stars radius={80} depth={40} count={1500} factor={3} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}
