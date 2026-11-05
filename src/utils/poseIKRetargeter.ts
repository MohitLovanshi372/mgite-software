/**
 * Humanoid Pose Inverse Kinematics & Armature Retargeting Engine
 *
 * Maps webcam tracked body landmarks (shoulder -> elbow -> wrist)
 * onto standard humanoid bone armatures ('mixamorig:*') in real time.
 * Includes damping, bone constraint limits, and kinematic blending.
 */

import * as THREE from 'three';
import { BodyPoseLandmarks, PoseLandmarkPoint } from '../types/gestures.ts';

interface HumanoidBoneMap {
  leftArm: THREE.Bone | null;
  leftForeArm: THREE.Bone | null;
  leftHand: THREE.Bone | null;
  rightArm: THREE.Bone | null;
  rightForeArm: THREE.Bone | null;
  rightHand: THREE.Bone | null;
  spine: THREE.Bone | null;
  spine1: THREE.Bone | null;
  head: THREE.Bone | null;
  hips: THREE.Bone | null;
  leftUpLeg: THREE.Bone | null;
  leftLeg: THREE.Bone | null;
  rightUpLeg: THREE.Bone | null;
  rightLeg: THREE.Bone | null;
}

export class PoseIKRetargeter {
  private bones: HumanoidBoneMap = {
    leftArm: null,
    leftForeArm: null,
    leftHand: null,
    rightArm: null,
    rightForeArm: null,
    rightHand: null,
    spine: null,
    spine1: null,
    head: null,
    hips: null,
    leftUpLeg: null,
    leftLeg: null,
    rightUpLeg: null,
    rightLeg: null,
  };

  private baseQuats: Map<THREE.Bone, THREE.Quaternion> = new Map();
  private baseHipsPos: THREE.Vector3 | null = null;
  private isBound = false;
  private blendWeight = 0.7; // Blending weight between IK retargeting and clip animation
  private isEnabled = true;
  private isFullBodyMocap = false;

  // Working vectors and quaternions (preallocated to avoid garbage collection)
  private _v1 = new THREE.Vector3();
  private _v2 = new THREE.Vector3();
  private _dir = new THREE.Vector3();
  private _targetQuat = new THREE.Quaternion();
  private _tempQuat = new THREE.Quaternion();

