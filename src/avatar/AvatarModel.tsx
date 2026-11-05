/**
 * 3D Avatar Model Component (Phase 5 - Section 12 & 21)
 *
 * Supports:
 * - External GLTF / GLB rigged models via AVATAR_MODEL_PATH or config
 * - Blendshape / morph target mapping (ARKit / ReadyPlayerMe standards)
 * - Safe fallback to a clean 3D procedural digital assistant rig when no GLB is configured
 * - Resilient error handling (never crashes the app if an invalid model URL is provided)
 */

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AvatarAnimationState } from './types.ts';
import { MorphTargetWeights } from './AvatarAnimationController.ts';

interface AvatarModelProps {
  modelPath?: string;
  animationState: AvatarAnimationState;
  morphTargets: MorphTargetWeights;
  scale?: number;
  quality?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const AvatarModel: React.FC<AvatarModelProps> = ({
  modelPath,
  animationState,
  morphTargets,
  scale = 1.0,
  quality = 'MEDIUM',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headBoneRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  // GLTF loaded model state
  const [loadedScene, setLoadedScene] = useState<THREE.Group | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const morphTargetMeshes = useRef<THREE.Mesh[]>([]);
  const gltfHeadBone = useRef<THREE.Object3D | null>(null);

  // Load external model if valid path is provided
  useEffect(() => {
    if (!modelPath || !modelPath.trim()) {
      setLoadedScene(null);
      setLoadError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        if (!isMounted) return;
        morphTargetMeshes.current = [];
        gltfHeadBone.current = null;

        // Traverse and find morph targets and bones
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
              morphTargetMeshes.current.push(mesh);
            }
          }
          if (child.name.toLowerCase().includes('head')) {
            gltfHeadBone.current = child;
          }
        });

        setLoadedScene(gltf.scene);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.warn('[AvatarModel] Failed to load external GLTF/GLB model, using procedural digital human rig:', err);
        setLoadError('Failed to load custom GLTF/GLB. Displaying procedural rig.');
        setLoadedScene(null);
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [modelPath]);

  // Per-frame transform update on Three.js objects
  useEffect(() => {
    // 1. External GLTF model update
    if (loadedScene) {
      // Apply Head rotation to bone if found
      if (gltfHeadBone.current) {
        gltfHeadBone.current.rotation.x = animationState.headRotation.x;
        gltfHeadBone.current.rotation.y = animationState.headRotation.y;
        gltfHeadBone.current.rotation.z = animationState.headRotation.z;
      } else if (groupRef.current) {
        groupRef.current.rotation.x = animationState.headRotation.x * 0.7;
        groupRef.current.rotation.y = animationState.headRotation.y * 0.7;
        groupRef.current.rotation.z = animationState.headRotation.z * 0.7;
      }

      // Apply morph targets to meshes
      for (const mesh of morphTargetMeshes.current) {
        const dict = mesh.morphTargetDictionary;
        const inf = mesh.morphTargetInfluences;
        if (!dict || !inf) continue;

        // Standard ARKit morph names
        const applyMorph = (key: string, val: number) => {
          if (dict[key] !== undefined) inf[dict[key]] = val;
        };

        applyMorph('eyeBlinkLeft', morphTargets.eyeBlinkLeft);
        applyMorph('eyeBlinkRight', morphTargets.eyeBlinkRight);
        applyMorph('jawOpen', morphTargets.jawOpen);
        applyMorph('mouthOpen', morphTargets.mouthOpen);
        applyMorph('mouthSmileLeft', morphTargets.mouthSmileLeft);
        applyMorph('mouthSmileRight', morphTargets.mouthSmileRight);
        applyMorph('browInnerUp', morphTargets.browInnerUp);
      }
      return;
    }

    // 2. Procedural Digital Human Rig updates
    if (headBoneRef.current) {
      headBoneRef.current.rotation.x = animationState.headRotation.x;
      headBoneRef.current.rotation.y = animationState.headRotation.y;
      headBoneRef.current.rotation.z = animationState.headRotation.z;
      headBoneRef.current.position.y = animationState.headPosition.y;
    }

    // Eyes tracking
    if (leftEyeRef.current && rightEyeRef.current) {
      const gazeX = animationState.eyeGaze.x;
      const gazeY = animationState.eyeGaze.y;
      leftEyeRef.current.rotation.y = gazeX;
      leftEyeRef.current.rotation.x = -gazeY;
      rightEyeRef.current.rotation.y = gazeX;
      rightEyeRef.current.rotation.x = -gazeY;
    }

    // Eyelids blinking
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const blinkScaleY = Math.max(0.05, 1.0 - morphTargets.eyeBlinkLeft * 0.95);
      leftEyelidRef.current.scale.y = blinkScaleY;
      rightEyelidRef.current.scale.y = blinkScaleY;
    }

    // Mouth / Jaw movement
    if (jawRef.current) {
      jawRef.current.position.y = -0.58 - morphTargets.jawOpen * 0.12;
      jawRef.current.scale.y = 1.0 + morphTargets.jawOpen * 0.3;
    }
    if (mouthRef.current) {
      // Scale mouth mesh to reflect lip sync opening and smiling
      mouthRef.current.scale.y = 0.2 + morphTargets.jawOpen * 0.8;
      mouthRef.current.scale.x = 1.0 + (morphTargets.mouthSmileLeft + morphTargets.mouthSmileRight) * 0.2;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -0.3, 0]}>
      {loadedScene ? (
        <primitive object={loadedScene} />
      ) : (
        /* Procedural Humanoid Digital Assistant Rig */
        <group>
          {/* Torso & Shoulders Base */}
          <group position={[0, -1.2, 0]}>
            {/* Upper Chest */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.45, 0.75, 24]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.4}
                metalness={0.7}
              />
            </mesh>
            {/* Shoulder curves */}
            <mesh position={[-0.65, 0.25, 0]}>
              <sphereGeometry args={[0.26, 18, 18]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0.65, 0.25, 0]}>
              <sphereGeometry args={[0.26, 18, 18]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Collar Accent */}
            <mesh position={[0, 0.36, 0.05]} rotation={[-0.2, 0, 0]}>
              <torusGeometry args={[0.28, 0.03, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
            </mesh>
          </group>

          {/* Neck */}
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.35, 24]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.6}
              metalness={0.4}
            />
          </mesh>

