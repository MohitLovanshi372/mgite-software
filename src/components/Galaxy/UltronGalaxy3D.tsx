/**
 * UltronGalaxy3D Component
 *
 * Cinematic 3D Interactive Spiral Galaxy for Ultron Galaxy OS:
 * - 40,000+ interactive celestial stars mathematically mapped with logarithmic spiral density
 * - Central Supermassive Black Hole (Sagittarius A*) with glowing relativistic accretion disk & polar plasma jets
 * - Interstellar gas nebulae clouds with additive blending in Ultron Crimson & Cosmic Violet
 * - OrbitControls with pan, zoom, smooth damping, and galactic plane alignment
 * - Quadrant waypoint targeting (Sagittarius A* Core, Orion Arm, Perseus Arm, Scutum-Centaurus Arm)
 * - Galactic parameters customizer (Velocity, Spiral density, Core intensity, Stellar clusters)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GalaxyQuadrant, GalaxyTelemetry } from '../../types/glbModels.ts';
import {
  Sparkles,
  Compass,
  Radio,
  RotateCw,
  Eye,
  Sliders,
  Maximize2,
  RefreshCw,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';

interface UltronGalaxy3DProps {
  className?: string;
  onSelectQuadrant?: (telemetry: GalaxyTelemetry) => void;
  compact?: boolean;
}

export const UltronGalaxy3D: React.FC<UltronGalaxy3DProps> = ({
  className = '',
  onSelectQuadrant,
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyPointsRef = useRef<THREE.Points | null>(null);
  const nebulaPointsRef = useRef<THREE.Points | null>(null);
  const jetRef = useRef<THREE.Group | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);

  // Galaxy Configuration State
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.15);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [spiralTightness, setSpiralTightness] = useState<number>(3.2);
  const [activeQuadrant, setActiveQuadrant] = useState<GalaxyQuadrant>('SAGITTARIUS_A_CORE');
  const [nebulaPalette, setNebulaPalette] = useState<'ultron_crimson' | 'cosmic_violet' | 'deep_space'>('ultron_crimson');

  const [telemetry, setTelemetry] = useState<GalaxyTelemetry>({
    quadrant: 'SAGITTARIUS_A_CORE',
    name: 'GALACTIC NUCLEUS // SAGITTARIUS A*',
    starsEstimate: '250 - 400 Billion Stars',
    blackHoleMass: '4.154 × 10⁶ M☉ (Solar Masses)',
    angularVelocity: '220 km/s Galactic Rotation',
    radiationIndex: '1.42 × 10³⁸ ergs/s Synchrotron',
    coordinates: 'RA 17h 45m 40s | Dec -29° 00′ 28″',
    threatLevel: 'SINGULARITY',
  });

  // Generate Galaxy Starfield Geometry
  const generateGalaxyStars = useCallback(
    (count = 35000, arms = 4, tightness = 3.2, palette = 'ultron_crimson') => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      const insideColor = new THREE.Color(
        palette === 'ultron_crimson' ? '#ff3344' : palette === 'cosmic_violet' ? '#c084fc' : '#38bdf8'
      );
      const outsideColor = new THREE.Color(
        palette === 'ultron_crimson' ? '#991b1b' : palette === 'cosmic_violet' ? '#581c87' : '#0369a1'
      );
      const coreColor = new THREE.Color('#ffffff');

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Radial distance with higher density toward the core
        const radius = Math.pow(Math.random(), 2.2) * 22;
        const spinAngle = radius * tightness;
        const branchAngle = ((i % arms) / arms) * Math.PI * 2;

        // Random dispersion away from arm spine
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.45 * radius;
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * (1 + radius * 0.1);
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.45 * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        // Color interpolation based on distance
        const mixedColor = insideColor.clone();
        mixedColor.lerp(outsideColor, radius / 22);

        // Core bright white stars
        if (radius < 2.0) {
          mixedColor.lerp(coreColor, 1 - radius / 2.0);
        }

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        // Star size variation
        sizes[i] = Math.random() * 2.5 + (radius < 3 ? 2.0 : 0.8);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      return geometry;
    },
    []
  );

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    scene.fog = new THREE.FogExp2(0x020306, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 18, 26);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 65;
    controls.maxPolarAngle = Math.PI * 0.88;
    controlsRef.current = controls;

    // Build Central Supermassive Black Hole Core & Accretion Disk
    const coreGroup = new THREE.Group();

    // Black Hole Event Horizon (pure black sphere)
    const holeGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const holeMesh = new THREE.Mesh(holeGeom, holeMat);
    coreGroup.add(holeMesh);

    // Glowing Gravitational Accretion Disk
    const diskGeom = new THREE.RingGeometry(1.3, 3.8, 64);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xff2233,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const diskMesh = new THREE.Mesh(diskGeom, diskMat);
    diskMesh.rotation.x = Math.PI / 2;
    coreGroup.add(diskMesh);
    coreMeshRef.current = diskMesh;

    // Relativistic Polar Jet Beam (vertical plasma beams)
    const jetGroup = new THREE.Group();
    const jetGeom = new THREE.CylinderGeometry(0.1, 0.9, 14, 16);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
    });
    const jetUp = new THREE.Mesh(jetGeom, jetMat);
    jetUp.position.y = 7;
    const jetDown = new THREE.Mesh(jetGeom, jetMat);
    jetDown.position.y = -7;
    jetDown.rotation.x = Math.PI;
    jetGroup.add(jetUp, jetDown);
    coreGroup.add(jetGroup);
    jetRef.current = jetGroup;

    scene.add(coreGroup);

    // Initial Star Particles
    const starGeom = generateGalaxyStars(36000, 4, spiralTightness, nebulaPalette);
    const starMat = new THREE.PointsMaterial({
      size: 0.07,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    scene.add(starPoints);
    galaxyPointsRef.current = starPoints;

    // Galactic Dust Nebulae
    const nebulaGeom = generateGalaxyStars(8000, 4, spiralTightness * 1.1, nebulaPalette);
    const nebulaMat = new THREE.PointsMaterial({
      size: 0.35,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const nebulaPoints = new THREE.Points(nebulaGeom, nebulaMat);
    scene.add(nebulaPoints);
    nebulaPointsRef.current = nebulaPoints;

    // Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isRotating) {
        if (galaxyPointsRef.current) {
          galaxyPointsRef.current.rotation.y += delta * rotationSpeed * 0.4;
        }
        if (nebulaPointsRef.current) {
          nebulaPointsRef.current.rotation.y += delta * rotationSpeed * 0.45;
        }
        if (coreMeshRef.current) {
          coreMeshRef.current.rotation.z += delta * rotationSpeed * 2.5;
        }
        if (jetRef.current) {
          jetRef.current.rotation.y += delta * rotationSpeed * 1.8;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry when Spiral Tightness or Palette changes
  useEffect(() => {
    if (!sceneRef.current || !galaxyPointsRef.current || !nebulaPointsRef.current) return;

    // Re-generate stars
    const newStarGeom = generateGalaxyStars(36000, 4, spiralTightness, nebulaPalette);
    galaxyPointsRef.current.geometry.dispose();
    galaxyPointsRef.current.geometry = newStarGeom;

    const newNebulaGeom = generateGalaxyStars(8000, 4, spiralTightness * 1.1, nebulaPalette);
    nebulaPointsRef.current.geometry.dispose();
    nebulaPointsRef.current.geometry = newNebulaGeom;
  }, [spiralTightness, nebulaPalette, generateGalaxyStars]);

  // Quadrant Jump
  const handleWaypointJump = (quadrant: GalaxyQuadrant) => {
    setActiveQuadrant(quadrant);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    let telem: GalaxyTelemetry;

    if (quadrant === 'SAGITTARIUS_A_CORE') {
      camera.position.set(0, 5, 8);
      controls.target.set(0, 0, 0);
      telem = {
        quadrant,
        name: 'GALACTIC NUCLEUS // SAGITTARIUS A*',
        starsEstimate: '250 - 400 Billion Stars',
        blackHoleMass: '4.154 × 10⁶ M☉ (Solar Masses)',
        angularVelocity: '220 km/s Galactic Rotation',
        radiationIndex: '1.42 × 10³⁸ ergs/s Synchrotron',
        coordinates: 'RA 17h 45m 40s | Dec -29° 00′ 28″',
        threatLevel: 'SINGULARITY',
      };
    } else if (quadrant === 'ORION_CYGNUS_ARM') {
      camera.position.set(10, 8, 10);
      controls.target.set(8, 0, 8);
      telem = {
        quadrant,
        name: 'ORION-CYGNUS SPIRAL SPUR // LOCAL BUBBLE',
        starsEstimate: 'Sol & Adjacent Stellar Neighborhood',
        blackHoleMass: 'Sub-Critical (Local Stellar Black Holes)',
        angularVelocity: '240 km/s Relative to Core',
        radiationIndex: '0.04 mSv/yr Background Cosmic',
        coordinates: 'Distance to Galactic Core: 26,660 Light Years',
        threatLevel: 'ALPHA_DOMINANT',
      };
    } else if (quadrant === 'PERSEUS_ARM') {
      camera.position.set(-14, 9, 12);
      controls.target.set(-12, 0, 10);
      telem = {
        quadrant,
        name: 'PERSEUS SPIRAL ARM // MAJOR DENSITY WAVE',
        starsEstimate: 'Massive O & B Star Clusters',
        blackHoleMass: 'Distributed Binary Micro-Quasars',
        angularVelocity: '215 km/s Galactic Shear',
        radiationIndex: '0.88 × 10³⁴ ergs/s Supernova Remnants',
        coordinates: 'Outer Radius: 35,000 Light Years',
        threatLevel: 'STABLE',
      };
    } else if (quadrant === 'SCUTUM_CENTAURUS_ARM') {
      camera.position.set(12, 7, -12);
      controls.target.set(10, 0, -10);
      telem = {
        quadrant,
        name: 'SCUTUM-CENTAURUS ARM // MOLECULAR CLOUD FORGE',
        starsEstimate: 'Highest Star-Formation Rate in Galaxy',
        blackHoleMass: 'Intermediate Mass Candidates',
        angularVelocity: '228 km/s Orbital Velocity',
        radiationIndex: 'High Infrared & Carbon Monoxide Emission',
        coordinates: 'Bar Anchor Radius: 16,000 Light Years',
        threatLevel: 'VOLATILE',
      };
    } else {
      camera.position.set(0, 32, 40);
      controls.target.set(0, 0, 0);
      telem = {
        quadrant: 'OUTER_RIM',
        name: 'GALACTIC CORONA & DARK MATTER HALO',
        starsEstimate: 'Globular Clusters & Intergalactic Streams',
        blackHoleMass: 'Zero Central Singularity',
        angularVelocity: 'Flattened Rotation Curve (Dark Matter Dominated)',
        radiationIndex: 'Cosmic Microwave Background (2.725 K)',
        coordinates: 'Radius > 50,000 Light Years',
        threatLevel: 'STABLE',
      };
    }

    controls.update();
    setTelemetry(telem);
    onSelectQuadrant?.(telem);
  };

  return (
    <div className={`relative flex flex-col w-full h-full bg-[#020306] border border-red-950/60 rounded-xs overflow-hidden select-none font-mono ${className}`}>
      {/* TOP HEADER: Galaxy Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#060810]/95 border-b border-zinc-800/90 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-950/70 border border-red-800/80 rounded-xs text-red-400 text-xs font-bold shadow-[0_0_8px_rgba(239,68,68,0.25)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tracking-wider">ULTRON 3D GALAXY VIEWPORT</span>
          </div>

          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            35,000+ LOGARITHMIC STELLAR MASSES
          </span>
        </div>

        {/* Quadrant Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {(
            [
              { id: 'SAGITTARIUS_A_CORE', label: 'SAGITTARIUS A*' },
              { id: 'ORION_CYGNUS_ARM', label: 'ORION ARM' },
              { id: 'PERSEUS_ARM', label: 'PERSEUS' },
              { id: 'SCUTUM_CENTAURUS_ARM', label: 'SCUTUM' },
              { id: 'OUTER_RIM', label: 'GALAXY DISK' },
            ] as const
          ).map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => handleWaypointJump(q.id)}
              className={`px-2 py-0.5 text-[10px] rounded-xs cursor-pointer tracking-wider whitespace-nowrap transition-colors ${
                activeQuadrant === q.id
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_6px_#ef4444]'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WEBGL CANVAS */}
      <div className="flex-1 relative w-full h-full min-h-[360px] overflow-hidden">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* FLOATING TOP-LEFT: ACTIVE GALAXY QUADRANT TELEMETRY */}
        <div className="absolute top-3 left-3 bg-[#060810]/90 border border-red-950/80 p-2.5 rounded-xs backdrop-blur-md z-10 max-w-[280px] text-[10px] shadow-lg pointer-events-auto">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1 mb-1.5">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-red-500 animate-spin" style={{ animationDuration: '10s' }} />
              {telemetry.name}
            </span>
            <span
              className={`px-1 py-0.2 rounded-xs text-[9px] font-bold ${
                telemetry.threatLevel === 'SINGULARITY'
                  ? 'bg-red-950 text-red-300 border border-red-700'
                  : 'bg-zinc-900 text-zinc-300'
              }`}
            >
              {telemetry.threatLevel}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-[9px] font-mono text-zinc-400">
            <div>
              STELLAR DENSITY: <span className="text-zinc-100 font-bold">{telemetry.starsEstimate}</span>
            </div>
            <div>
              BLACK HOLE MASS: <span className="text-red-300 font-bold">{telemetry.blackHoleMass}</span>
            </div>
            <div>
              ANGULAR VELOCITY: <span className="text-cyan-300">{telemetry.angularVelocity}</span>
            </div>
            <div>
              COORDINATES: <span className="text-zinc-200">{telemetry.coordinates}</span>
            </div>
          </div>
        </div>

        {/* FLOATING TOP-RIGHT: GALAXY ROTATION & PALETTE CONTROLS */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-auto bg-[#060810]/90 border border-zinc-800 p-2 rounded-xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-zinc-400">ROTATION:</span>
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className={`px-1.5 py-0.5 text-[9px] rounded-xs font-bold cursor-pointer ${
                isRotating ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isRotating ? 'ENGAGED' : 'PAUSED'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-1">
            <span className="text-[9px] font-bold text-zinc-400">NEBULA:</span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'ultron_crimson', label: 'CRIMSON' },
                  { id: 'cosmic_violet', label: 'VIOLET' },
                  { id: 'deep_space', label: 'CYAN' },
                ] as const
              ).map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setNebulaPalette(pal.id)}
                  className={`px-1 py-0.2 text-[8px] rounded-xs cursor-pointer ${
                    nebulaPalette === pal.id
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pal.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-1 text-[9px]">
            <span className="text-zinc-400">SPIRAL TIGHTNESS:</span>
            <div className="flex items-center gap-1">
              {[2.4, 3.2, 4.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSpiralTightness(val)}
                  className={`px-1 py-0.2 rounded-xs cursor-pointer ${
                    spiralTightness === val
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM HUD BANNER */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#060810]/85 border border-red-950/70 p-2 rounded-xs backdrop-blur-md z-10 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="font-bold text-zinc-200">
              ULTRON GALACTIC OVERSEER MATRIX // ZERO LATENCY RELAY
            </span>
          </div>

          <span className="text-zinc-400 hidden md:inline">
            Drag to Orbit • Scroll to Zoom • Right-click to Pan
          </span>
        </div>
      </div>
    </div>
  );
};
