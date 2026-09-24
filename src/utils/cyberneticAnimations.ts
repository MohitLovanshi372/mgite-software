/**
 * Cybernetic Humanoid & Bipedal Armature Animation Synthesis Engine
 * Generates rich, production-grade THREE.AnimationClip objects for rigged models
 * with standard Mixamo / humanoid bone armatures.
 */

import * as THREE from 'three';
import { AnimationTrackData } from '../types/glbModels.ts';

const DEG2RAD = Math.PI / 180;

/**
 * Creates a THREE.Quaternion from Euler angles in degrees (XYZ order)
 */
function qDeg(xDeg: number, yDeg: number, zDeg: number): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(xDeg * DEG2RAD, yDeg * DEG2RAD, zDeg * DEG2RAD, 'XYZ')
  );
}

/**
 * Flattens array of Quaternions into flat number array
 */
function quatArray(quats: THREE.Quaternion[]): number[] {
  const arr: number[] = [];
  for (const q of quats) {
    arr.push(q.x, q.y, q.z, q.w);
  }
  return arr;
}

/**
 * Flattens array of Vector3 into flat number array
 */
function vecArray(vecs: THREE.Vector3[]): number[] {
  const arr: number[] = [];
  for (const v of vecs) {
    arr.push(v.x, v.y, v.z);
  }
  return arr;
}

/**
 * Generates an expanded suite of 11 handcrafted cybernetic humanoid animations
 * for models rigged with standard humanoid bones ('mixamorig:*').
 */
