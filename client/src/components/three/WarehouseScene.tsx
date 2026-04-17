import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { SHOW_DEMO_DATA } from "../../config/features";

interface RackProps {
  position: [number, number, number];
  color: string;
  label: string;
}

function Rack({ position, color, label }: RackProps) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.8, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </mesh>
      <Html position={[0, 1.8, 0]} center>
        <div className="rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white">{label}</div>
      </Html>
    </group>
  );
}

function WarehouseFloor() {
  const racks = useMemo(
    () =>
      SHOW_DEMO_DATA
        ? [
            { position: [-3, 1.4, -2] as [number, number, number], color: "#22C55E", label: "R-A1" },
            { position: [-1, 1.4, -2] as [number, number, number], color: "#F59E0B", label: "R-A2" },
            { position: [1, 1.4, -2] as [number, number, number], color: "#EF4444", label: "R-A3" },
            { position: [3, 1.4, -2] as [number, number, number], color: "#06B6D4", label: "R-A4" },
            { position: [-3, 1.4, 1] as [number, number, number], color: "#22C55E", label: "R-B1" },
            { position: [-1, 1.4, 1] as [number, number, number], color: "#06B6D4", label: "R-B2" },
            { position: [1, 1.4, 1] as [number, number, number], color: "#F59E0B", label: "R-B3" },
            { position: [3, 1.4, 1] as [number, number, number], color: "#22C55E", label: "R-B4" }
          ]
        : [],
    []
  );

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13, 10]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      {racks.length > 0 ? (
        <>
          {racks.map((rack) => (
            <Rack key={rack.label} {...rack} />
          ))}
          <mesh position={[-4.8, 0.25, 3.4]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[4.8, 0.25, 3.4]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.8} />
          </mesh>
        </>
      ) : (
        <Html position={[0, 1.2, 0]} center>
          <div className="rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-white">No live warehouse data available yet.</div>
        </Html>
      )}
    </>
  );
}

export default function WarehouseScene() {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 lg:h-[440px]">
      <Canvas camera={{ position: [0, 7, 9], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[8, 10, 2]} intensity={1.2} castShadow />
        <pointLight position={[-8, 6, -3]} intensity={0.4} color="#06B6D4" />
        <WarehouseFloor />
        <OrbitControls maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
