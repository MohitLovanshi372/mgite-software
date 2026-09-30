/**
 * Realistic Humanoid Transformer JARVIS Robot Model & Presentation Layer
 *
 * Implements a high-end cinematic humanoid AI robot:
 * - Realistic human-like proportions
 * - Premium black / graphite metallic body (aerospace titanium PBR)
 * - Precision mechanical face with human-inspired robotic proportions
 * - Normal-sized mechanical optical units with cyan glow
 * - Mechanical eyelid shutters for blinking & emotional expressions
 * - Subtle mechanical acoustic vocoder mouth
 * - Futuristic chest core (Arc Reactor / Energy Matrix) on upper torso
 * - Detailed mechanical joints with dark obsidian finish
 * - Clean industrial design: strictly NO cartoon, NO anime, NO oversized eyes or mouth
 * - Support for all 8 states: IDLE, LISTENING, THINKING, SPEAKING, HAPPY, SERIOUS, CONFUSED, ERROR
 */

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AIStateMode } from '../types/index.ts';
import { AvatarEmotion } from './types.ts';
import { EMOTION_PROFILES } from './EmotionController.ts';

export type RobotState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'HAPPY'
  | 'SERIOUS'
  | 'CONFUSED'
  | 'ERROR';

export class RealisticHumanoidRobot {
  public group: THREE.Group;

  // GLB Model & Skeleton
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;

  // Skeletal Bones
  private headBone: THREE.Bone | null = null;
  private neckBone: THREE.Bone | null = null;
  private spineBone: THREE.Bone | null = null;

  // Futuristic Chest Core Components
  private chestCoreGroup: THREE.Group | null = null;
  private chestCoreInnerMesh: THREE.Mesh | null = null;
  private chestCoreLight: THREE.PointLight | null = null;
  private chestCoreRings: THREE.Mesh[] = [];

  // Mechanical Face Components
  private faceGroup: THREE.Group | null = null;
  private leftEyeMesh: THREE.Mesh | null = null;
  private rightEyeMesh: THREE.Mesh | null = null;
  private leftEyeGlow: THREE.Mesh | null = null;
  private rightEyeGlow: THREE.Mesh | null = null;
  private leftUpperLid: THREE.Mesh | null = null;
  private rightUpperLid: THREE.Mesh | null = null;
  private leftLowerLid: THREE.Mesh | null = null;
  private rightLowerLid: THREE.Mesh | null = null;
  private vocoderMesh: THREE.Mesh | null = null;
  private vocoderGlow: THREE.Mesh | null = null;

  // Eye Lighting
  private leftEyeLight: THREE.PointLight | null = null;
  private rightEyeLight: THREE.PointLight | null = null;

  // Kinematics & Expressions
  private isBlinking = false;
  private blinkStartTime = 0;
  private nextBlinkTime = 0;
  private currentBlink = 0;
  private targetGazeX = 0;
  private targetGazeY = 0;
  private currentGazeX = 0;
  private currentGazeY = 0;
  private scanningTimer = 0;
  private currentErrorPulse = 0;

