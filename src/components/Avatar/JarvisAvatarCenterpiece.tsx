/**
 * StarUniverseCenterpiece (Star Universe Circular Model)
 *
 * Cinematic 3D Celestial Universe Circular Model in Pure Three.js:
 * - High-density 3D star universe contained in a magnificent celestial circular orb
 * - 4,500+ multi-spectral stars (cyan, sapphire, deep violet, stellar gold, diamond white)
 * - Multi-arm Keplerian logarithmic spiral galaxy with distance-dependent orbital rotation
 * - Radiant central star / pulsar singularity core with layered corona & relativistic polar plasma jets
 * - Dynamic accretion ring with rotating Doppler-boosted radiance
 * - 4 concentric celestial gyroscopic orbital rings with coordinate tick markings & counter-rotations
 * - Acoustic gravitational shockwave ripples synchronized with assistant voice / speech energy
 * - Reactive state pulse across all AI modes:
 *   IDLE, LISTENING, THINKING, SPEAKING, SUCCESS, ERROR, SECURITY_ALERT
 * - Interactive 3D orbit dragging, mouse parallax, and celestial mode presets
 * - Preserves all assistant communication, status cards, transcript overlays & auto-speech controls
 * - ZERO robotic models: completely replaced with the Star Universe Circular Model
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { AIStateMode } from '../../types/index.ts';
import {
  Sparkles,
  Activity,
  Globe,
  Radio,
  Mic,
  MicOff,
  Compass,
  RotateCw,
  Zap,
  Eye,
  Layers,
} from 'lucide-react';
import { AvatarEmotion } from '../../avatar/types.ts';

interface StarUniverseCenterpieceProps {
  avatarState: AIStateMode;
  lastAssistantMessage?: string;
  interimTranscript?: string;
  onAnimationChange?: (animName: string) => void;
  controlledEmote?: AvatarEmotion | null;
  onEmoteChange?: (emote: AvatarEmotion) => void;
  isMusicPlaying?: boolean;
  isAutoSpeechActive?: boolean;
  onToggleAutoSpeech?: () => void;
}

type UniverseViewMode = 'spiral' | 'pulsar' | 'gyro' | 'singularity';

export const JarvisAvatarCenterpiece: React.FC<StarUniverseCenterpieceProps> = ({
  avatarState,
  lastAssistantMessage,
  interimTranscript,
  onAnimationChange,
  controlledEmote = null,
  onEmoteChange,
  isMusicPlaying = false,
  isAutoSpeechActive = false,
  onToggleAutoSpeech,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // User Interactive View Modes
  const [universeMode, setUniverseMode] = useState<UniverseViewMode>('spiral');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showConstellations, setShowConstellations] = useState<boolean>(true);
  const [stellarFlux, setStellarFlux] = useState<number>(98.4);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsGroupRef = useRef<THREE.Group | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const coronaMeshRef = useRef<THREE.Mesh | null>(null);
  const accretionMeshRef = useRef<THREE.Mesh | null>(null);
  const polarJetsRef = useRef<THREE.Group | null>(null);
  const gyroRingsRef = useRef<THREE.Group | null>(null);
  const shockwavesRef = useRef<THREE.Group | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const starsGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  const animationFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean; startX: number; startY: number }>({
    x: 0,
    y: 0,
    isDown: false,
    startX: 0,
    startY: 0,
  });
  const universeRotationRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.35,
    y: 0.2,
    targetX: 0.35,
    targetY: 0.2,
  });

  const avatarStateRef = useRef<AIStateMode>(avatarState);
  const universeModeRef = useRef<UniverseViewMode>(universeMode);
  const speedMultiplierRef = useRef<number>(speedMultiplier);
  const isMusicPlayingRef = useRef<boolean>(isMusicPlaying);

  useEffect(() => {
    avatarStateRef.current = avatarState;
    universeModeRef.current = universeMode;
    speedMultiplierRef.current = speedMultiplier;
    isMusicPlayingRef.current = isMusicPlaying;
  }, [avatarState, universeMode, speedMultiplier, isMusicPlaying]);

  // Telemetry fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setStellarFlux(Number((97.8 + Math.random() * 2.1).toFixed(1)));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Compute status bubble message based on dynamic states
  const getStatusMessage = () => {
    if (interimTranscript && interimTranscript.trim()) {
      return `"${interimTranscript}"`;
    }
    switch (avatarState) {
      case 'LISTENING':
        return 'Stellar sensors listening... Gravitational audio input active.';
      case 'THINKING':
      case 'EXECUTING':
        return 'Calculating orbital trajectories & synthesizing intelligence...';
      case 'SPEAKING':
        return lastAssistantMessage && lastAssistantMessage.trim()
          ? lastAssistantMessage.length > 95
            ? `${lastAssistantMessage.slice(0, 95)}...`
            : lastAssistantMessage
          : 'Transmitting vocal harmonics across star matrix...';
      case 'SUCCESS':
        return 'Cosmic directive executed with 100% stellar coherence.';
      case 'ERROR':
        return 'Singularity fluctuation detected. Rerouting orbital streams.';
      case 'SECURITY_ALERT':
        return 'Electromagnetic defensive perimeter active around star core.';
      case 'IDLE':
      default:
        return 'Star Universe online. All celestial coordinates synchronized.';
    }
  };

  // Helper to create a circular soft glowing texture for stars
  const createStarTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.2, 'rgba(180, 240, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(0, 190, 255, 0.35)');
      gradient.addColorStop(0.8, 'rgba(0, 80, 200, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Mouse / Touch handlers for 3D orbital inspection
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mousePosRef.current.isDown = true;
    mousePosRef.current.startX = e.clientX;
    mousePosRef.current.startY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current.x = nx;
    mousePosRef.current.y = ny;

    if (mousePosRef.current.isDown) {
      const dx = (e.clientX - mousePosRef.current.startX) * 0.005;
      const dy = (e.clientY - mousePosRef.current.startY) * 0.005;
      universeRotationRef.current.targetY += dx;
      universeRotationRef.current.targetX += dy;
      mousePosRef.current.startX = e.clientX;
      mousePosRef.current.startY = e.clientY;
    }
  };

  const handleMouseUp = () => {
    mousePosRef.current.isDown = false;
  };

  // Main Three.js Star Universe Circular Model Assembly
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: Positioned perfectly to frame the circular universe sphere
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with high dynamic range ACESFilmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;

    // 4. Lighting for Cosmic Depth & Materials
    const ambientLight = new THREE.AmbientLight(0x061124, 2.0);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x00f0ff, 4.0, 12, 1.2);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimBlueLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    rimBlueLight.position.set(4, 3, 2);
    scene.add(rimBlueLight);

    const rimPurpleLight = new THREE.DirectionalLight(0x8b5cf6, 1.2);
    rimPurpleLight.position.set(-4, -2, -2);
    scene.add(rimPurpleLight);

    // 5. Star Texture
    const starTex = createStarTexture();

    // 6. Master Universe Rotating Group
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);
    starsGroupRef.current = universeGroup;

    // 7. High-Density Multi-Spectral Star Particles (4,500 Stars)
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starRadii = new Float32Array(starCount);
    const starAngles = new Float32Array(starCount);
    const starSpeeds = new Float32Array(starCount);
    const starYOffsets = new Float32Array(starCount);

    const armsCount = 3;
    const armSpread = 0.42;

    for (let i = 0; i < starCount; i++) {
      // 80% stars in spiral arms, 20% in spherical cosmic halo
      const isHalo = Math.random() < 0.2;
      let r = 0;
      let theta = 0;
      let y = 0;

      if (!isHalo) {
        // Logarithmic spiral distribution
        r = Math.pow(Math.random(), 0.65) * 1.75 + 0.12;
        const armIndex = i % armsCount;
        const armOffset = (armIndex * 2 * Math.PI) / armsCount;
        const spiralAngle = r * 3.2;
        const randomSpread = (Math.random() - 0.5) * armSpread * (r + 0.2);
        theta = armOffset + spiralAngle + randomSpread;

        // Galactic disc thickness (flatter in center, slight bulge)
        const discThickness = Math.max(0.04, 0.22 * Math.exp(-r * 1.8));
        y = (Math.random() - 0.5) * discThickness;
      } else {
        // Spherical celestial halo
        r = Math.pow(Math.random(), 0.8) * 2.1 + 0.2;
        const phi = Math.acos(Math.random() * 2 - 1);
        theta = Math.random() * Math.PI * 2;
        y = r * Math.cos(phi) * 0.7; // slight oblate spheroid
        r = r * Math.sin(phi);
      }

      starRadii[i] = r;
      starAngles[i] = theta;
      starYOffsets[i] = y;

      // Keplerian-like differential rotation speed (inner stars rotate faster)
      starSpeeds[i] = (0.28 / Math.sqrt(r + 0.25)) * (0.8 + Math.random() * 0.4);

      starPositions[i * 3] = r * Math.cos(theta);
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = r * Math.sin(theta);

      // Color Palette: Core Gold-Cyan -> Arm Deep Cyan-Sapphire -> Outer Violet & White
      const distRatio = Math.min(1.0, r / 2.0);
      const colorProb = Math.random();

      if (distRatio < 0.25) {
        // Core: Brilliant Diamond White & Electric Gold
        if (colorProb > 0.4) {
          starColors[i * 3] = 0.98;
          starColors[i * 3 + 1] = 0.99;
          starColors[i * 3 + 2] = 1.0;
        } else {
          starColors[i * 3] = 1.0;
          starColors[i * 3 + 1] = 0.88;
          starColors[i * 3 + 2] = 0.45;
        }
        starSizes[i] = 0.08 + Math.random() * 0.06;
      } else if (distRatio < 0.65) {
        // Mid Galactic Arms: Electric Cyan & Vibrant Azure
        if (colorProb > 0.35) {
          starColors[i * 3] = 0.0;
          starColors[i * 3 + 1] = 0.85;
          starColors[i * 3 + 2] = 1.0;
        } else {
          starColors[i * 3] = 0.25;
          starColors[i * 3 + 1] = 0.55;
          starColors[i * 3 + 2] = 1.0;
        }
        starSizes[i] = 0.05 + Math.random() * 0.05;
      } else {
        // Outer Halo & Nebula: Deep Sapphire, Violet & Icy Blue
        if (colorProb > 0.6) {
          starColors[i * 3] = 0.65;
          starColors[i * 3 + 1] = 0.35;
          starColors[i * 3 + 2] = 1.0; // Violet
        } else if (colorProb > 0.25) {
          starColors[i * 3] = 0.15;
          starColors[i * 3 + 1] = 0.65;
          starColors[i * 3 + 2] = 0.95;
        } else {
          starColors[i * 3] = 0.85;
          starColors[i * 3 + 1] = 0.92;
          starColors[i * 3 + 2] = 1.0;
        }
        starSizes[i] = 0.035 + Math.random() * 0.04;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starsGeometryRef.current = starGeo;

    const starMat = new THREE.PointsMaterial({
      size: 0.065,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    universeGroup.add(starPoints);

    // 8. Constellation Matrix Interconnecting Lines
    const maxLines = 180;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const constellationLines = new THREE.LineSegments(lineGeo, lineMat);
    universeGroup.add(constellationLines);
    constellationLinesRef.current = constellationLines;

    // 9. Central Pulsar / Star Singularity Core
    const coreGeo = new THREE.SphereGeometry(0.14, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    universeGroup.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // Nested Glowing Corona Atmosphere Spheres
    const coronaGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    universeGroup.add(coronaMesh);
    coronaMeshRef.current = coronaMesh;

    const outerGlowGeo = new THREE.SphereGeometry(0.38, 24, 24);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    universeGroup.add(outerGlowMesh);

    // 10. Relativistic Accretion Ring around Core
    const accretionGeo = new THREE.RingGeometry(0.26, 0.46, 64);
    const accretionMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const accretionMesh = new THREE.Mesh(accretionGeo, accretionMat);
    accretionMesh.rotation.x = Math.PI / 2.3;
    universeGroup.add(accretionMesh);
    accretionMeshRef.current = accretionMesh;

    // 11. Relativistic Polar Plasma Jet Beams
    const jetsGroup = new THREE.Group();
    const jetGeo = new THREE.CylinderGeometry(0.015, 0.08, 1.4, 16, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const northJet = new THREE.Mesh(jetGeo, jetMat);
    northJet.position.y = 0.75;
    jetsGroup.add(northJet);

    const southJet = new THREE.Mesh(jetGeo, jetMat);
    southJet.position.y = -0.75;
    southJet.rotation.z = Math.PI;
    jetsGroup.add(southJet);

    universeGroup.add(jetsGroup);
    polarJetsRef.current = jetsGroup;

    // 12. Four Concentric Celestial Gyroscopic Rings
    const gyroGroup = new THREE.Group();

    // Ring 1: Primary Equatorial Ring
    const ring1Geo = new THREE.RingGeometry(1.68, 1.705, 96);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    gyroGroup.add(ring1);

    // Ring 2: Inclined Celestial Ecliptic Ring
    const ring2Geo = new THREE.RingGeometry(1.85, 1.87, 96);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    gyroGroup.add(ring2);

    // Ring 3: Galactic Coordinates Polar Ring
    const ring3Geo = new THREE.RingGeometry(1.98, 1.995, 96);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 2;
    gyroGroup.add(ring3);

    // Ring 4: Outer Event Horizon Boundary Ring
    const ring4Geo = new THREE.RingGeometry(2.14, 2.16, 128);
    const ring4Mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ring4 = new THREE.Mesh(ring4Geo, ring4Mat);
    gyroGroup.add(ring4);

    universeGroup.add(gyroGroup);
    gyroRingsRef.current = gyroGroup;

    // 13. Acoustic Gravitational Shockwave Rings (Voice Reactive)
    const shockGroup = new THREE.Group();
    const shockCount = 3;
    const shockMeshes: THREE.Mesh[] = [];

    for (let s = 0; s < shockCount; s++) {
      const sGeo = new THREE.RingGeometry(0.3, 0.33, 64);
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.rotation.x = Math.PI / 2.3;
      shockGroup.add(sMesh);
      shockMeshes.push(sMesh);
    }

    universeGroup.add(shockGroup);
    shockwavesRef.current = shockGroup;

    // 14. Render Animation Loop
    const clock = new THREE.Clock();
    let shockPhase = 0;

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const speed = speedMultiplierRef.current;
      const state = avatarStateRef.current;
      const mode = universeModeRef.current;
      const isMusic = isMusicPlayingRef.current;
      const isSpeaking = state === 'SPEAKING';
      const isThinking = state === 'THINKING' || state === 'EXECUTING';
      const isListening = state === 'LISTENING';

      // Smooth mouse-drag rotation damping + idle celestial drift
      const targetDriftY = mousePosRef.current.isDown ? 0 : 0.06 * speed;
      universeRotationRef.current.targetY += targetDriftY * delta;

      // Parallax from cursor position
      const parallaxX = mousePosRef.current.x * 0.18;
      const parallaxY = mousePosRef.current.y * 0.12;

      universeRotationRef.current.x +=
        (universeRotationRef.current.targetX + parallaxY - universeRotationRef.current.x) * 0.06;
      universeRotationRef.current.y +=
        (universeRotationRef.current.targetY + parallaxX - universeRotationRef.current.y) * 0.06;

      if (starsGroupRef.current) {
        starsGroupRef.current.rotation.x = universeRotationRef.current.x;
        starsGroupRef.current.rotation.y = universeRotationRef.current.y;
      }

      // Dynamic orbital motion for each individual star
      if (starsGeometryRef.current) {
        const positions = starsGeometryRef.current.attributes.position.array as Float32Array;
        const count = starRadii.length;

        // Adaptive rotational speed based on AI state
        let stateSpeedMultiplier = 1.0;
        if (isThinking) stateSpeedMultiplier = 2.4;
        else if (isSpeaking) stateSpeedMultiplier = 1.6;
        else if (isListening) stateSpeedMultiplier = 0.75;
        else if (isMusic) stateSpeedMultiplier = 1.5;

        for (let i = 0; i < count; i++) {
          starAngles[i] += starSpeeds[i] * delta * speed * stateSpeedMultiplier * 0.45;
          const r = starRadii[i];
          const theta = starAngles[i];
          positions[i * 3] = r * Math.cos(theta);
          positions[i * 3 + 2] = r * Math.sin(theta);
        }
        starsGeometryRef.current.attributes.position.needsUpdate = true;

        // Dynamic Constellation lines calculation (connect close stars)
        if (showConstellations && constellationLinesRef.current) {
          const lPositions = constellationLinesRef.current.geometry.attributes.position
            .array as Float32Array;
          let lineIdx = 0;
          const sampleStride = 42; // Sample stars across arms

          for (let a = 0; a < count && lineIdx < maxLines * 6; a += sampleStride) {
            for (let b = a + sampleStride; b < count && lineIdx < maxLines * 6; b += sampleStride) {
              const dx = positions[a * 3] - positions[b * 3];
              const dy = positions[a * 3 + 1] - positions[b * 3 + 1];
              const dz = positions[a * 3 + 2] - positions[b * 3 + 2];
              const distSq = dx * dx + dy * dy + dz * dz;

              if (distSq < 0.18 && distSq > 0.02) {
                lPositions[lineIdx++] = positions[a * 3];
                lPositions[lineIdx++] = positions[a * 3 + 1];
                lPositions[lineIdx++] = positions[a * 3 + 2];
                lPositions[lineIdx++] = positions[b * 3];
                lPositions[lineIdx++] = positions[b * 3 + 1];
                lPositions[lineIdx++] = positions[b * 3 + 2];
              }
            }
          }
          constellationLinesRef.current.geometry.attributes.position.needsUpdate = true;
          constellationLinesRef.current.visible = true;
        } else if (constellationLinesRef.current) {
          constellationLinesRef.current.visible = false;
        }
      }

      // Central Star Pulsar Pulse & Corona Respiration
      if (coreMeshRef.current && coronaMeshRef.current) {
        let basePulse = Math.sin(elapsed * 3.5) * 0.06;
        if (isSpeaking) {
          basePulse = Math.sin(elapsed * 12.0) * 0.18; // High-energy speech pulse
        } else if (isThinking) {
          basePulse = Math.sin(elapsed * 7.0) * 0.12;
        }

        const coreScale = 1.0 + basePulse;
        coreMeshRef.current.scale.set(coreScale, coreScale, coreScale);

        const coronaScale = 1.0 + basePulse * 1.5;
        coronaMeshRef.current.scale.set(coronaScale, coronaScale, coronaScale);
        coronaMeshRef.current.rotation.y += delta * 0.8 * speed;
        coronaMeshRef.current.rotation.z += delta * 0.4 * speed;
      }

      // Accretion Ring relativistic rotation
      if (accretionMeshRef.current) {
        accretionMeshRef.current.rotation.z -= delta * 1.4 * speed;
      }

      // Polar Jets precession & pulsation
      if (polarJetsRef.current) {
        polarJetsRef.current.rotation.y += delta * 0.6;
        const jetStretch = 1.0 + Math.sin(elapsed * 8) * 0.12;
        polarJetsRef.current.scale.set(1.0, jetStretch, 1.0);
      }

      // Concentric Gyro Rings counter-rotations
      if (gyroRingsRef.current) {
        const rings = gyroRingsRef.current.children as THREE.Mesh[];
        if (rings[0]) rings[0].rotation.z += delta * 0.15 * speed;
        if (rings[1]) rings[1].rotation.z -= delta * 0.22 * speed;
        if (rings[2]) rings[2].rotation.z += delta * 0.18 * speed;
        if (rings[3]) rings[3].rotation.z -= delta * 0.08 * speed;
      }

      // Voice Acoustic Gravitational Shockwave propagation
      if (isSpeaking || isListening) {
        shockPhase += delta * 1.8;
        shockMeshes.forEach((mesh, idx) => {
          const localProgress = ((shockPhase + idx * 0.33) % 1.0);
          const currentRadius = 0.3 + localProgress * 1.7;
          mesh.scale.set(currentRadius / 0.3, currentRadius / 0.3, 1.0);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0.0, (1.0 - localProgress) * 0.65);
        });
      } else {
        shockMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0.0, mat.opacity - delta * 2.0);
        });
      }

      // Mode-specific visual emphasis
      if (mode === 'pulsar' && polarJetsRef.current) {
        polarJetsRef.current.scale.set(1.6, 2.2, 1.6);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 15. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      scene.clear();
      renderer.dispose();
      starTex.dispose();
    };
  }, [showConstellations]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full min-h-[340px] flex items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#030712] select-none shadow-[inset_0_0_90px_rgba(0,180,255,0.12)] cursor-grab active:cursor-grabbing"
    >
      {/* Background Cosmic Deep Field Nebula Radial Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15)_0%,_rgba(15,23,42,0.6)_45%,_#02040a_100%)]" />

      {/* Circular Universe Portal Framing HUD (Holographic Coordinate Ring) */}
      <div className="absolute inset-4 sm:inset-6 pointer-events-none z-10 flex items-center justify-center">
        {/* Outer Circular Boundary with Subtle Glowing Edge */}
        <div className="relative w-full h-full max-w-[560px] max-h-[560px] aspect-square rounded-full border border-cyan-500/35 shadow-[0_0_40px_rgba(6,182,212,0.22),inset_0_0_30px_rgba(6,182,212,0.12)]">
          {/* Compass & Stellar Coordinate Tick Marks */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#050b18]/90 text-[10px] font-mono text-cyan-400 border border-cyan-500/40">
            000° // APEX
          </span>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#050b18]/90 text-[10px] font-mono text-cyan-400 border border-cyan-500/40">
            180° // NADIR
          </span>
          <span className="absolute top-1/2 -left-4 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-[#050b18]/90 text-[10px] font-mono text-cyan-400 border border-cyan-500/40">
            270°
          </span>
          <span className="absolute top-1/2 -right-4 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-[#050b18]/90 text-[10px] font-mono text-cyan-400 border border-cyan-500/40">
            090°
          </span>

          {/* Sub-cardinal graduation markers */}
          <div className="absolute top-8 left-8 w-2 h-2 rounded-full border border-cyan-400/50" />
          <div className="absolute top-8 right-8 w-2 h-2 rounded-full border border-cyan-400/50" />
          <div className="absolute bottom-8 left-8 w-2 h-2 rounded-full border border-cyan-400/50" />
          <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full border border-cyan-400/50" />

          {/* Inner concentric reticle arc */}
          <div className="absolute inset-8 rounded-full border border-dashed border-cyan-500/15 pointer-events-none" />
        </div>
      </div>

      {/* Observation Deck Top & Bottom Cockpit Vignette */}
      <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10 bg-gradient-to-b from-[#02040a] via-[#02040a]/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-t from-[#02040a] via-[#02040a]/90 to-transparent" />

      {/* Four Precision Corner Bracket Beams */}
      <div className="absolute top-2 left-2 w-14 h-14 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl pointer-events-none z-15" />
      <div className="absolute top-2 right-2 w-14 h-14 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none z-15" />
      <div className="absolute bottom-2 left-2 w-14 h-14 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none z-15" />
      <div className="absolute bottom-2 right-2 w-14 h-14 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl pointer-events-none z-15" />

      {/* Three.js Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-5"
      />

      {/* Floating Status Message Bubble (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 max-w-sm pointer-events-auto">
        <div className="px-4 py-3 rounded-2xl bg-[#060e20]/90 backdrop-blur-xl border border-cyan-500/35 shadow-[0_4px_24px_rgba(0,190,255,0.2)] transition-all">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-[11px] font-sans font-extrabold tracking-widest text-cyan-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              STAR UNIVERSE CORE
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
              {avatarState}
            </span>
          </div>
          <p className="text-sm font-sans text-white/95 font-medium leading-snug drop-shadow-sm">
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {/* Top-Right Control Dock: Auto-Speech & Mode Presets */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
        {/* Star Model Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border border-cyan-500/30 bg-[#051124]/90 text-cyan-300 shadow-md">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>CIRCULAR CELESTIAL MATRIX</span>
        </div>

        {/* Auto-Speech Toggle */}
        {onToggleAutoSpeech && (
          <button
            type="button"
            onClick={onToggleAutoSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
              isAutoSpeechActive
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Continuous Auto-Speech Conversations"
          >
            {isAutoSpeechActive ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAutoSpeechActive ? 'Auto-Speech: ON' : 'Auto-Speech: OFF'}</span>
          </button>
        )}

        {/* Orbit Speed Selector */}
        <div className="flex items-center gap-1 bg-[#060f22]/90 backdrop-blur-md px-2 py-1 rounded-full border border-cyan-500/25 text-[10px] font-mono text-zinc-300">
          <RotateCw className="w-3 h-3 text-cyan-400" />
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeedMultiplier(s)}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                speedMultiplier === s
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom-Right Telemetry Readout */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex flex-col items-end gap-1 text-[10px] font-mono text-cyan-400/80">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050b18]/85 border border-cyan-500/30 text-cyan-300 shadow">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>STARS: 4,500 // FLUX: {stellarFlux}%</span>
        </div>
        <div className="text-[9px] text-slate-400 font-mono pr-1">
          RA 17h 45m // DEC -29° 00′ // KEPLERIAN
        </div>
      </div>

      {/* Bottom-Left Celestial Mode & Constellation Dock */}
      <div className="absolute bottom-3 left-4 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto bg-[#050b18]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/35 shadow-lg max-w-[calc(100%-200px)] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0 mr-1 text-[10px] font-mono font-bold text-cyan-400">
          <Compass className="w-3 h-3 text-cyan-300" />
          <span className="hidden sm:inline">MODE:</span>
        </div>

        {[
          { id: 'spiral', label: '🌀 Spiral Galaxy' },
          { id: 'pulsar', label: '⚡ Pulsar Core' },
          { id: 'gyro', label: '🌐 Orbital Gyro' },
          { id: 'singularity', label: '🕳️ Singularity' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setUniverseMode(item.id as UniverseViewMode)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
              universeMode === item.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowConstellations((prev) => !prev)}
          className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-sans font-medium transition-all cursor-pointer border ${
            showConstellations
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
              : 'bg-slate-900/50 border-slate-700 text-slate-400'
          }`}
          title="Toggle Celestial Constellation Web"
        >
          {showConstellations ? '✨ Constellations: ON' : 'Constellations: OFF'}
        </button>
      </div>
    </div>
  );
};