          {/* Articulated Head Group */}
          <group ref={headBoneRef} position={[0, 0, 0]}>
            {/* Cranium / Head Form */}
            <mesh castShadow position={[0, 0, 0]}>
              <sphereGeometry args={[0.68, 32, 32]} />
              <meshStandardMaterial
                color="#1e293b"
                roughness={0.35}
                metalness={0.5}
              />
            </mesh>

            {/* Face Plate (Smooth synthetic human profile) */}
            <mesh position={[0, -0.05, 0.25]} scale={[0.82, 1.05, 0.72]}>
              <sphereGeometry args={[0.56, 32, 32]} />
              <meshStandardMaterial
                color="#334155"
                roughness={0.25}
                metalness={0.3}
              />
            </mesh>

            {/* Forehead Brow Shield */}
            <mesh position={[0, 0.24, 0.52]} rotation={[-0.1, 0, 0]}>
              <boxGeometry args={[0.68, 0.06, 0.08]} />
              <meshStandardMaterial
                color="#0284c7"
                emissive="#0284c7"
                emissiveIntensity={0.4}
              />
            </mesh>

            {/* Left Eye Socket & Eye */}
            <group position={[-0.22, 0.08, 0.5]}>
              {/* Eye Orbit Ring */}
              <mesh>
                <ringGeometry args={[0.07, 0.11, 24]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>
              {/* Eyeball */}
              <mesh ref={leftEyeRef}>
                <sphereGeometry args={[0.08, 20, 20]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={0.8}
                  roughness={0.1}
                />
              </mesh>
              {/* Eyelid (covers eye when blinking) */}
              <mesh ref={leftEyelidRef} position={[0, 0.02, 0.05]}>
                <boxGeometry args={[0.18, 0.14, 0.04]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
            </group>

            {/* Right Eye Socket & Eye */}
            <group position={[0.22, 0.08, 0.5]}>
              {/* Eye Orbit Ring */}
              <mesh>
                <ringGeometry args={[0.07, 0.11, 24]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>
              {/* Eyeball */}
              <mesh ref={rightEyeRef}>
                <sphereGeometry args={[0.08, 20, 20]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={0.8}
                  roughness={0.1}
                />
              </mesh>
              {/* Eyelid (covers eye when blinking) */}
              <mesh ref={rightEyelidRef} position={[0, 0.02, 0.05]}>
                <boxGeometry args={[0.18, 0.14, 0.04]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} />
              </mesh>
            </group>

            {/* Nose Bridge */}
            <mesh position={[0, -0.06, 0.58]} rotation={[0.2, 0, 0]}>
              <coneGeometry args={[0.05, 0.22, 4]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.3} />
            </mesh>

            {/* Articulated Mouth & Jaw */}
            <group position={[0, -0.32, 0.52]}>
              {/* Mouth Opening (Dark Cavity) */}
              <mesh ref={mouthRef} scale={[1, 0.2, 1]}>
                <capsuleGeometry args={[0.04, 0.18, 4, 12]} />
                <meshBasicMaterial color="#020617" />
              </mesh>
              {/* Subtle Glowing Lip Accent */}
              <mesh position={[0, -0.05, 0.02]}>
                <torusGeometry args={[0.12, 0.015, 8, 24, Math.PI]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={morphTargets.jawOpen > 0.1 ? 0.9 : 0.3}
                />
              </mesh>
            </group>

            {/* Chin / Jaw Plate */}
            <mesh ref={jawRef} position={[0, -0.58, 0.38]}>
              <boxGeometry args={[0.32, 0.14, 0.26]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
            </mesh>

            {/* Halo / Status Crown Accent */}
            <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.55, 0.012, 16, 48]} />
              <meshStandardMaterial
                color="#0ea5e9"
                emissive="#0ea5e9"
                emissiveIntensity={animationState.currentState === 'SPEAKING' ? 1.0 : 0.4}
              />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};