  /**
   * Scans root 3D object for standard humanoid bones and binds references
   */
  public bindSkeleton(root: THREE.Object3D): boolean {
    this.baseQuats.clear();
    this.baseHipsPos = null;
    this.bones = {
      leftArm: null,
      leftForeArm: null,
      leftHand: null,
      rightArm: null,
      rightForeArm: null,
      rightHand: null,
      spine: null,
      spine1: null,
      head: null,
      hips: null,
      leftUpLeg: null,
      leftLeg: null,
      rightUpLeg: null,
      rightLeg: null,
    };

    root.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        const name = bone.name.toLowerCase();

        if (name.includes('hips') || name === 'pelvis' || name.includes('mixamorig:hips')) {
          this.bones.hips = bone;
          this.baseHipsPos = bone.position.clone();
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('leftarm') && !name.includes('fore')) {
          this.bones.leftArm = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('leftforearm')) {
          this.bones.leftForeArm = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('lefthand')) {
          this.bones.leftHand = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('rightarm') && !name.includes('fore')) {
          this.bones.rightArm = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('rightforearm')) {
          this.bones.rightForeArm = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('righthand')) {
          this.bones.rightHand = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('leftupleg')) {
          this.bones.leftUpLeg = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('leftleg') && !name.includes('up')) {
          this.bones.leftLeg = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('rightupleg')) {
          this.bones.rightUpLeg = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('rightleg') && !name.includes('up')) {
          this.bones.rightLeg = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('spine1')) {
          this.bones.spine1 = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('spine') && !name.includes('spine1') && !name.includes('spine2')) {
          this.bones.spine = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        } else if (name.includes('head')) {
          this.bones.head = bone;
          this.baseQuats.set(bone, bone.quaternion.clone());
        }
      }
    });

    this.isBound = this.bones.leftArm !== null && this.bones.rightArm !== null;
    return this.isBound;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setFullBodyMocap(enabled: boolean): void {
    this.isFullBodyMocap = enabled;
  }

  public getIsFullBodyMocap(): boolean {
    return this.isFullBodyMocap;
  }

  public setBlendWeight(weight: number): void {
    this.blendWeight = Math.max(0, Math.min(1.0, weight));
  }

  public getBlendWeight(): number {
    return this.blendWeight;
  }

  /**
   * Evaluates smoothed pose landmarks and applies full body IK rotation updates
   * (Spine, Hips, Head, Arms, Hands, Legs).
   */
  public update(landmarks: BodyPoseLandmarks | null, delta = 0.016): void {
    if (!this.isBound || !this.isEnabled || !landmarks || !landmarks.isTracking) return;

    const effectiveWeight = this.isFullBodyMocap ? Math.max(0.85, this.blendWeight) : this.blendWeight;
    const alpha = Math.min(1.0, delta * 14 * effectiveWeight);

    // 1. HIPS: Squat depth and lateral shift
    if (this.bones.hips && this.baseHipsPos) {
      const squatDepth = landmarks.squatDepth ?? 0;
      const shoulderMidX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) * 0.5;
      const lateralHipsShift = -(shoulderMidX - 0.5) * 0.2;

      // Lower hips when user squats
      const targetHipsY = this.baseHipsPos.y - squatDepth * 0.35;
      this.bones.hips.position.y = THREE.MathUtils.lerp(this.bones.hips.position.y, targetHipsY, alpha);
      this.bones.hips.position.x = THREE.MathUtils.lerp(this.bones.hips.position.x, this.baseHipsPos.x + lateralHipsShift, alpha);

      // Pelvic tilt
      const pelvicRoll = -(shoulderMidX - 0.5) * 0.25;
      const targetHipsQuat = this._tempQuat.setFromEuler(new THREE.Euler(squatDepth * 0.2, 0, pelvicRoll, 'XYZ'));
      const baseHips = this.baseQuats.get(this.bones.hips);
      if (baseHips) {
        this.bones.hips.quaternion.slerp(baseHips.clone().multiply(targetHipsQuat), alpha * 0.6);
      }
    }

    // 2. TORSO / SPINE: Tilt, lean, and twist
    if (this.bones.spine) {
      const shoulderMidX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) * 0.5;
      const torsoRoll = -(shoulderMidX - 0.5) * 0.5; // Lean left/right
      const torsoPitch = (landmarks.nose.y - 0.25) * 0.45; // Lean forward/back

      // Shoulder twist / yaw
      const shoulderDeltaZ = (landmarks.rightShoulder.z - landmarks.leftShoulder.z) * 0.6;

      const targetTorso = this._tempQuat.setFromEuler(
        new THREE.Euler(torsoPitch, shoulderDeltaZ, torsoRoll, 'XYZ')
      );
      const baseSpine = this.baseQuats.get(this.bones.spine);
      if (baseSpine) {
        this.bones.spine.quaternion.slerp(baseSpine.clone().multiply(targetTorso), alpha * 0.6);
      }
    }

    // 3. HEAD TRACKING: Pitch, Yaw, and Roll
    if (this.bones.head) {
      const eyeDx = landmarks.rightEye.x - landmarks.leftEye.x;
      const eyeDy = landmarks.rightEye.y - landmarks.leftEye.y;
      const headRoll = -Math.atan2(eyeDy, Math.max(0.01, eyeDx)) * 0.8;

      const midEyeX = (landmarks.leftEye.x + landmarks.rightEye.x) * 0.5;
      const headYaw = -(landmarks.nose.x - midEyeX) * 2.5;
      const headPitch = (landmarks.nose.y - 0.2) * 0.7;

      const targetHead = this._tempQuat.setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.clamp(headPitch, -0.4, 0.4),
          THREE.MathUtils.clamp(headYaw, -0.6, 0.6),
          THREE.MathUtils.clamp(headRoll, -0.5, 0.5),
          'XYZ'
        )
      );
      const baseHead = this.baseQuats.get(this.bones.head);
      if (baseHead) {
        this.bones.head.quaternion.slerp(baseHead.clone().multiply(targetHead), alpha * 0.8);
      }
    }

    // 4. RIGHT ARM CHAIN (User's right arm / Screen left in selfie view)
    this.orientArmChain(
      this.bones.rightArm,
      this.bones.rightForeArm,
      this.bones.rightHand,
      landmarks.rightShoulder,
      landmarks.rightElbow,
      landmarks.rightWrist,
      landmarks.rightHandState,
      true,
      alpha
    );

    // 5. LEFT ARM CHAIN (User's left arm / Screen right in selfie view)
    this.orientArmChain(
      this.bones.leftArm,
      this.bones.leftForeArm,
      this.bones.leftHand,
      landmarks.leftShoulder,
      landmarks.leftElbow,
      landmarks.leftWrist,
      landmarks.leftHandState,
      false,
      alpha
    );

    // 6. LEGS & KNEES IK (Squatting and high knee flexion)
    if (this.bones.leftUpLeg && this.bones.leftLeg) {
      this.orientLegChain(
        this.bones.leftUpLeg,
        this.bones.leftLeg,
        landmarks.leftHip,
        landmarks.leftKnee,
        landmarks.leftAnkle,
        false,
        alpha
      );
    }

    if (this.bones.rightUpLeg && this.bones.rightLeg) {
      this.orientLegChain(
        this.bones.rightUpLeg,
        this.bones.rightLeg,
        landmarks.rightHip,
        landmarks.rightKnee,
        landmarks.rightAnkle,
        true,
        alpha
      );
    }
  }

  /**
   * Solves 3-bone limb direction (Shoulder -> Elbow -> Wrist -> Hand)
   */
  private orientArmChain(
    upperArm: THREE.Bone | null,
    foreArm: THREE.Bone | null,
    hand: THREE.Bone | null,
    shoulderPt: PoseLandmarkPoint,
    elbowPt: PoseLandmarkPoint,
    wristPt: PoseLandmarkPoint,
    handState: string | undefined,
    isRight: boolean,
    alpha: number
  ): void {
    if (!upperArm || !foreArm) return;

    const sign = isRight ? 1 : -1;

    // Upper arm direction
    const ux = (elbowPt.x - shoulderPt.x) * 1.8;
    const uy = -(elbowPt.y - shoulderPt.y) * 1.8; // Invert Y for 3D coordinate system
    const uz = (elbowPt.z - shoulderPt.z) * 1.5;

    this._dir.set(ux, uy, uz).normalize();
    if (this._dir.lengthSq() > 0.001) {
      const pitch = Math.asin(THREE.MathUtils.clamp(this._dir.y, -0.99, 0.99));
      const yaw = Math.atan2(this._dir.x, -this._dir.z);

      const safePitch = THREE.MathUtils.clamp(pitch, -Math.PI * 0.48, Math.PI * 0.48);
      const safeYaw = THREE.MathUtils.clamp(yaw * sign, -Math.PI * 0.55, Math.PI * 0.65);

      this._targetQuat.setFromEuler(
        new THREE.Euler(-safePitch, sign * safeYaw, sign * 0.2, 'XYZ')
      );

      const baseUpper = this.baseQuats.get(upperArm);
      if (baseUpper) {
        upperArm.quaternion.slerp(baseUpper.clone().multiply(this._targetQuat), alpha);
      }
    }

    // Forearm direction relative to upper arm
    const fx = (wristPt.x - elbowPt.x) * 1.8;
    const fy = -(wristPt.y - elbowPt.y) * 1.8;
    const fz = (wristPt.z - elbowPt.z) * 1.5;

    this._v2.set(fx, fy, fz).normalize();
    if (this._v2.lengthSq() > 0.001) {
      const bendAngle = THREE.MathUtils.clamp(this._dir.angleTo(this._v2), 0.1, Math.PI * 0.88);

      this._targetQuat.setFromEuler(
        new THREE.Euler(-bendAngle * 0.9, 0, sign * bendAngle * 0.2, 'XYZ')
      );

      const baseFore = this.baseQuats.get(foreArm);
      if (baseFore) {
        foreArm.quaternion.slerp(baseFore.clone().multiply(this._targetQuat), alpha * 1.2);
      }
    }

    // Hand posture (Open palm repulsor vs Closed fist)
    if (hand) {
      let handFlexX = 0;
      let handFlexZ = 0;
      if (handState === 'OPEN_PALM') {
        handFlexX = 0.55; // Extended backwards (repulsor blast)
      } else if (handState === 'FIST') {
        handFlexX = -0.35; // Clenched inward
      } else if (handState === 'POINT') {
        handFlexX = 0.2;
        handFlexZ = sign * 0.15;
      }

      this._targetQuat.setFromEuler(new THREE.Euler(handFlexX, 0, handFlexZ, 'XYZ'));
      const baseHand = this.baseQuats.get(hand);
      if (baseHand) {
        hand.quaternion.slerp(baseHand.clone().multiply(this._targetQuat), alpha * 1.1);
      }
    }
  }

  /**
   * Solves 2-bone leg direction (Hip -> Knee -> Ankle)
   */
  private orientLegChain(
    upLeg: THREE.Bone,
    leg: THREE.Bone,
    hipPt: PoseLandmarkPoint,
    kneePt: PoseLandmarkPoint,
    anklePt: PoseLandmarkPoint,
    isRight: boolean,
    alpha: number
  ): void {
    const sign = isRight ? 1 : -1;

    // Thigh vector
    const tx = (kneePt.x - hipPt.x) * 1.5;
    const ty = -(kneePt.y - hipPt.y) * 1.5;
    const tz = (kneePt.z - hipPt.z) * 1.2;

    this._dir.set(tx, ty, tz).normalize();
    if (this._dir.lengthSq() > 0.001) {
      // High knee flexion (when knee Y rises closer to hip Y)
      const kneeElevation = Math.max(0, 0.4 - (kneePt.y - hipPt.y));
      const pitch = -kneeElevation * 1.5;

      this._targetQuat.setFromEuler(new THREE.Euler(pitch, sign * 0.1, sign * 0.1, 'XYZ'));
      const baseUp = this.baseQuats.get(upLeg);
      if (baseUp) {
        upLeg.quaternion.slerp(baseUp.clone().multiply(this._targetQuat), alpha * 0.8);
      }
    }

    // Shin vector / Knee bend
    const sx = (anklePt.x - kneePt.x) * 1.5;
    const sy = -(anklePt.y - kneePt.y) * 1.5;
    const sz = (anklePt.z - kneePt.z) * 1.2;

    this._v2.set(sx, sy, sz).normalize();
    if (this._v2.lengthSq() > 0.001) {
      const bend = THREE.MathUtils.clamp(this._dir.angleTo(this._v2), 0.05, Math.PI * 0.7);
      this._targetQuat.setFromEuler(new THREE.Euler(bend * 0.85, 0, 0, 'XYZ'));

      const baseLeg = this.baseQuats.get(leg);
      if (baseLeg) {
        leg.quaternion.slerp(baseLeg.clone().multiply(this._targetQuat), alpha * 0.8);
      }
    }
  }

  /**
   * Resets all modified bones to neutral bind pose
   */
  public resetToBindPose(): void {
    this.baseQuats.forEach((baseQuat, bone) => {
      bone.quaternion.copy(baseQuat);
    });
    if (this.bones.hips && this.baseHipsPos) {
      this.bones.hips.position.copy(this.baseHipsPos);
    }
  }
}

export const poseIKRetargeter = new PoseIKRetargeter();