export function generateBipedalCyberAnimations(root: THREE.Object3D): THREE.AnimationClip[] {
  // Verify humanoid bone presence and detect naming convention (with or without colon)
  let hasHumanoidBones = false;
  let useColon = true;

  root.traverse((child) => {
    if (child.name) {
      if (child.name.includes('mixamorig:')) {
        hasHumanoidBones = true;
        useColon = true;
      } else if (child.name.includes('mixamorig')) {
        hasHumanoidBones = true;
        useColon = false;
      }
    }
  });

  if (!hasHumanoidBones) {
    return [];
  }

  const clips: THREE.AnimationClip[] = [];

  // =========================================================================
  // 1. COMBAT_GUARD (Category: STANCE, Duration: 2.0s)
  // Martial arts defensive guard: bobbing stance, raised fists, flexed knees
  // =========================================================================
  {
    const times = [0.0, 0.5, 1.0, 1.5, 2.0];
    const tracks: THREE.KeyframeTrack[] = [
      // Hips bobbing and slight angle
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, -0.04, 0),
        new THREE.Vector3(0, -0.07, 0.02),
        new THREE.Vector3(0, -0.04, 0),
        new THREE.Vector3(0, -0.07, 0.02),
        new THREE.Vector3(0, -0.04, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(8, -15, 0),
        qDeg(10, -12, 2),
        qDeg(8, -15, 0),
        qDeg(10, -18, -2),
        qDeg(8, -15, 0),
      ])),
      // Torso coiled forward
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(12, -8, 2),
        qDeg(14, -6, 0),
        qDeg(12, -8, 2),
        qDeg(14, -10, 4),
        qDeg(12, -8, 2),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine1.quaternion', times, quatArray([
        qDeg(8, -5, 0),
        qDeg(10, -4, 0),
        qDeg(8, -5, 0),
        qDeg(10, -6, 0),
        qDeg(8, -5, 0),
      ])),
      // Left Guard Arm (Forward Shield)
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 25, -20),
        qDeg(-48, 28, -22),
        qDeg(-45, 25, -20),
        qDeg(-42, 22, -18),
        qDeg(-45, 25, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, -25),
        qDeg(-98, 0, -28),
        qDeg(-95, 0, -25),
        qDeg(-92, 0, -22),
        qDeg(-95, 0, -25),
      ])),
      // Right Guard Arm (Cocked Power Fist)
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -30, 25),
        qDeg(-38, -32, 27),
        qDeg(-35, -30, 25),
        qDeg(-32, -28, 23),
        qDeg(-35, -30, 25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 20),
        qDeg(-93, 0, 22),
        qDeg(-90, 0, 20),
        qDeg(-87, 0, 18),
        qDeg(-90, 0, 20),
      ])),
      // Head looking forward sharply
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-6, 12, -2),
        qDeg(-8, 10, -1),
        qDeg(-6, 12, -2),
        qDeg(-8, 14, -3),
        qDeg(-6, 12, -2),
      ])),
      // Left Leg (Forward Stance)
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftUpLeg.quaternion', times, quatArray([
        qDeg(18, -10, -8),
        qDeg(22, -10, -8),
        qDeg(18, -10, -8),
        qDeg(22, -10, -8),
        qDeg(18, -10, -8),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftLeg.quaternion', times, quatArray([
        qDeg(-25, 0, 0),
        qDeg(-32, 0, 0),
        qDeg(-25, 0, 0),
        qDeg(-32, 0, 0),
        qDeg(-25, 0, 0),
      ])),
      // Right Leg (Rear Brace)
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(-15, 15, 12),
        qDeg(-18, 15, 12),
        qDeg(-15, 15, 12),
        qDeg(-18, 15, 12),
        qDeg(-15, 15, 12),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightLeg.quaternion', times, quatArray([
        qDeg(-18, 0, 0),
        qDeg(-24, 0, 0),
        qDeg(-18, 0, 0),
        qDeg(-24, 0, 0),
        qDeg(-18, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('COMBAT_GUARD', 2.0, tracks));
  }

  // =========================================================================
  // 2. KINETIC_KICK (Category: ACTION, Duration: 2.2s)
  // Dynamic cybernetic martial arts high roundhouse kick with counter-balance
  // =========================================================================
  {
    const times = [0.0, 0.4, 0.8, 1.1, 1.5, 1.8, 2.2];
    const tracks: THREE.KeyframeTrack[] = [
      // Hips pivot, lift, and drop
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.05, -0.05),
        new THREE.Vector3(0, 0.08, 0.05),
        new THREE.Vector3(0, 0.12, 0.08),
        new THREE.Vector3(0, 0.04, 0.02),
        new THREE.Vector3(0, -0.03, 0),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(5, -25, 0),
        qDeg(-10, -60, 20),
        qDeg(-15, -75, 30),
        qDeg(-5, -50, 15),
        qDeg(0, -20, 5),
        qDeg(0, 0, 0),
      ])),
      // Torso leans back to counter-balance kick
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(10, 15, -5),
        qDeg(-20, 25, -25),
        qDeg(-28, 30, -35),
        qDeg(-15, 20, -18),
        qDeg(5, 5, -5),
        qDeg(0, 0, 0),
      ])),
      // Right UpLeg (Kicking Leg)
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(45, 10, 10),
        qDeg(90, 35, 25), // Chamber
        qDeg(105, 45, 35), // Full extension
        qDeg(85, 30, 20), // Retraction
        qDeg(30, 10, 5),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(-115, 0, 0), // Chambered knee
        qDeg(-5, 0, 0),   // Explosive snap!
        qDeg(-85, 0, 0),  // Snap back
        qDeg(-20, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left Arm (Counter-balance guard)
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-35, 10, -20),
        qDeg(-65, 35, -45),
        qDeg(-75, 40, -55),
        qDeg(-50, 25, -35),
        qDeg(-20, 10, -10),
        qDeg(0, 0, 0),
      ])),
      // Right Arm (Tucked power fist)
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, -20, 20),
        qDeg(-45, -35, 35),
        qDeg(-55, -40, 45),
        qDeg(-35, -25, 25),
        qDeg(-10, -10, 10),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('KINETIC_KICK', 2.2, tracks));
  }

  // =========================================================================
  // 3. PUNCH_COMBO (Category: ACTION, Duration: 2.0s)
  // Rapid 1-2 jab-cross cybernetic fist strike sequence
  // =========================================================================
  {
    const times = [0.0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.0];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, 0, 0),
        qDeg(8, 25, 0),   // Left jab pivot
        qDeg(5, 5, 0),
        qDeg(8, -35, 0),  // Right cross pivot
        qDeg(10, -40, 0), // Full follow through
        qDeg(6, -15, 0),
        qDeg(5, 0, 0),
        qDeg(5, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, 0, 0),
        qDeg(12, 28, 0),  // Torso coils with left
        qDeg(8, 0, 0),
        qDeg(15, -45, 0), // Hard coil with right cross
        qDeg(18, -48, 0),
        qDeg(10, -18, 0),
        qDeg(10, 0, 0),
        qDeg(10, 0, 0),
      ])),
      // Left Arm: Jab strike at 0.3s
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 15, -15),
        qDeg(-85, 10, -5),  // FULL EXTENSION
        qDeg(-50, 20, -20),
        qDeg(-40, 25, -25), // Guard position
        qDeg(-40, 25, -25),
        qDeg(-45, 15, -15),
        qDeg(-45, 15, -15),
        qDeg(-45, 15, -15),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 0),
        qDeg(-8, 0, 0),     // Snapped straight!
        qDeg(-75, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-90, 0, 0),
        qDeg(-90, 0, 0),
        qDeg(-90, 0, 0),
      ])),
      // Right Arm: Power Cross strike at 1.2s
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-40, -20, 20),
        qDeg(-35, -30, 25), // Cocked back
        qDeg(-45, -25, 20),
        qDeg(-88, -12, 8),  // POWER CROSS LAUNCH!
        qDeg(-92, -10, 5),  // Over-extension
        qDeg(-60, -20, 15),
        qDeg(-40, -20, 20),
        qDeg(-40, -20, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-85, 0, 0),
        qDeg(-5, 0, 0),     // FULL EXTENSION SNAP
        qDeg(-5, 0, 0),
        qDeg(-60, 0, 0),
        qDeg(-90, 0, 0),
        qDeg(-90, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('PUNCH_COMBO', 2.0, tracks));
  }

  // =========================================================================
  // 4. CYBER_WAVE (Category: EMOTE, Duration: 2.4s)
  // Friendly android wave gesture with head tilt
  // =========================================================================
  {
    const times = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-80, -20, 55),
        qDeg(-85, -22, 60),
        qDeg(-80, -18, 55),
        qDeg(-85, -22, 60),
        qDeg(-50, -10, 30),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-65, 0, 30),
        qDeg(-65, 0, -20), // Waving right
        qDeg(-65, 0, 30),  // Waving left
        qDeg(-65, 0, -20), // Waving right
        qDeg(-30, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-5, -15, 12),
        qDeg(-8, -12, 15),
        qDeg(-5, -15, 12),
        qDeg(-8, -12, 15),
        qDeg(-2, -5, 5),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('CYBER_WAVE', 2.4, tracks));
  }

  // =========================================================================
  // 5. VICTORY_SALUTE (Category: EMOTE, Duration: 2.5s)
  // Double power fists raised overhead in triumph
  // =========================================================================
  {
    const times = [0.0, 0.6, 1.2, 1.8, 2.5];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, 20, -55),
        qDeg(-125, 25, -60),
        qDeg(-125, 25, -60),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-85, 0, -20),
        qDeg(-95, 0, -25),
        qDeg(-95, 0, -25),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, -20, 55),
        qDeg(-125, -25, 60),
        qDeg(-125, -25, 60),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-85, 0, 20),
        qDeg(-95, 0, 25),
        qDeg(-95, 0, 25),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-12, 0, 0),
        qDeg(-18, 0, 0),
        qDeg(-18, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(-28, 0, 0),
        qDeg(-28, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('VICTORY_SALUTE', 2.5, tracks));
  }

  // =========================================================================
  // 6. POWER_SURGE (Category: ACTION, Duration: 2.8s)
  // Supercharged android levitation & core surge pose
  // =========================================================================
  {
    const times = [0.0, 0.6, 1.4, 2.1, 2.8];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.15, 0),
        new THREE.Vector3(0, 0.28, 0.05), // Hovering in air
        new THREE.Vector3(0, 0.26, 0.05),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-15, 0, 0),
        qDeg(-25, 0, 0), // Arch chest to sky
        qDeg(-22, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-25, 0, 0),
        qDeg(-40, 0, 0), // Looking straight up
        qDeg(-38, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-35, 10, -65),
        qDeg(-15, 20, -90), // Spread wings wide
        qDeg(-15, 20, -90),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-35, -10, 65),
        qDeg(-15, -20, 90), // Spread wings wide
        qDeg(-15, -20, 90),
        qDeg(0, 0, 0),
      ])),
      // Hanging legs
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-12, 0, -10),
        qDeg(-18, 0, -12),
        qDeg(-18, 0, -12),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-12, 0, 10),
        qDeg(-18, 0, 12),
        qDeg(-18, 0, 12),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('POWER_SURGE', 2.8, tracks));
  }

  // =========================================================================
  // 7. HERO_LANDING (Category: ACTION, Duration: 2.6s)
  // Dynamic three-point ground superhero impact landing & recovery
  // =========================================================================
  {
    const times = [0.0, 0.4, 1.0, 1.8, 2.6];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(0, -0.38, 0), // Hard crouch impact!
        new THREE.Vector3(0, -0.36, 0),
        new THREE.Vector3(0, -0.15, 0),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, 0, 0),
        qDeg(55, -15, 0), // Hunched over fist
        qDeg(35, -10, 0), // Head raising
        qDeg(15, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(35, 0, 0),   // Facing floor
        qDeg(-25, 10, 0), // Chin up, eyes on camera!
        qDeg(-5, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right Arm: Punches ground
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-20, 0, 0),
        qDeg(-65, -10, 10),
        qDeg(-60, -10, 10),
        qDeg(-25, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-30, 0, 0),
        qDeg(-75, 0, 0),
        qDeg(-70, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left Arm: Swept back for balance
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-10, 0, 0),
        qDeg(25, 20, -55),
        qDeg(20, 20, -45),
        qDeg(0, 0, -10),
        qDeg(0, 0, 0),
      ])),
      // Kneeling legs
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(65, 0, 10),
        qDeg(65, 0, 10),
        qDeg(25, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-120, 0, 0), // Knee on floor
        qDeg(-120, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(45, -20, -25), // Leg splayed out
        qDeg(45, -20, -25),
        qDeg(15, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-70, 0, 0),
        qDeg(-70, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('HERO_LANDING', 2.6, tracks));
  }

  // =========================================================================
  // 8. TAICHI_ZEN (Category: LOCOMOTION, Duration: 3.6s)
  // Fluid robotic martial arts continuous weight shifting and arm push
  // =========================================================================
  {
    const times = [0.0, 0.9, 1.8, 2.7, 3.6];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, -15, 0),
        qDeg(5, 20, 0),
        qDeg(0, -15, 0),
        qDeg(5, 20, 0),
        qDeg(0, -15, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(5, -20, 0),
        qDeg(8, 25, 0),
        qDeg(5, -20, 0),
        qDeg(8, 25, 0),
        qDeg(5, -20, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 25, -25),
        qDeg(-75, 45, -15), // Pushing left palm
        qDeg(-25, 10, -35),
        qDeg(-60, 30, -20),
        qDeg(-45, 25, -25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -20, 20),
        qDeg(-25, -10, 35),
        qDeg(-75, -45, 15), // Pushing right palm
        qDeg(-40, -25, 20),
        qDeg(-35, -20, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, -15, 0),
        qDeg(0, 20, 0),
        qDeg(0, -15, 0),
        qDeg(0, 20, 0),
        qDeg(0, -15, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('TAICHI_ZEN', 3.6, tracks));
  }

  // =========================================================================
  // 9. TACTICAL_SWEEP (Category: STANCE, Duration: 3.2s)
  // Military sentry sweep: turning, raised scanning sensor, target acquisition
  // =========================================================================
  {
    const times = [0.0, 0.8, 1.6, 2.4, 3.2];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(5, 0, 0),
        qDeg(8, 45, 0),   // Turn torso left
        qDeg(5, 0, 0),
        qDeg(8, -45, 0),  // Turn torso right
        qDeg(5, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-8, 30, 0),
        qDeg(5, 0, 0),
        qDeg(-8, -30, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -10, 15),
        qDeg(-75, -20, 25), // Raised weapon/sensor scan
        qDeg(-80, -5, 15),
        qDeg(-75, 10, 10),
        qDeg(-35, -10, 15),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-60, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(-35, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(-60, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('TACTICAL_SWEEP', 3.2, tracks));
  }

  // =========================================================================
  // 10. REBOOT_STAGGER (Category: ACTION, Duration: 3.0s)
  // EMP electrical shock stagger and servo reboot calibration
  // =========================================================================
  {
    const times = [0.0, 0.4, 0.9, 1.5, 2.2, 3.0];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.08, -0.12, 0.05), // Buckling
        new THREE.Vector3(0.06, -0.15, -0.04),
        new THREE.Vector3(0, -0.18, 0),        // Low slump
        new THREE.Vector3(0, -0.05, 0),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(35, 15, -12), // Glitch jolt
        qDeg(40, -18, 15),
        qDeg(45, 0, 0),    // Drooped offline
        qDeg(10, 0, 0),    // Power restoring
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(45, 20, 0),   // Drooping forward
        qDeg(50, -25, 0),
        qDeg(55, 0, 0),
        qDeg(-15, 0, 0),   // Snap to attention!
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(25, 0, -25),
        qDeg(20, 0, -20),
        qDeg(10, 0, -10),
        qDeg(-35, 10, -15),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(25, 0, 25),
        qDeg(20, 0, 20),
        qDeg(10, 0, 10),
        qDeg(-35, -10, 15),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('REBOOT_STAGGER', 3.0, tracks));
  }

  // =========================================================================
  // 11. TURBO_SPRINT (Category: LOCOMOTION, Duration: 1.0s)
  // Rapid cybernetic sprint cycle with high knee drive
  // =========================================================================
  {
    const times = [0.0, 0.25, 0.5, 0.75, 1.0];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, -0.04, 0),
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, -0.04, 0),
        new THREE.Vector3(0, 0.02, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(22, 12, 0),  // Aerodynamic forward sprint lean
        qDeg(24, 0, 0),
        qDeg(22, -12, 0),
        qDeg(24, 0, 0),
        qDeg(22, 12, 0),
      ])),
      // Alternating Legs
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftUpLeg.quaternion', times, quatArray([
        qDeg(65, 0, 0),   // High forward knee
        qDeg(10, 0, 0),
        qDeg(-35, 0, 0),  // Rear extension
        qDeg(20, 0, 0),
        qDeg(65, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(-35, 0, 0),  // Rear extension
        qDeg(20, 0, 0),
        qDeg(65, 0, 0),   // High forward knee
        qDeg(10, 0, 0),
        qDeg(-35, 0, 0),
      ])),
      // Alternating Arms
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-65, 0, -15), // Back pump
        qDeg(-10, 0, -10),
        qDeg(55, 0, -20),  // Forward pump
        qDeg(-10, 0, -10),
        qDeg(-65, 0, -15),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(55, 0, 20),   // Forward pump
        qDeg(-10, 0, 10),
        qDeg(-65, 0, 15),  // Back pump
        qDeg(-10, 0, 10),
        qDeg(55, 0, 20),
      ])),
    ];
    clips.push(new THREE.AnimationClip('TURBO_SPRINT', 1.0, tracks));
  }

  // =========================================================================
  // 12. RIGHT_PUNCH (Category: ACTION, Duration: 0.65s)
  // Lightning-fast straight power cross punch with hip drive and crisp snap-back
  // =========================================================================
  {
    const times = [0.0, 0.12, 0.25, 0.35, 0.5, 0.65];
    const tracks: THREE.KeyframeTrack[] = [
      // Hips pivot clockwise into punch
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, -10, 0),
        qDeg(6, -25, 0),  // Weight shift back
        qDeg(10, 35, -5), // Explosive rotational drive!
        qDeg(8, 30, -3),  // Peak extension
        qDeg(6, 10, 0),   // Recoil
        qDeg(5, -10, 0),  // Return to ready stance
      ])),
      // Torso coils through right shoulder
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, -5, 0),
        qDeg(12, -18, 0),
        qDeg(16, 45, -5), // Torso drives right shoulder forward
        qDeg(15, 42, -4),
        qDeg(12, 15, 0),
        qDeg(10, -5, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine1.quaternion', times, quatArray([
        qDeg(8, -5, 0),
        qDeg(10, -12, 0),
        qDeg(14, 25, 0),
        qDeg(12, 20, 0),
        qDeg(10, 5, 0),
        qDeg(8, -5, 0),
      ])),
      // Right Arm: Straight Power Cross Strike
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -25, 20), // Guard
        qDeg(-45, -35, 30), // Cocked rear fist
        qDeg(-88, 12, 8),   // Direct forward ballistic strike line!
        qDeg(-92, 10, 5),   // Full lock
        qDeg(-60, -10, 15), // Quick retract
        qDeg(-35, -25, 20), // Back to chin guard
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 10),
        qDeg(-95, 0, 15),
        qDeg(-4, 0, 0),     // FULL STRAIGHT EXTENSION SNAP!
        qDeg(-4, 0, 0),
        qDeg(-65, 0, 10),
        qDeg(-90, 0, 10),
      ])),
      // Left Arm: Chin Shield Guard during strike
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 20, -20),
        qDeg(-48, 25, -22),
        qDeg(-50, 28, -25), // Held high guarding cheek
        qDeg(-50, 28, -25),
        qDeg(-46, 22, -20),
        qDeg(-45, 20, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, -20),
        qDeg(-100, 0, -22),
        qDeg(-105, 0, -25),
        qDeg(-105, 0, -25),
        qDeg(-98, 0, -20),
        qDeg(-95, 0, -20),
      ])),
      // Head locked on target
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-5, 5, 0),
        qDeg(-6, 2, 0),
        qDeg(-8, -12, 3), // Counters torso rotation to stay facing camera
        qDeg(-8, -10, 2),
        qDeg(-6, -2, 0),
        qDeg(-5, 5, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('RIGHT_PUNCH', 0.65, tracks));
  }

  // =========================================================================
  // 13. LEFT_PUNCH (Category: ACTION, Duration: 0.6s)
  // Snappy lead left jab with rapid shoulder pop and immediate guard reset
  // =========================================================================
  {
    const times = [0.0, 0.1, 0.22, 0.32, 0.45, 0.6];
    const tracks: THREE.KeyframeTrack[] = [
      // Hips pivot counter-clockwise into jab
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, 5, 0),
        qDeg(8, 25, 0),   // Hip lead snap
        qDeg(10, 32, 2),  // Peak jab drive
        qDeg(8, 20, 0),
        qDeg(6, 10, 0),
        qDeg(5, 5, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, 0, 0),
        qDeg(14, 28, 0),  // Left shoulder turns into camera
        qDeg(16, 38, 0),
        qDeg(12, 18, 0),
        qDeg(10, 5, 0),
        qDeg(10, 0, 0),
      ])),
      // Left Arm: Snappy Lead Jab
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 20, -20),
        qDeg(-75, 10, -8),
        qDeg(-92, 5, 0),    // Full horizontal strike extension!
        qDeg(-90, 5, 0),
        qDeg(-60, 15, -15), // Quick whip back
        qDeg(-45, 20, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, 0),
        qDeg(-35, 0, 0),
        qDeg(-5, 0, 0),     // LOCKED JAB SNAP
        qDeg(-5, 0, 0),
        qDeg(-65, 0, 0),
        qDeg(-95, 0, 0),
      ])),
      // Right Arm: Rear power guard at jawline
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -25, 20),
        qDeg(-38, -28, 22),
        qDeg(-40, -30, 25),
        qDeg(-40, -30, 25),
        qDeg(-36, -26, 22),
        qDeg(-35, -25, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 20),
        qDeg(-92, 0, 22),
        qDeg(-95, 0, 25),
        qDeg(-95, 0, 25),
        qDeg(-92, 0, 22),
        qDeg(-90, 0, 20),
      ])),
      // Head locked forward
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-5, 0, 0),
        qDeg(-6, -10, -2),
        qDeg(-8, -15, -3),
        qDeg(-7, -8, -1),
        qDeg(-5, -2, 0),
        qDeg(-5, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('LEFT_PUNCH', 0.6, tracks));
  }

  // =========================================================================
  // 14. UPPERCUT (Category: ACTION, Duration: 0.8s)
  // Explosive vertical chin strike with dipped hips and surging spine drive
  // =========================================================================
  {
    const times = [0.0, 0.18, 0.38, 0.52, 0.65, 0.8];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.08, -0.04), // Drop down into coil
        new THREE.Vector3(0, 0.06, 0.05),   // Rise with power!
        new THREE.Vector3(0, 0.04, 0.03),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, -15, 0),
        qDeg(12, -30, 8),  // Dip and coil back
        qDeg(-5, 25, -10), // Explosive rising rotation
        qDeg(-2, 20, -5),
        qDeg(2, 0, 0),
        qDeg(5, -15, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, -5, 0),
        qDeg(18, -25, 10), // Deep lower coil
        qDeg(-12, 35, -15),// Upward whip through ribcage!
        qDeg(-8, 25, -10),
        qDeg(5, 5, 0),
        qDeg(10, -5, 0),
      ])),
      // Right Arm: Rising Uppercut Fist
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -25, 20),
        qDeg(-15, -40, 35), // Drops low to gather kinetic lift
        qDeg(-105, -5, 12), // Vertical upward rocket thrust!
        qDeg(-98, -10, 15),
        qDeg(-55, -20, 20),
        qDeg(-35, -25, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 15),
        qDeg(-120, 0, 25), // Tightly bent elbow loaded like a spring
        qDeg(-45, 0, 10),  // Vertical fist explodes upwards
        qDeg(-55, 0, 12),
        qDeg(-80, 0, 15),
        qDeg(-90, 0, 15),
      ])),
      // Left Guard
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 20, -20),
        qDeg(-52, 25, -25),
        qDeg(-48, 22, -22),
        qDeg(-45, 20, -20),
        qDeg(-45, 20, -20),
        qDeg(-45, 20, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, -20),
        qDeg(-105, 0, -25),
        qDeg(-100, 0, -22),
        qDeg(-95, 0, -20),
        qDeg(-95, 0, -20),
        qDeg(-95, 0, -20),
      ])),
    ];
    clips.push(new THREE.AnimationClip('UPPERCUT', 0.8, tracks));
  }

  // =========================================================================
  // 15. DODGE_LEFT (Category: ACTION, Duration: 0.7s)
  // Rapid evasive slip to the left, ducking beneath oncoming strikes
  // =========================================================================
  {
    const times = [0.0, 0.15, 0.32, 0.48, 0.7];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.12, -0.06, -0.04), // Dip and lateral slip left
        new THREE.Vector3(-0.18, -0.08, -0.06), // Maximum evasion angle
        new THREE.Vector3(-0.08, -0.03, -0.02),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, 0, 0),
        qDeg(10, 15, -12),
        qDeg(12, 20, -18), // Hip tilt into slip
        qDeg(8, 10, -8),
        qDeg(5, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, 0, 0),
        qDeg(15, 25, -25), // Torso dips left under the punch
        qDeg(18, 30, -32),
        qDeg(12, 12, -12),
        qDeg(10, 0, 0),
      ])),
      // Guard stays tight to protect skull
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 25, -20),
        qDeg(-55, 30, -25),
        qDeg(-60, 32, -28),
        qDeg(-50, 28, -22),
        qDeg(-45, 25, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, -25),
        qDeg(-105, 0, -30),
        qDeg(-110, 0, -32),
        qDeg(-100, 0, -28),
        qDeg(-95, 0, -25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -25, 20),
        qDeg(-45, -30, 25),
        qDeg(-50, -32, 28),
        qDeg(-40, -28, 22),
        qDeg(-35, -25, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 20),
        qDeg(-100, 0, 25),
        qDeg(-105, 0, 28),
        qDeg(-95, 0, 22),
        qDeg(-90, 0, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-5, 0, 0),
        qDeg(-8, -15, 15),
        qDeg(-10, -20, 20),
        qDeg(-6, -8, 8),
        qDeg(-5, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('DODGE_LEFT', 0.7, tracks));
  }

  // =========================================================================
  // 16. DODGE_RIGHT (Category: ACTION, Duration: 0.7s)
  // Rapid evasive slip to the right, ducking beneath oncoming strikes
  // =========================================================================
  {
    const times = [0.0, 0.15, 0.32, 0.48, 0.7];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.12, -0.06, -0.04), // Dip and lateral slip right
        new THREE.Vector3(0.18, -0.08, -0.06), // Maximum evasion angle
        new THREE.Vector3(0.08, -0.03, -0.02),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(5, 0, 0),
        qDeg(10, -15, 12),
        qDeg(12, -20, 18),
        qDeg(8, -10, 8),
        qDeg(5, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(10, 0, 0),
        qDeg(15, -25, 25), // Torso dips right under the punch
        qDeg(18, -30, 32),
        qDeg(12, -12, 12),
        qDeg(10, 0, 0),
      ])),
      // Guard stays tight
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(-45, 25, -20),
        qDeg(-40, 22, -18),
        qDeg(-42, 24, -20),
        qDeg(-44, 25, -20),
        qDeg(-45, 25, -20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-95, 0, -25),
        qDeg(-98, 0, -26),
        qDeg(-100, 0, -28),
        qDeg(-96, 0, -26),
        qDeg(-95, 0, -25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(-35, -25, 20),
        qDeg(-48, -32, 28),
        qDeg(-55, -36, 32),
        qDeg(-42, -28, 24),
        qDeg(-35, -25, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-90, 0, 20),
        qDeg(-105, 0, 28),
        qDeg(-112, 0, 32),
        qDeg(-98, 0, 24),
        qDeg(-90, 0, 20),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-5, 0, 0),
        qDeg(-8, 15, -15),
        qDeg(-10, 20, -20),
        qDeg(-6, 8, -8),
        qDeg(-5, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('DODGE_RIGHT', 0.7, tracks));
  }

  // =========================================================================
  // 17. ENERGY_BLAST (Category: COMBAT, Duration: 1.6s)
  // Dual-arm repulsor blast: draws both arms back, thrusts both forward with open palms, recoil vibration
  // =========================================================================
  {
    const times = [0.0, 0.35, 0.65, 0.95, 1.25, 1.6];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.06, 0.05), // Load back into stance
        new THREE.Vector3(0, -0.04, -0.08), // Blast forward thrust
        new THREE.Vector3(0, -0.05, 0.03), // Recoil jolt
        new THREE.Vector3(0, -0.02, 0.01),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(12, 0, 0),
        qDeg(-8, 0, 0),
        qDeg(6, 0, 0),
        qDeg(2, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, 0, 0), // Coiling back
        qDeg(-18, 0, 0), // Explosive forward thrust
        qDeg(10, 0, 0), // Recoil
        qDeg(4, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left Arm Blast
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, 25, -20), // Chamber at ribs
        qDeg(-85, 10, -5),  // Extended forward straight
        qDeg(-88, 12, -6),  // Sustained repulsor discharge
        qDeg(-45, 15, -12),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, 0, 0), // Fully bent
        qDeg(-10, 0, 0),  // Snapped straight
        qDeg(-12, 0, 0),  // Shock tremor
        qDeg(-45, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftHand.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(10, 0, 0),
        qDeg(75, 0, -10), // Palms angled up 75 deg facing forward (repulsor beam)
        qDeg(80, 0, -10),
        qDeg(25, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right Arm Blast
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, -25, 20),
        qDeg(-85, -10, 5),
        qDeg(-88, -12, 6),
        qDeg(-45, -15, 12),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, 0, 0),
        qDeg(-10, 0, 0),
        qDeg(-12, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightHand.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(10, 0, 0),
        qDeg(75, 0, 10),
        qDeg(80, 0, 10),
        qDeg(25, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(8, 0, 0),
        qDeg(-12, 0, 0),
        qDeg(5, 0, 0),
        qDeg(2, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('ENERGY_BLAST', 1.6, tracks));
  }

  // =========================================================================
  // 18. X_GUARD (Category: DEFENSE, Duration: 2.0s)
  // Crossed forearms forming an impenetrable X-barrier across chest and chin
  // =========================================================================
  {
    const times = [0.0, 0.4, 1.0, 1.6, 2.0];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.08, 0.02),
        new THREE.Vector3(0, -0.08, 0.02),
        new THREE.Vector3(0, -0.04, 0.01),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(18, 0, 0),
        qDeg(18, 0, 0),
        qDeg(8, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left Arm crossed to right
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-60, 45, -30),
        qDeg(-62, 45, -30),
        qDeg(-30, 20, -15),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-105, 10, 20),
        qDeg(-105, 10, 20),
        qDeg(-50, 5, 10),
        qDeg(0, 0, 0),
      ])),
      // Right Arm crossed to left
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-60, -45, 30),
        qDeg(-62, -45, 30),
        qDeg(-30, -20, 15),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-105, -10, -20),
        qDeg(-105, -10, -20),
        qDeg(-50, -5, -10),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, 0, 0), // Tucked behind guard
        qDeg(15, 0, 0),
        qDeg(6, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('X_GUARD', 2.0, tracks));
  }

  // =========================================================================
  // 19. T_POSE_CALIBRATION (Category: CALIBRATION, Duration: 2.5s)
  // Rigid T-Pose stance: arms held out horizontally, spine aligned
  // =========================================================================
  {
    const times = [0.0, 0.5, 1.25, 2.0, 2.5];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-2, 0, 0),
        qDeg(-2, 0, 0),
        qDeg(-1, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left Arm straight out at 90 deg
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(0, 0, -85),
        qDeg(0, 0, -85),
        qDeg(0, 0, -85),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right Arm straight out at 90 deg
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(0, 0, 85),
        qDeg(0, 0, 85),
        qDeg(0, 0, 85),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-5, 0, 0),
        qDeg(-5, 0, 0),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('T_POSE', 2.5, tracks));
  }

  // =========================================================================
  // 20. CROUCH_STEALTH (Category: STANCE, Duration: 2.2s)
  // Low tactical crouch: hips dropped, one knee flexed deep, one hand touching floor
  // =========================================================================
  {
    const times = [0.0, 0.4, 1.1, 1.8, 2.2];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.38, 0.05),
        new THREE.Vector3(0, -0.38, 0.05),
        new THREE.Vector3(0, -0.2, 0.02),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(22, 10, -8),
        qDeg(22, 10, -8),
        qDeg(10, 5, -4),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(28, -8, 5),
        qDeg(28, -8, 5),
        qDeg(12, -4, 2),
        qDeg(0, 0, 0),
      ])),
      // Right hand touches floor
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(25, -15, 20),
        qDeg(25, -15, 20),
        qDeg(10, -5, 10),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-40, 0, 0),
        qDeg(-40, 0, 0),
        qDeg(-15, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Left arm balance back
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(45, 20, -35),
        qDeg(45, 20, -35),
        qDeg(18, 10, -15),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-25, 5, 0), // Look up while crouching
        qDeg(-25, 5, 0),
        qDeg(-10, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('CROUCH_STEALTH', 2.2, tracks));
  }

  // =========================================================================
  // 21. FLYING_HOVER (Category: LOCOMOTION, Duration: 3.0s, Looping)
  // Anti-gravity levitation: floating in air, gentle spinal bob, feet dangling
  // =========================================================================
  {
    const times = [0.0, 0.75, 1.5, 2.25, 3.0];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.35, -0.03),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.18, 0.02),
        new THREE.Vector3(0, 0.25, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(-12, 0, 0),
        qDeg(-16, 3, 2),
        qDeg(-12, 0, 0),
        qDeg(-8, -3, -2),
        qDeg(-12, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(-8, 0, 0),
        qDeg(-12, 2, 0),
        qDeg(-8, 0, 0),
        qDeg(-5, -2, 0),
        qDeg(-8, 0, 0),
      ])),
      // Stabilizer arms
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(15, 15, -25),
        qDeg(20, 18, -30),
        qDeg(15, 15, -25),
        qDeg(10, 12, -20),
        qDeg(15, 15, -25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(-25, 0, 0),
        qDeg(-32, 0, 0),
        qDeg(-25, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(-25, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(15, -15, 25),
        qDeg(20, -18, 30),
        qDeg(15, -15, 25),
        qDeg(10, -12, 20),
        qDeg(15, -15, 25),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(-25, 0, 0),
        qDeg(-32, 0, 0),
        qDeg(-25, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(-25, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(-15, 0, 0),
        qDeg(-18, 2, 0),
        qDeg(-15, 0, 0),
        qDeg(-12, -2, 0),
        qDeg(-15, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('FLYING_HOVER', 3.0, tracks));
  }

  // =========================================================================
  // 22. TORNADO_SPIN_KICK (Category: COMBAT, Duration: 1.4s)
  // Dynamic 360-degree rotational jump spin hook kick
  // =========================================================================
  {
    const times = [0.0, 0.25, 0.55, 0.85, 1.15, 1.4];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.06, 0.04), // Windup
        new THREE.Vector3(0, 0.35, -0.05), // Aerial elevation
        new THREE.Vector3(0, 0.28, 0),     // Peak rotation
        new THREE.Vector3(0, -0.05, 0.02), // Touchdown
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(10, -45, 0),   // Coil left
        qDeg(-15, 160, 20),  // 180 spin mid-air
        qDeg(-10, 320, 15),  // Complete spin snap
        qDeg(12, 360, 0),   // Landing cushion
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, -30, 0),
        qDeg(-20, 20, 25),
        qDeg(-15, 10, 15),
        qDeg(8, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right leg spin kick
      new THREE.QuaternionKeyframeTrack('mixamorig:RightUpLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(-105, 35, 45), // Whipping roundhouse horizontal kick
        qDeg(-85, 20, 30),
        qDeg(-15, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightLeg.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(45, 0, 0),
        qDeg(10, 0, 0), // Full kick extension
        qDeg(30, 0, 0),
        qDeg(40, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Counter-balance arms
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-45, -30, -30),
        qDeg(-60, -45, -45),
        qDeg(-30, -15, -15),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(30, 45, 30),
        qDeg(60, 45, 45),
        qDeg(20, 15, 15),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('TORNADO_KICK', 1.4, tracks));
  }

  // =========================================================================
  // 23. DOUBLE_PALM (Category: COMBAT, Duration: 1.3s)
  // Explosive two-handed kinetic palm strike with forward weight commitment
  // =========================================================================
  {
    const times = [0.0, 0.3, 0.6, 0.95, 1.3];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.05, 0.04), // Retract
        new THREE.Vector3(0, -0.03, -0.1), // Burst forward
        new THREE.Vector3(0, -0.02, -0.02),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, 0, 0),
        qDeg(-22, 0, 0),
        qDeg(-5, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, 20, -15), // Chambered back
        qDeg(-85, 8, -5),  // Palm strike forward
        qDeg(-70, 10, -8),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-5, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftHand.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(65, 0, 0), // Palm flexed back for heel strike
        qDeg(40, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(15, -20, 15),
        qDeg(-85, -8, 5),
        qDeg(-70, -10, 8),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-5, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightHand.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(65, 0, 0),
        qDeg(40, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('DOUBLE_PALM', 1.3, tracks));
  }

  // =========================================================================
  // 24. MARTIAL_BOW (Category: CEREMONY, Duration: 2.2s)
  // Formal martial arts salute and respectful waist bow
  // =========================================================================
  {
    const times = [0.0, 0.4, 1.1, 1.7, 2.2];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(8, 0, 0),
        qDeg(35, 0, 0), // Deep bow at waist
        qDeg(12, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine1.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(5, 0, 0),
        qDeg(20, 0, 0),
        qDeg(8, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right fist meets left open palm at chest
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-50, -35, 25),
        qDeg(-52, -35, 25),
        qDeg(-25, -15, 12),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-100, 0, 0),
        qDeg(-100, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-50, 35, -25),
        qDeg(-52, 35, -25),
        qDeg(-25, 15, -12),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-100, 0, 0),
        qDeg(-100, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(10, 0, 0),
        qDeg(25, 0, 0), // Head lowered in respect
        qDeg(8, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('BOW', 2.2, tracks));
  }

  // =========================================================================
  // 25. ACROBATIC_FLIP (Category: ACROBATICS, Duration: 1.5s)
  // Backward evasive somersault with hip rotation and soft landing
  // =========================================================================
  {
    const times = [0.0, 0.3, 0.6, 0.9, 1.2, 1.5];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.1, 0.05), // Crouch launch
        new THREE.Vector3(0, 0.5, 0.1),   // High aerial apex
        new THREE.Vector3(0, 0.35, 0.15),
        new THREE.Vector3(0, -0.08, 0.08), // Landing compression
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(25, 0, 0),
        qDeg(-160, 0, 0), // Mid-flip tuck
        qDeg(-320, 0, 0), // Rotating out
        qDeg(15, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(30, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(-20, 0, 0),
        qDeg(10, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, 15, -15),
        qDeg(-150, 20, -20),
        qDeg(-60, 10, -10),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-110, -15, 15),
        qDeg(-150, -20, 20),
        qDeg(-60, -10, 10),
        qDeg(0, 0, 0),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('ACROBATIC_FLIP', 1.5, tracks));
  }

  // =========================================================================
  // 26. VICTORY_DANCE (Category: EMOTE, Duration: 2.4s, Looping)
  // Rhythmic robotic pop and lock victory groove
  // =========================================================================
  {
    const times = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4];
    const tracks: THREE.KeyframeTrack[] = [
      new THREE.VectorKeyframeTrack('mixamorig:Hips.position', times, vecArray([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.04, -0.04, 0),
        new THREE.Vector3(-0.04, -0.02, 0.02),
        new THREE.Vector3(0.05, -0.04, -0.01),
        new THREE.Vector3(-0.03, -0.03, 0.01),
        new THREE.Vector3(0.02, -0.02, 0),
        new THREE.Vector3(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(5, 15, -8),
        qDeg(-5, -15, 8),
        qDeg(6, 20, -10),
        qDeg(-6, -18, 9),
        qDeg(3, 8, -4),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Spine.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-10, -12, 10),
        qDeg(8, 14, -8),
        qDeg(-12, -15, 12),
        qDeg(10, 12, -10),
        qDeg(-5, -6, 5),
        qDeg(0, 0, 0),
      ])),
      // Left Arm popping
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-75, 25, -45),
        qDeg(-20, 10, -15),
        qDeg(-85, 30, -50),
        qDeg(-35, 15, -20),
        qDeg(-50, 20, -30),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:LeftForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-85, 0, 0),
        qDeg(-30, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-45, 0, 0),
        qDeg(-60, 0, 0),
        qDeg(0, 0, 0),
      ])),
      // Right Arm popping
      new THREE.QuaternionKeyframeTrack('mixamorig:RightArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-25, -12, 18),
        qDeg(-80, -28, 48),
        qDeg(-30, -15, 22),
        qDeg(-90, -32, 52),
        qDeg(-45, -18, 25),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:RightForeArm.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-35, 0, 0),
        qDeg(-90, 0, 0),
        qDeg(-40, 0, 0),
        qDeg(-95, 0, 0),
        qDeg(-55, 0, 0),
        qDeg(0, 0, 0),
      ])),
      new THREE.QuaternionKeyframeTrack('mixamorig:Head.quaternion', times, quatArray([
        qDeg(0, 0, 0),
        qDeg(-8, 15, -5),
        qDeg(6, -18, 6),
        qDeg(-10, 20, -7),
        qDeg(8, -15, 5),
        qDeg(-4, 8, -3),
        qDeg(0, 0, 0),
      ])),
    ];
    clips.push(new THREE.AnimationClip('VICTORY_DANCE', 2.4, tracks));
  }

  // If armature bones do not have colons, adjust track names from 'mixamorig:*' to 'mixamorig*'
  if (!useColon) {
    for (const clip of clips) {
      for (const track of clip.tracks) {
        if (track.name.startsWith('mixamorig:')) {
          track.name = track.name.replace('mixamorig:', 'mixamorig');
        }
      }
    }
  }

  return clips;
}

