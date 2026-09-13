/**
 * AICore 3D Robotic AI Core & Face Presentation
 *
 * Built with Three.js & React Three Fiber:
 * - Procedural metallic robotic face/skull plates
 * - Glowing crimson optic eyes with state-based intensity
 * - Glowing central neural arc core
 * - Articulating jaw for SPEAKING state
 * - Subtle breathing, head-bobbing, and mouse tracking
 * - Holographic rings, scanner lines, and neural particles overlay
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIStateMode } from '../../types/index.ts';
import { AICoreRings } from './AICoreRings.tsx';
import { NeuralRing } from './NeuralRing.tsx';
import { AIScanner } from './AIScanner.tsx';
import { AIEyes } from './AIEyes.tsx';
import { AINeuralNetwork } from './AINeuralNetwork.tsx';

interface RoboticFaceMeshProps {
  state: AIStateMode;
}

const RoboticFaceMesh: React.FC<RoboticFaceMeshProps> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  // Compute optic glow color based on state
  const opticColor = useMemo(() => {
    switch (state) {
      case 'SUCCESS':
        return '#10b981'; // green
      case 'ERROR':
        return '#f59e0b'; // amber
      case 'SECURITY_ALERT':
        return '#ff0000'; // pure alarm red
      case 'THINKING':
        return '#f97316'; // orange red
      case 'IDLE':
      case 'LISTENING':
      case 'EXECUTING':
      case 'SPEAKING':
      default:
        return '#ef4444'; // crimson red
    }
  }, [state]);

  useFrame((stateContext, delta) => {
    const t = stateContext.clock.getElapsedTime();

    if (groupRef.current) {
      // Idle head breathing & subtle rotational drift
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
      groupRef.current.rotation.x = Math.sin(t * 1.2) * 0.04;

      if (state === 'SECURITY_ALERT') {
        // Subtle aggressive micro-jitter in alert mode
        groupRef.current.position.x = (Math.random() - 0.5) * 0.015;
      } else {
        groupRef.current.position.x = 0;
      }
    }

    // Central Neural Core Rotation & Pulsing
    if (coreRef.current) {
      const rotSpeed = state === 'THINKING' || state === 'EXECUTING' ? 4 : 1;
      coreRef.current.rotation.z += delta * rotSpeed;
      const scale = 1 + Math.sin(t * (state === 'EXECUTING' ? 8 : 3)) * 0.08;
      coreRef.current.scale.set(scale, scale, scale);
    }

    // Jaw Articulation during SPEAKING
    if (jawRef.current) {
      if (state === 'SPEAKING') {
        jawRef.current.position.y = -0.45 - Math.abs(Math.sin(t * 12)) * 0.08;
      } else {
        jawRef.current.position.y = -0.45;
      }
    }

    // Eye Optics Fluctuations
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeIntensity =
        state === 'LISTENING' || state === 'SECURITY_ALERT'
          ? 1.2 + Math.sin(t * 6) * 0.3
          : 0.9 + Math.sin(t * 2) * 0.15;

      leftEyeRef.current.scale.set(eyeIntensity, eyeIntensity, 1);
      rightEyeRef.current.scale.set(eyeIntensity, eyeIntensity, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.35, 1.35, 1.35]}>
      {/* Upper Cranium / Head Plate */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.8]} />
        <meshStandardMaterial
          color="#0f1118"
          metalness={0.92}
          roughness={0.18}
          wireframe={false}
        />
      </mesh>

      {/* Forehead Armor Brow */}
      <mesh position={[0, 0.28, 0.42]}>
        <boxGeometry args={[0.92, 0.18, 0.15]} />
        <meshStandardMaterial color="#181a24" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Central Forehead Neural Crest / Core */}
      <mesh ref={coreRef} position={[0, 0.52, 0.42]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.16, 0.16, 0.08]} />
        <meshBasicMaterial color={opticColor} />
      </mesh>

      {/* Left Cheek / Temporal Plate */}
      <mesh position={[-0.48, 0.1, 0.1]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.7]} />
        <meshStandardMaterial color="#12141d" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Right Cheek / Temporal Plate */}
      <mesh position={[0.48, 0.1, 0.1]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.7]} />
        <meshStandardMaterial color="#12141d" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Left Glowing Optic Eye */}
      <mesh ref={leftEyeRef} position={[-0.24, 0.12, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        <meshBasicMaterial color={opticColor} />
      </mesh>

      {/* Right Glowing Optic Eye */}
      <mesh ref={rightEyeRef} position={[0.24, 0.12, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        <meshBasicMaterial color={opticColor} />
      </mesh>

      {/* Nose Bridge / Central Divider */}
      <mesh position={[0, 0.05, 0.45]}>
        <boxGeometry args={[0.1, 0.25, 0.12]} />
        <meshStandardMaterial color="#0b0d13" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Lower Face & Articulating Jaw Group */}
      <group ref={jawRef} position={[0, -0.45, 0]}>
        {/* Chin / Mandible Armor */}
        <mesh position={[0, 0.15, 0.35]}>
          <boxGeometry args={[0.6, 0.25, 0.35]} />
          <meshStandardMaterial color="#161822" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Mouth Audio Slit / Heat Grill */}
        <mesh position={[0, 0.25, 0.46]}>
          <boxGeometry args={[0.4, 0.04, 0.05]} />
          <meshBasicMaterial color={opticColor} />
        </mesh>

        {/* Lower Chin Tip */}
        <mesh position={[0, 0.02, 0.38]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.3, 0.14, 0.2]} />
          <meshStandardMaterial color="#0a0c12" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Neck Servos & Conduits */}
      <mesh position={[-0.15, -0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
        <meshStandardMaterial color="#1e2029" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, -0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
        <meshStandardMaterial color="#1e2029" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Chest Arc Reactor (Glowing Red Neural Core) */}
      <mesh position={[0, -0.85, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 24]} />
        <meshBasicMaterial color={opticColor} />
      </mesh>
      <mesh position={[0, -0.85, 0.16]}>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
        <meshStandardMaterial color="#0d0f16" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

interface AICoreProps {
  state: AIStateMode;
}

export const AICore: React.FC<AICoreProps> = ({ state }) => {
  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] flex items-center justify-center overflow-hidden">
      {/* Background Neural Network Constellation */}
      <AINeuralNetwork state={state} />

      {/* Animated Multi-Layered Neural Network Ring (Framer Motion + SVG) */}
      <NeuralRing state={state} />

      {/* Rotating Mechanical Holographic HUD Rings */}
      <AICoreRings state={state} />

      {/* Optic Status & Lumen HUD telemetry */}
      <AIEyes state={state} />

      {/* Vertical Scanning Laser Beam during search/execution */}
      <AIScanner state={state} />

      {/* 3D WebGL Canvas for Robotic AI Core */}
      <Canvas
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
        camera={{ position: [0, 0, 3.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        {/* Key Crimson Rim Lights */}
        <pointLight position={[3, 2, 2]} color="#ef4444" intensity={1.8} />
        <pointLight position={[-3, -2, 2]} color="#991b1b" intensity={1.2} />
        <directionalLight position={[0, 4, 3]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[0, -3, -2]} intensity={0.5} color="#ef4444" />

        <RoboticFaceMesh state={state} />
      </Canvas>

      {/* Floating Tactical Coordinates Overlay */}
      <div className="absolute bottom-4 right-4 z-20 font-mono text-[9px] text-zinc-300 pointer-events-none text-right">
        <p>SECTOR: 0x7F_ROBOTIC</p>
        <p>BUS FREQ: 440.00 Hz</p>
        <p className="text-red-400 font-bold">SOVEREIGNTY: ENFORCED</p>
      </div>

      <div className="absolute bottom-4 left-4 z-20 font-mono text-[9px] text-zinc-300 pointer-events-none">
        <p>CORE_ID: ULTRON-MARK-IX</p>
        <p>STATUS: RUNTIME NOMINAL</p>
      </div>
    </div>
  );
};
