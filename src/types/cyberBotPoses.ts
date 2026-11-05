/**
 * Cybernetic Bot Poses and Limb Gestures Types
 * Defines full-body postures, hand gestures, leg stances, and kinematic joint matrices
 * for the Ultron Sentry / Cybernetic Android 3D model.
 */

export type BotFullPoseId =
  | 'DEFAULT_IDLE'
  | 'REPULSOR_BLAST'
  | 'SUPERHERO_LANDING'
  | 'LEVITATION_MATRIX'
  | 'SOVEREIGN_OVERLORD'
  | 'VIBRANIUM_HIGH_KICK'
  | 'KINETIC_SHIELD_BARRIER'
  | 'PLASMA_SNIPER_AIM'
  | 'IRON_WILL_CROSSED'
  | 'ASCENDED_POWER_SURGE'
  | 'STEALTH_INFILTRATOR'
  | 'IMPERIAL_ROBOTIC_SALUTE'
  | 'DUAL_BLASTER_BARRAGE'
  | 'CUSTOM_MANUAL';

export type BotHandGestureId =
  | 'CLENCHED_FIST'
  | 'OPEN_PALM_REPULSOR'
  | 'POINT_COMMAND'
  | 'VICTORY_V'
  | 'THUMBS_UP'
  | 'MENACING_CLAW'
  | 'FINGER_BLASTER'
  | 'RELAXED_NEUTRAL';

export type BotLegStanceId =
  | 'BIPEDAL_NEUTRAL'
  | 'TACTICAL_COMBAT_STANCE'
  | 'HEROIC_GROUND_IMPACT'
  | 'ANTI_GRAVITY_LEVITATION'
  | 'VIBRANIUM_HIGH_KICK'
  | 'TACTICAL_KNEELING'
  | 'MARTIAL_DEEP_LUNGE'
  | 'CROSS_LEGGED_HOVER';

export interface BoneEulerAngles {
  x: number;
  y: number;
  z: number;
}

export type JointRotationMap = Record<string, [number, number, number]>;

export interface BotPoseDefinition {
  id: BotFullPoseId;
  name: string;
  subtitle: string;
  category: 'COMBAT' | 'CINEMATIC' | 'TACTICAL' | 'SOVEREIGN';
  description: string;
  icon: string;
  audioAnnouncement: string;
  elevation: number; // Offset applied to Hips Y position
  handGestureLeft: BotHandGestureId;
  handGestureRight: BotHandGestureId;
  legStance: BotLegStanceId;
  rotations: JointRotationMap;
  cameraFocus?: 'head' | 'upper_body' | 'full_body' | 'legs';
}

export interface HandGestureDefinition {
  id: BotHandGestureId;
  name: string;
  subtitle: string;
  icon: string;
  description: string;
  audioAnnouncement: string;
  rotations: JointRotationMap; // Relative rotations applied to wrist & finger phalanges
}

export interface LegStanceDefinition {
  id: BotLegStanceId;
  name: string;
  subtitle: string;
  icon: string;
  description: string;
  elevation: number;
  rotations: JointRotationMap;
}

export interface ManualJointValues {
  // Left Arm & Hand
  leftShoulderPitch: number; // -180 to 180 deg
  leftShoulderRoll: number;  // -180 to 180 deg
  leftElbowBend: number;     // 0 to 160 deg
  leftWristPitch: number;    // -90 to 90 deg
  leftHandGesture: BotHandGestureId;

  // Right Arm & Hand
  rightShoulderPitch: number;
  rightShoulderRoll: number;
  rightElbowBend: number;
  rightWristPitch: number;
  rightHandGesture: BotHandGestureId;

  // Left Leg
  leftHipPitch: number;      // -90 to 120 deg
  leftHipRoll: number;       // -45 to 60 deg
  leftKneeBend: number;      // 0 to 160 deg
  leftAnklePitch: number;    // -60 to 60 deg

  // Right Leg
  rightHipPitch: number;
  rightHipRoll: number;
  rightKneeBend: number;
  rightAnklePitch: number;

  // Spine & Head
  spineTwist: number;        // -45 to 45 deg
  spinePitch: number;        // -45 to 45 deg
  headYaw: number;           // -80 to 80 deg
  headPitch: number;         // -60 to 60 deg

  // Overall Elevation
  elevation: number;         // -50 to +60
}

export type BotArmorSkin =
  | 'ULTRON_CRIMSON'
  | 'VIBRANIUM_CHROME'
  | 'OBSIDIAN_STEALTH'
  | 'SOLAR_TITAN_GOLD';