/**
 * Procedural Kinematic Track Presets for Non-Rigged and Procedural Models
 * (Ultron Helmet, Singularity Tesseract, Recon Interceptor)
 */
export const PROCEDURAL_KINEMATIC_TRACKS: AnimationTrackData[] = [
  { name: 'SENTINEL SWEEP', duration: 4.0, tracksCount: 3, category: 'STANCE' },
  { name: 'WARP DRIVE ENGAGE', duration: 3.0, tracksCount: 4, category: 'LOCOMOTION' },
  { name: 'COMBAT EVASION', duration: 3.5, tracksCount: 4, category: 'ACTION' },
  { name: 'OVERLOAD JITTER', duration: 2.5, tracksCount: 2, category: 'ACTION' },
  { name: 'QUANTUM BREACH', duration: 4.5, tracksCount: 3, category: 'IDLE' },
  { name: 'STEALTH GLIDE', duration: 5.0, tracksCount: 2, category: 'LOCOMOTION' },
  { name: 'DEFENSE MATRIX', duration: 3.0, tracksCount: 3, category: 'STANCE' },
  { name: 'TURNTABLE SCAN', duration: 4.0, tracksCount: 3, category: 'LOCOMOTION' },
  { name: 'LEVITATION HOVER', duration: 3.5, tracksCount: 2, category: 'IDLE' },
  { name: 'TACTICAL GYRO', duration: 5.0, tracksCount: 4, category: 'ACTION' },
  { name: 'HYPER PULSE', duration: 2.0, tracksCount: 1, category: 'STANCE' },
];