  // Material References for Live Emission Modulation
  private cyanEmissiveMaterials: THREE.MeshStandardMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'RealisticHumanoidRobot_Root';
    this.nextBlinkTime = Date.now() + 3000;
  }

  /**
   * Load and initialize the humanoid robot model.
   */
  public async load(url: string = '/models/cyber_android.glb'): Promise<void> {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf: GLTF) => {
          this.initModel(gltf);
          resolve();
        },
        undefined,
        (err) => {
          // If primary path fails, try fallback
          if (url !== '/models/jarvis-human.glb') {
            loader.load(
              '/models/jarvis-human.glb',
              (gltfFallback: GLTF) => {
                this.initModel(gltfFallback);
                resolve();
              },
              undefined,
              (fallbackErr) => reject(fallbackErr)
            );
          } else {
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Initialize Model with Black/Graphite Metallic PBR Shaders,
   * Chest Arc Reactor, and Mechanical Optical Face Rig.
   */
  private initModel(gltf: GLTF): void {
    const model = gltf.scene;
    this.model = model;

    // 1. Proportions & Centering: Show head, shoulders, and upper torso cleanly
    model.position.set(0, 0, 0);
    model.scale.set(1.22, 1.22, 1.22);

    // 2. Discover Bones
    model.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        const name = bone.name.toLowerCase();
        if (name.includes('head') && !name.includes('top') && !this.headBone) {
          this.headBone = bone;
        } else if (name.includes('neck') && !this.neckBone) {
          this.neckBone = bone;
        } else if ((name.includes('spine2') || name.includes('spine1') || name.includes('chest')) && !this.spineBone) {
          this.spineBone = bone;
        }
      }
    });

    // 3. Apply Premium Black / Graphite Metallic PBR Materials
    // Body Armor Material: Deep brushed graphite / titanium alloy
    const graphiteBodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x131720), // Deep graphite titanium
      roughness: 0.28,                 // Sleek satin metallic reflection
      metalness: 0.94,                 // Real metal response
      envMapIntensity: 1.5,
    });

    // Mechanical Joints Material: Dark matte obsidian carbon alloy
    const obsidianJointsMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0a0c10), // Matte obsidian
      roughness: 0.45,
      metalness: 0.88,
    });

    // Subtle Cyan Conduit Material
    const cyanConduitMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x061524),
      emissive: new THREE.Color(0x00d8f6),
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    this.cyanEmissiveMaterials.push(cyanConduitMaterial);

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const isJointMesh =
            mesh.name.toLowerCase().includes('joint') ||
            (Array.isArray(mesh.material)
              ? mesh.material.some((m) => m.name.toLowerCase().includes('joint'))
              : (mesh.material as any).name?.toLowerCase().includes('joint'));

          if (isJointMesh) {
            mesh.material = obsidianJointsMaterial;
          } else {
            mesh.material = graphiteBodyMaterial;
          }
        }
      }
    });

    // 4. Attach Futuristic Chest Core (Arc Reactor / Energy Matrix)
    this.createFuturisticChestCore();

    // 5. Attach Precision Mechanical Face Rig to Head
    this.createMechanicalFaceRig();

    this.group.add(model);

    // 6. Setup Animation Mixer
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      this.mixer = mixer;

      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        this.actions.set(clip.name, action);
      });

      // Default to subtle idle animation
      const idleAction = this.actions.get('idle') || this.actions.values().next().value;
      if (idleAction) {
        idleAction.play();
        this.currentAction = idleAction;
      }
    }
  }

  /**
   * Creates the Futuristic Chest Core (Arc Reactor)
   * Mounted securely to upper torso sternum.
   */
  private createFuturisticChestCore(): void {
    const coreGroup = new THREE.Group();
    coreGroup.name = 'Chest_Arc_Reactor_Core';

    // Positioned at human sternum height (~1.18m relative to avatar scale)
    coreGroup.position.set(0, 1.20, 0.17);

    // 1. Titanium Beveled Outer Containment Ring
    const outerBezelGeo = new THREE.CylinderGeometry(0.092, 0.098, 0.024, 32);
    const outerBezelMat = new THREE.MeshStandardMaterial({
      color: 0x161a22,
      metalness: 0.95,
      roughness: 0.25,
    });
    const outerBezel = new THREE.Mesh(outerBezelGeo, outerBezelMat);
    outerBezel.rotation.x = Math.PI / 2;
    coreGroup.add(outerBezel);

    // 2. Segmented Cyan Energy Aperture Ring
    const apertureRingGeo = new THREE.RingGeometry(0.055, 0.082, 32);
    const apertureRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: new THREE.Color(0x00d8f6),
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.9,
      side: THREE.DoubleSide,
    });
    this.cyanEmissiveMaterials.push(apertureRingMat);
    const apertureRing = new THREE.Mesh(apertureRingGeo, apertureRingMat);
    apertureRing.position.z = 0.014;
    coreGroup.add(apertureRing);
    this.chestCoreRings.push(apertureRing);

    // 3. Central Pulsating Plasma Lens
    const innerCoreGeo = new THREE.SphereGeometry(0.038, 24, 24);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x00f5ff),
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.2,
    });
    this.cyanEmissiveMaterials.push(innerCoreMat);
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCore.scale.set(1.0, 1.0, 0.45);
    innerCore.position.z = 0.012;
    coreGroup.add(innerCore);
    this.chestCoreInnerMesh = innerCore;

    // 4. Subtle Photon Emission Point Light
    const coreLight = new THREE.PointLight(0x00e5ff, 2.2, 1.8, 1.6);
    coreLight.position.set(0, 0, 0.06);
    coreGroup.add(coreLight);
    this.chestCoreLight = coreLight;

    this.chestCoreGroup = coreGroup;

    // Attach to spine bone if available for organic breathing sway, otherwise group
    if (this.spineBone) {
      // Offset relative to spine2 bone
      coreGroup.position.set(0, 0.15, 0.14);
      this.spineBone.add(coreGroup);
    } else {
      this.group.add(coreGroup);
    }
  }

  /**
   * Creates the Precision Mechanical Face Rig
   * High-end cinematic android face with human-inspired proportions:
   * - Normal-sized mechanical optical units (eyes)
   * - Articulating mechanical graphite eyelids
   * - Subtle acoustic vocoder mouth
   * - No cartoon, anime, or toy appearance
   */
  private createMechanicalFaceRig(): void {
    const faceGroup = new THREE.Group();
    faceGroup.name = 'Precision_Mechanical_Face_Rig';

    // Anthropometrically accurate human proportions:
    // Eye height ~1.54m, Inter-pupillary spacing: ~0.062m (0.031m from midline)
    const eyeSpacing = 0.032;
    const eyeZ = 0.138;
    const eyeY = 1.542;

    // 1. Optical Units Housing Material (Dark brushed titanium)
    const ocularHousingMat = new THREE.MeshStandardMaterial({
      color: 0x10131a,
      metalness: 0.95,
      roughness: 0.25,
    });

    // 2. Optical Cyan Core Lens Material (Normal-sized, not oversized)
    const cyanLensMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x00f0ff),
      emissiveIntensity: 2.4,
      roughness: 0.12,
      metalness: 0.3,
    });
    this.cyanEmissiveMaterials.push(cyanLensMaterial);

    // Eyelid Shutter Material (Precision mechanical graphite plates)
    const shutterMaterial = new THREE.MeshStandardMaterial({
      color: 0x161a24,
      metalness: 0.92,
      roughness: 0.3,
    });

    // === LEFT EYE OPTICAL UNIT ===
    const leftEyeContainer = new THREE.Group();
    leftEyeContainer.position.set(-eyeSpacing, eyeY, eyeZ);

    // Sockets (outer titanium ring, radius 0.016m = 32mm eye unit)
    const socketGeo = new THREE.CylinderGeometry(0.017, 0.019, 0.012, 24);
    const leftSocket = new THREE.Mesh(socketGeo, ocularHousingMat);
    leftSocket.rotation.x = Math.PI / 2;
    leftEyeContainer.add(leftSocket);

    // Lens
    const lensGeo = new THREE.SphereGeometry(0.012, 24, 24);
    const leftLens = new THREE.Mesh(lensGeo, cyanLensMaterial);
    leftLens.scale.set(1.0, 1.0, 0.35);
    leftLens.position.z = 0.005;
    leftEyeContainer.add(leftLens);
    this.leftEyeMesh = leftLens;

    // Mechanical Eyelid Shutters (Linear micro-aperture)
    const upperLidGeo = new THREE.BoxGeometry(0.026, 0.012, 0.006);
    const leftUpperLid = new THREE.Mesh(upperLidGeo, shutterMaterial);
    leftUpperLid.position.set(0, 0.011, 0.009);
    leftEyeContainer.add(leftUpperLid);
    this.leftUpperLid = leftUpperLid;

    const lowerLidGeo = new THREE.BoxGeometry(0.026, 0.009, 0.006);
    const leftLowerLid = new THREE.Mesh(lowerLidGeo, shutterMaterial);
    leftLowerLid.position.set(0, -0.010, 0.009);
    leftEyeContainer.add(leftLowerLid);
    this.leftLowerLid = leftLowerLid;

    // Soft Optical Point Light
    const leftEyeLight = new THREE.PointLight(0x00f0ff, 0.6, 0.5);
    leftEyeLight.position.set(0, 0, 0.02);
    leftEyeContainer.add(leftEyeLight);
    this.leftEyeLight = leftEyeLight;

    faceGroup.add(leftEyeContainer);

    // === RIGHT EYE OPTICAL UNIT ===
    const rightEyeContainer = new THREE.Group();
    rightEyeContainer.position.set(eyeSpacing, eyeY, eyeZ);

    const rightSocket = new THREE.Mesh(socketGeo, ocularHousingMat);
    rightSocket.rotation.x = Math.PI / 2;
    rightEyeContainer.add(rightSocket);

    const rightLens = new THREE.Mesh(lensGeo, cyanLensMaterial);
    rightLens.scale.set(1.0, 1.0, 0.35);
    rightLens.position.z = 0.005;
    rightEyeContainer.add(rightLens);
    this.rightEyeMesh = rightLens;

    const rightUpperLid = new THREE.Mesh(upperLidGeo, shutterMaterial);
    rightUpperLid.position.set(0, 0.011, 0.009);
    rightEyeContainer.add(rightUpperLid);
    this.rightUpperLid = rightUpperLid;

    const rightLowerLid = new THREE.Mesh(lowerLidGeo, shutterMaterial);
    rightLowerLid.position.set(0, -0.010, 0.009);
    rightEyeContainer.add(rightLowerLid);
    this.rightLowerLid = rightLowerLid;

    const rightEyeLight = new THREE.PointLight(0x00f0ff, 0.6, 0.5);
    rightEyeLight.position.set(0, 0, 0.02);
    rightEyeContainer.add(rightEyeLight);
    this.rightEyeLight = rightEyeLight;

    faceGroup.add(rightEyeContainer);

    // 3. Subtle Mechanical Acoustic Vocoder (Mouth Area)
    // Clean industrial slit: width 38mm, height 4mm, recessed
    const vocoderGroup = new THREE.Group();
    vocoderGroup.position.set(0, 1.455, 0.128);

    const vocoderBezelGeo = new THREE.BoxGeometry(0.046, 0.012, 0.008);
    const vocoderBezel = new THREE.Mesh(vocoderBezelGeo, ocularHousingMat);
    vocoderGroup.add(vocoderBezel);

    // Acoustic grille slit
    const vocoderSlitGeo = new THREE.BoxGeometry(0.038, 0.004, 0.005);
    const vocoderSlitMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.7,
      metalness: 0.9,
    });
    const vocoderSlit = new THREE.Mesh(vocoderSlitGeo, vocoderSlitMat);
    vocoderSlit.position.z = 0.003;
    vocoderGroup.add(vocoderSlit);
    this.vocoderMesh = vocoderSlit;

    // Interior Speech Glow
    const vocoderGlowGeo = new THREE.PlaneGeometry(0.034, 0.003);
    const vocoderGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00d8f6,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const vocoderGlow = new THREE.Mesh(vocoderGlowGeo, vocoderGlowMat);
    vocoderGlow.position.z = 0.005;
    vocoderGroup.add(vocoderGlow);
    this.vocoderGlow = vocoderGlow;

    faceGroup.add(vocoderGroup);

    // 4. Subtle Brow Ridge & Forehead Sensor Seam
    const browGeo = new THREE.BoxGeometry(0.088, 0.005, 0.012);
    const browMesh = new THREE.Mesh(browGeo, shutterMaterial);
    browMesh.position.set(0, 1.572, 0.134);
    faceGroup.add(browMesh);

    this.faceGroup = faceGroup;

    // Attach to head bone if available
    if (this.headBone) {
      // Position relative to head bone
      faceGroup.position.set(0, -1.48, 0);
      this.headBone.add(faceGroup);
    } else {
      this.group.add(faceGroup);
    }
  }

  /**
   * Main Kinematic & Procedural Animation Update Loop.
   * Modulates head posture, optical energy, mechanical shutter eyelids,
   * vocoder acoustics, and chest core breathing.
   */
  public update(
    delta: number,
    isSpeaking: boolean,
    avatarState: AIStateMode | RobotState,
    emote: AvatarEmotion = 'neutral'
  ): void {
    // 1. Advance Skeletal Mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    const now = Date.now();
    const emotionProfile = EMOTION_PROFILES[emote] || EMOTION_PROFILES.neutral;

    // 2. Handle Mechanical Blinking Cycle
    if (now > this.nextBlinkTime && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkStartTime = now;
      this.nextBlinkTime = now + 2800 + Math.random() * 3200;
    }

    if (this.isBlinking) {
      const elapsed = now - this.blinkStartTime;
      const blinkDuration = 140; // Quick mechanical shutter
      if (elapsed < blinkDuration) {
        // Shutter curve (0 -> 1 -> 0)
        this.currentBlink = Math.sin((elapsed / blinkDuration) * Math.PI);
      } else {
        this.isBlinking = false;
        this.currentBlink = 0;
      }
    }

    // 3. Eyelid Shutter Mechanical Articulation
    // Base positions: upper +0.011, lower -0.010
    let targetUpperClose = this.currentBlink * 0.009;
    let targetLowerClose = this.currentBlink * 0.006;

    // Modulate based on state & emotion
    if (avatarState === 'SERIOUS' || emote === 'serious') {
      targetUpperClose += 0.004; // Focused narrow slit
      targetLowerClose += 0.003;
    } else if (avatarState === 'LISTENING' || emote === 'surprised') {
      targetUpperClose -= 0.003; // Eyes wide open in attention
      targetLowerClose -= 0.002;
    } else if (avatarState === 'THINKING' || emote === 'thinking') {
      targetUpperClose += 0.002;
    } else if (avatarState === 'CONFUSED' || emote === 'confused') {
      // Asymmetry on left vs right eyelid for quizzical look
      if (this.leftUpperLid) this.leftUpperLid.position.y = 0.011 - 0.005;
      if (this.rightUpperLid) this.rightUpperLid.position.y = 0.011 - 0.001;
    }

    if (this.leftUpperLid && avatarState !== 'CONFUSED') {
      this.leftUpperLid.position.y = 0.011 - targetUpperClose;
    }
    if (this.rightUpperLid && avatarState !== 'CONFUSED') {
      this.rightUpperLid.position.y = 0.011 - targetUpperClose;
    }
    if (this.leftLowerLid) {
      this.leftLowerLid.position.y = -0.010 + targetLowerClose;
    }
    if (this.rightLowerLid) {
      this.rightLowerLid.position.y = -0.010 + targetLowerClose;
    }

    // 4. Optical Eye Glow & Telemetry Intensity
    let baseGlow = 2.4;
    let eyeColor = new THREE.Color(0x00f0ff);

    if (avatarState === 'LISTENING') {
      baseGlow = 3.6; // High-focus optical flare
    } else if (avatarState === 'THINKING') {
      // Oscillating computing pulse (1.4Hz)
      this.scanningTimer += delta * 6;
      baseGlow = 1.8 + Math.sin(this.scanningTimer) * 1.4;
    } else if (avatarState === 'SPEAKING' || isSpeaking) {
      // Vocal audio pulse
      baseGlow = 2.8 + Math.sin(now * 0.015) * 1.0;
    } else if (avatarState === 'ERROR' || avatarState === 'SECURITY_ALERT') {
      // Warning alert flash
      this.currentErrorPulse = (this.currentErrorPulse + delta * 8) % (Math.PI * 2);
      const isRedAlert = Math.sin(this.currentErrorPulse) > 0;
      eyeColor = isRedAlert ? new THREE.Color(0xff3333) : new THREE.Color(0x00e5ff);
      baseGlow = 3.8;
    } else if (avatarState === 'HAPPY' || emote === 'happy') {
      baseGlow = 3.0;
    }

    if (this.leftEyeMesh) {
      const mat = this.leftEyeMesh.material as THREE.MeshStandardMaterial;
      mat.emissive = eyeColor;
      mat.emissiveIntensity = baseGlow;
    }
    if (this.rightEyeMesh) {
      const mat = this.rightEyeMesh.material as THREE.MeshStandardMaterial;
      mat.emissive = eyeColor;
      mat.emissiveIntensity = baseGlow;
    }
    if (this.leftEyeLight) {
      this.leftEyeLight.color = eyeColor;
      this.leftEyeLight.intensity = baseGlow * 0.25;
    }
    if (this.rightEyeLight) {
      this.rightEyeLight.color = eyeColor;
      this.rightEyeLight.intensity = baseGlow * 0.25;
    }

    // 5. Vocoder Mouth Illumination when Speaking
    if (this.vocoderGlow) {
      const targetOpacity = isSpeaking ? 0.65 + Math.sin(now * 0.02) * 0.3 : 0.15;
      (this.vocoderGlow.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
    }

    // 6. Chest Core Arc Reactor Breathing Pulse
    if (this.chestCoreInnerMesh) {
      const corePulse = 2.4 + Math.sin(now * 0.0025) * 0.8;
      const mat = this.chestCoreInnerMesh.material as THREE.MeshStandardMaterial;
      if (avatarState === 'ERROR' || avatarState === 'SECURITY_ALERT') {
        mat.emissive = new THREE.Color(0xff3322);
        mat.emissiveIntensity = 3.5;
        if (this.chestCoreLight) {
          this.chestCoreLight.color = new THREE.Color(0xff3322);
          this.chestCoreLight.intensity = 3.0;
        }
      } else {
        mat.emissive = new THREE.Color(0x00f5ff);
        mat.emissiveIntensity = corePulse;
        if (this.chestCoreLight) {
          this.chestCoreLight.color = new THREE.Color(0x00e5ff);
          this.chestCoreLight.intensity = corePulse * 0.8;
        }
      }
    }

    // Rotate subtle aperture rings inside reactor
    this.chestCoreRings.forEach((ring, idx) => {
      ring.rotation.z += delta * (idx % 2 === 0 ? 0.35 : -0.35);
    });

    // 7. Subtle Mechanical Head Posture & Gaze Kinematics
    if (this.model) {
      // Smooth gaze tracking
      this.currentGazeX += (this.targetGazeX - this.currentGazeX) * 0.08;
      this.currentGazeY += (this.targetGazeY - this.currentGazeY) * 0.08;

      let targetPitch = emotionProfile.headPitchX;
      let targetYaw = emotionProfile.headYawY + this.currentGazeX * 0.15;
      let targetRoll = emotionProfile.headTiltZ;

      // State-specific kinematics:
      if (avatarState === 'LISTENING') {
        targetPitch -= 0.03; // Slight attentive chin lift
        targetYaw += 0.04;   // Slight listening angle
      } else if (avatarState === 'THINKING') {
        targetPitch += 0.07; // Pitch chin down in thought
        targetRoll += 0.08;  // Tilt head
        targetYaw -= 0.05;
      } else if (avatarState === 'CONFUSED' || emote === 'confused') {
        targetRoll -= 0.12;  // Inquisitive robotic head cock
        targetYaw += 0.08;
      } else if (avatarState === 'SPEAKING' || isSpeaking) {
        // Natural micro-cadence
        targetPitch += Math.sin(now * 0.007) * 0.025;
      }

      // Apply to model with smooth lerping
      this.model.rotation.x += (targetPitch - this.model.rotation.x) * 0.07;
      this.model.rotation.y += (targetYaw - this.model.rotation.y) * 0.07;
      this.model.rotation.z += (targetRoll - this.model.rotation.z) * 0.07;
    }
  }

  /**
   * Cross-fade to a new animation clip (e.g. idle, agree, headShake).
   */
  public playAnimation(name: string, duration = 0.4): void {
    const action = this.actions.get(name);
    if (!action) return;

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(duration);
    }

    action.reset();
    action.fadeIn(duration);
    action.play();
    this.currentAction = action;
  }

  /**
   * Set Normalized Cursor Gaze Target (-1 to 1).
   */
  public setGazeTarget(x: number, y: number): void {
    this.targetGazeX = Math.max(-1, Math.min(1, x));
    this.targetGazeY = Math.max(-1, Math.min(1, y));
  }

  /**
   * Cleanup Three.js geometries and materials upon unmount.
   */
  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.actions.clear();

    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }
}
