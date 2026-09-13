/**
 * AICore Component
 *
 * 3D Robotic AI Core rendered with Three.js via @react-three/fiber:
 * - Animated mechanical cranium and segmented jaw articulation
 * - Realtime hand gesture optical tracking integration (guides face orientation toward user's hand)
 * - Synced with requestAnimationFrame-driven NeuralNetworkRing matrix
 * - Glowing crimson optic lenses and tactical coordinate HUD
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIStateMode } from '../../types/index.ts';
import { NeuralNetworkRing } from './NeuralNetworkRing.tsx';
import { AIScanner } from './AIScanner.tsx';
import { AIEyes } from './AIEyes.tsx';
import { AINeuralNetwork } from './AINeuralNetwork.tsx';
import { StageGestureHUD } from '../Gestures/StageGestureHUD.tsx';
import { gestureEngine } from '../../utils/handGestureDetector.ts';

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
      // Check if optical hand tracking is active to smoothly turn face toward user's hand
      const isTracking = gestureEngine.landmarks.isTracking;
      let targetRotY = Math.sin(t * 0.8) * 0.08;
      let targetRotX = Math.sin(t * 1.2) * 0.04;

      if (isTracking) {
        // Map hand centroid (0..1) to head yaw (-0.45..0.45 rad) and pitch (-0.25..0.25 rad)
        const handX = (gestureEngine.landmarks.palmCenter.x - 0.5) * 2;
        const handY = (gestureEngine.landmarks.palmCenter.y - 0.5) * 2;
        targetRotY = -handX * 0.45;
        targetRotX = handY * 0.3;
      }

      // Smooth lerp toward target rotation
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.12;
      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.12;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;

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

      {/* Cranium Facet Chamfers */}
      <mesh position={[0, 0.72, -0.05]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.82, 0.22, 0.7]} />
        <meshStandardMaterial color="#171924" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Forehead Ridge / Sensor Array */}
      <mesh position={[0, 0.48, 0.42]}>
        <boxGeometry args={[0.7, 0.08, 0.05]} />
        <meshStandardMaterial
          color={opticColor}
          emissive={opticColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Central Eye / Optic Visor Bridge */}
      <mesh position={[0, 0.16, 0.38]}>
        <boxGeometry args={[0.82, 0.2, 0.15]} />
        <meshStandardMaterial color="#050609" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Left Glowing Crimson Optic Aperture */}
      <mesh ref={leftEyeRef} position={[-0.24, 0.16, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.04, 16]} />
        <meshStandardMaterial
          color={opticColor}
          emissive={opticColor}
          emissiveIntensity={2.4}
        />
      </mesh>

      {/* Right Glowing Crimson Optic Aperture */}
      <mesh ref={rightEyeRef} position={[0.24, 0.16, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.04, 16]} />
        <meshStandardMaterial
          color={opticColor}
          emissive={opticColor}
          emissiveIntensity={2.4}
        />
      </mesh>

      {/* Nose Bridge / Vent Mesh */}
      <mesh position={[0, -0.04, 0.42]}>
        <boxGeometry args={[0.18, 0.22, 0.12]} />
        <meshStandardMaterial color="#1a1d29" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Cheekbone Armored Plates (Left & Right) */}
      <mesh position={[-0.42, 0.0, 0.24]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.25, 0.45, 0.4]} />
        <meshStandardMaterial color="#11131c" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.42, 0.0, 0.24]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[0.25, 0.45, 0.4]} />
        <meshStandardMaterial color="#11131c" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Mouth Vent / Audio Transducer Chamber */}
      <mesh position={[0, -0.22, 0.38]}>
        <boxGeometry args={[0.48, 0.14, 0.1]} />
        <meshStandardMaterial
          color="#020305"
          emissive={state === 'SPEAKING' ? opticColor : '#000000'}
          emissiveIntensity={state === 'SPEAKING' ? 1.5 : 0}
        />
      </mesh>

      {/* Rotating Internal Sub-Core Sphere inside the head */}
      <mesh ref={coreRef} position={[0, 0.1, 0]}>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial
          color={opticColor}
          wireframe={true}
          emissive={opticColor}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Articulated Lower Jaw Assembly */}
      <group ref={jawRef} position={[0, -0.45, 0.1]}>
        <mesh position={[0, 0, 0.2]}>
          <boxGeometry args={[0.55, 0.24, 0.35]} />
          <meshStandardMaterial color="#0c0e15" metalness={0.92} roughness={0.2} />
        </mesh>
        {/* Chin Taper Point */}
        <mesh position={[0, -0.16, 0.28]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.32, 0.18, 0.25]} />
          <meshStandardMaterial color="#1c202e" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Neck Cervical Strut */}
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
      {/* Background Neural Network Constellation (rAF optimized) */}
      <AINeuralNetwork state={state} />

      {/* Lightweight Multi-Layered Neural Network Ring (rAF-driven canvas + SVG matrix) */}
      <NeuralNetworkRing state={state} size={560} />

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

      {/* Optical Hand Tracking Skeleton & Coordinate HUD Overlay (Active during Camera Feed) */}
      <StageGestureHUD />

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
