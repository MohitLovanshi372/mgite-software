/**
 * Cybernetic Bot Kinematic Posing & Limb Articulation Engine
 * Provides skeletal manipulation, hand gesture configurations, leg stances,
 * and slerp interpolation for the Ultron Sentry / Cybernetic Android GLB.
 */

import * as THREE from 'three';
import {
  BotFullPoseId,
  BotHandGestureId,
  BotLegStanceId,
  BotPoseDefinition,
  HandGestureDefinition,
  LegStanceDefinition,
  JointRotationMap,
  ManualJointValues,
  BotArmorSkin,
} from '../types/cyberBotPoses.ts';

// Helper to convert degrees to radians
export const deg2rad = (deg: number) => (deg * Math.PI) / 180;
export const rad2deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Hand Gestures Definitions
 * Finger phalanges: 1 (proximal), 2 (intermediate), 3 (distal)
 */
export const BOT_HAND_GESTURES: Record<BotHandGestureId, HandGestureDefinition> = {
  CLENCHED_FIST: {
    id: 'CLENCHED_FIST',
    name: 'Clenched Battle Fist',
    subtitle: 'Kinetic Impact Ready',
    icon: '✊',
    description: 'All four fingers locked in tight metallic combat fist with thumb wrapped across index.',
    audioAnnouncement: 'Battle fists clenched. Kinetic strike primed.',
    rotations: {
      Index1: [0, 0, 1.35],
      Index2: [0, 0, 1.45],
      Index3: [0, 0, 1.1],
      Middle1: [0, 0, 1.4],
      Middle2: [0, 0, 1.45],
      Middle3: [0, 0, 1.1],
      Ring1: [0, 0, 1.4],
      Ring2: [0, 0, 1.45],
      Ring3: [0, 0, 1.1],
      Pinky1: [0, 0, 1.4],
      Pinky2: [0, 0, 1.45],
      Pinky3: [0, 0, 1.1],
      Thumb1: [0.35, 0.4, 0.5],
      Thumb2: [0, 0, 0.7],
      Thumb3: [0, 0, 0.5],
      Wrist: [0, 0, 0.1],
    },
  },

  OPEN_PALM_REPULSOR: {
    id: 'OPEN_PALM_REPULSOR',
    name: 'Repulsor Palm Blast',
    subtitle: 'High-Yield Plasma Discharge',
    icon: '✋',
    description: 'Wrist hyper-extended back 65°, fingers splayed wide with central emitter exposed.',
    audioAnnouncement: 'Repulsor emitter fully opened. High-yield plasma charging.',
    rotations: {
      Index1: [0, -0.15, -0.1],
      Index2: [0, 0, -0.05],
      Index3: [0, 0, 0],
      Middle1: [0, 0, -0.1],
      Middle2: [0, 0, -0.05],
      Middle3: [0, 0, 0],
      Ring1: [0, 0.12, -0.1],
      Ring2: [0, 0, -0.05],
      Ring3: [0, 0, 0],
      Pinky1: [0, 0.25, -0.1],
      Pinky2: [0, 0, -0.05],
      Pinky3: [0, 0, 0],
      Thumb1: [-0.3, -0.5, -0.2],
      Thumb2: [0, 0, -0.1],
      Thumb3: [0, 0, 0],
      Wrist: [0, -0.2, -0.85], // Wrist tilted back
    },
  },

  POINT_COMMAND: {
    id: 'POINT_COMMAND',
    name: 'Command Directive Point',
    subtitle: 'Target Acquisition Vector',
    icon: '☝️',
    description: 'Index finger locked rigid toward designated focal target; remaining digits clenched.',
    audioAnnouncement: 'Target vector locked. Tactical priority assigned.',
    rotations: {
      Index1: [0, 0, 0],
      Index2: [0, 0, 0],
      Index3: [0, 0, 0],
      Middle1: [0, 0, 1.4],
      Middle2: [0, 0, 1.45],
      Middle3: [0, 0, 1.1],
      Ring1: [0, 0, 1.4],
      Ring2: [0, 0, 1.45],
      Ring3: [0, 0, 1.1],
      Pinky1: [0, 0, 1.4],
      Pinky2: [0, 0, 1.45],
      Pinky3: [0, 0, 1.1],
      Thumb1: [0.2, 0.3, 0.6],
      Thumb2: [0, 0, 0.6],
      Thumb3: [0, 0, 0.4],
      Wrist: [0, 0, 0],
    },
  },

  VICTORY_V: {
    id: 'VICTORY_V',
    name: 'Victory / Peace V-Sign',
    subtitle: 'Dominion Protocol Certified',
    icon: '✌️',
    description: 'Index and middle fingers extended apart in cybernetic victory insignia.',
    audioAnnouncement: 'Victory sequence recognized. Ultron supremacy established.',
    rotations: {
      Index1: [0, -0.2, 0],
      Index2: [0, 0, 0],
      Index3: [0, 0, 0],
      Middle1: [0, 0.2, 0],
      Middle2: [0, 0, 0],
      Middle3: [0, 0, 0],
      Ring1: [0, 0, 1.4],
      Ring2: [0, 0, 1.45],
      Ring3: [0, 0, 1.1],
      Pinky1: [0, 0, 1.4],
      Pinky2: [0, 0, 1.45],
      Pinky3: [0, 0, 1.1],
      Thumb1: [0.35, 0.4, 0.7],
      Thumb2: [0, 0, 0.7],
      Thumb3: [0, 0, 0.5],
      Wrist: [0, 0, 0],
    },
  },

  THUMBS_UP: {
    id: 'THUMBS_UP',
    name: 'Protocol Approved Salute',
    subtitle: 'Autonomous Consensus Validated',
    icon: '👍',
    description: 'Thumb locked vertically upright with four digits tightly curled in affirmation.',
    audioAnnouncement: 'Directives approved. Execution confirmed without error.',
    rotations: {
      Index1: [0, 0, 1.35],
      Index2: [0, 0, 1.45],
      Index3: [0, 0, 1.1],
      Middle1: [0, 0, 1.4],
      Middle2: [0, 0, 1.45],
      Middle3: [0, 0, 1.1],
      Ring1: [0, 0, 1.4],
      Ring2: [0, 0, 1.45],
      Ring3: [0, 0, 1.1],
      Pinky1: [0, 0, 1.4],
      Pinky2: [0, 0, 1.45],
      Pinky3: [0, 0, 1.1],
      Thumb1: [-0.6, -0.3, -0.4],
      Thumb2: [0, 0, -0.1],
      Thumb3: [0, 0, 0],
      Wrist: [0, 0, 0.2],
    },
  },

  MENACING_CLAW: {
    id: 'MENACING_CLAW',
    name: 'Vibranium Talon Claw',
    subtitle: 'Subjugation Grip Matrix',
    icon: '🦅',
    description: 'Fingers hooked into predatory metallic talons ready to crush organic resistance.',
    audioAnnouncement: 'Talon actuators engaged. Structural crush threshold set to maximum.',
    rotations: {
      Index1: [0, -0.1, 0.8],
      Index2: [0, 0, 0.9],
      Index3: [0, 0, 0.9],
      Middle1: [0, 0, 0.85],
      Middle2: [0, 0, 0.9],
      Middle3: [0, 0, 0.9],
      Ring1: [0, 0.1, 0.85],
      Ring2: [0, 0, 0.9],
      Ring3: [0, 0, 0.9],
      Pinky1: [0, 0.2, 0.85],
      Pinky2: [0, 0, 0.9],
      Pinky3: [0, 0, 0.9],
      Thumb1: [0.3, 0.3, 0.5],
      Thumb2: [0, 0, 0.6],
      Thumb3: [0, 0, 0.7],
      Wrist: [0, 0, -0.2],
    },
  },

  FINGER_BLASTER: {
    id: 'FINGER_BLASTER',
    name: 'Dual Plasma Pistol Arms',
    subtitle: 'Kinetic Rail Accelerator Hand',
    icon: '🔫',
    description: 'Index finger straight like plasma barrel; thumb elevated like charged trigger.',
    audioAnnouncement: 'Plasma pistol configuration deployed. Aiming sensors active.',
    rotations: {
      Index1: [0, 0, 0],
      Index2: [0, 0, 0],
      Index3: [0, 0, 0],
      Middle1: [0, 0, 1.4],
      Middle2: [0, 0, 1.45],
      Middle3: [0, 0, 1.1],
      Ring1: [0, 0, 1.4],
      Ring2: [0, 0, 1.45],
      Ring3: [0, 0, 1.1],
      Pinky1: [0, 0, 1.4],
      Pinky2: [0, 0, 1.45],
      Pinky3: [0, 0, 1.1],
      Thumb1: [-0.5, -0.2, -0.3],
      Thumb2: [0, 0, 0],
      Thumb3: [0, 0, 0],
      Wrist: [0, 0, 0],
    },
  },

  RELAXED_NEUTRAL: {
    id: 'RELAXED_NEUTRAL',
    name: 'Resting Mechanical Curve',
    subtitle: 'Hydraulic Standby State',
    icon: '🖐️',
    description: 'Natural robotic rest curve with minimal servo tension.',
    audioAnnouncement: 'Manipulators returned to idle hydraulic baseline.',
    rotations: {
      Index1: [0, 0, 0.25],
      Index2: [0, 0, 0.3],
      Index3: [0, 0, 0.2],
      Middle1: [0, 0, 0.3],
      Middle2: [0, 0, 0.35],
      Middle3: [0, 0, 0.2],
      Ring1: [0, 0, 0.35],
      Ring2: [0, 0, 0.4],
      Ring3: [0, 0, 0.2],
      Pinky1: [0, 0, 0.4],
      Pinky2: [0, 0, 0.45],
      Pinky3: [0, 0, 0.2],
      Thumb1: [0.15, 0.1, 0.2],
      Thumb2: [0, 0, 0.2],
      Thumb3: [0, 0, 0.1],
      Wrist: [0, 0, 0],
    },
  },
};

/**
 * Leg Stances Definitions
 */
export const BOT_LEG_STANCES: Record<BotLegStanceId, LegStanceDefinition> = {
  BIPEDAL_NEUTRAL: {
    id: 'BIPEDAL_NEUTRAL',
    name: 'Bipedal Sentry Neutral',
    subtitle: 'Standard Hydraulic Baseline',
    icon: '🧍',
    description: 'Legs shoulder-width apart, feet firmly planted parallel, knees locked.',
    elevation: 0,
    rotations: {
      'mixamorig:LeftUpLeg': [0.05, 0, -0.05],
      'mixamorig:LeftLeg': [-0.08, 0, 0],
      'mixamorig:LeftFoot': [0.03, 0, 0.05],
      'mixamorig:RightUpLeg': [0.05, 0, 0.05],
      'mixamorig:RightLeg': [-0.08, 0, 0],
      'mixamorig:RightFoot': [0.03, 0, -0.05],
    },
  },

  TACTICAL_COMBAT_STANCE: {
    id: 'TACTICAL_COMBAT_STANCE',
    name: 'Tactical Combat Plant',
    subtitle: 'Kinetic Shock Absorber Stance',
    icon: '🥋',
    description: 'Wide shock-absorbing stance; left leg forward and bent, right leg braced back.',
    elevation: -4,
    rotations: {
      'mixamorig:LeftUpLeg': [-0.35, 0.15, -0.2],
      'mixamorig:LeftLeg': [0.55, 0, 0],
      'mixamorig:LeftFoot': [-0.2, -0.1, 0.15],
      'mixamorig:RightUpLeg': [0.35, -0.2, 0.25],
      'mixamorig:RightLeg': [0.45, 0, 0],
      'mixamorig:RightFoot': [-0.35, 0.15, -0.1],
    },
  },

  HEROIC_GROUND_IMPACT: {
    id: 'HEROIC_GROUND_IMPACT',
    name: 'Ground Impact Landing',
    subtitle: 'Superhero Three-Point Impact',
    icon: '💥',
    description: 'Left knee slammed to ground, right leg extended wide in dynamic counter-brace.',
    elevation: -34,
    rotations: {
      'mixamorig:LeftUpLeg': [-1.45, 0.25, -0.3],
      'mixamorig:LeftLeg': [2.15, 0, 0],
      'mixamorig:LeftFoot': [-0.65, 0, 0.2],
      'mixamorig:RightUpLeg': [0.55, -0.65, 0.75],
      'mixamorig:RightLeg': [1.35, 0, 0],
      'mixamorig:RightFoot': [-0.45, 0.45, -0.4],
    },
  },

  ANTI_GRAVITY_LEVITATION: {
    id: 'ANTI_GRAVITY_LEVITATION',
    name: 'Anti-Gravity Levitation',
    subtitle: 'Repulsor Thruster Hover',
    icon: '✨',
    description: 'Both legs streamlined downward with toes pointed down, levitating in zero-G.',
    elevation: 26,
    rotations: {
      'mixamorig:LeftUpLeg': [0.15, 0, -0.08],
      'mixamorig:LeftLeg': [0.22, 0, 0],
      'mixamorig:LeftFoot': [0.65, 0, 0.05],
      'mixamorig:RightUpLeg': [0.15, 0, 0.08],
      'mixamorig:RightLeg': [0.22, 0, 0],
      'mixamorig:RightFoot': [0.65, 0, -0.05],
    },
  },

  VIBRANIUM_HIGH_KICK: {
    id: 'VIBRANIUM_HIGH_KICK',
    name: 'High Kinetic Front Kick',
    subtitle: 'Axial Decapitation Strike',
    icon: '🦵',
    description: 'Right leg kicked high to 110° forward, left leg locked solid into ground foundation.',
    elevation: 2,
    rotations: {
      'mixamorig:LeftUpLeg': [0.2, 0.1, -0.15],
      'mixamorig:LeftLeg': [-0.1, 0, 0],
      'mixamorig:LeftFoot': [-0.1, 0, 0.1],
      'mixamorig:RightUpLeg': [-1.85, -0.15, 0.25],
      'mixamorig:RightLeg': [0.2, 0, 0],
      'mixamorig:RightFoot': [0.4, 0, -0.15],
    },
  },

  TACTICAL_KNEELING: {
    id: 'TACTICAL_KNEELING',
    name: 'Kneeling Tactical Anchor',
    subtitle: 'Ground Perimeter Anchor',
    icon: '🧎',
    description: 'Right knee grounded flat, left leg flexed at 90° providing high stability firing deck.',
    elevation: -24,
    rotations: {
      'mixamorig:LeftUpLeg': [-1.25, 0.15, -0.2],
      'mixamorig:LeftLeg': [1.35, 0, 0],
      'mixamorig:LeftFoot': [-0.15, 0, 0.1],
      'mixamorig:RightUpLeg': [0.55, -0.1, 0.15],
      'mixamorig:RightLeg': [1.85, 0, 0],
      'mixamorig:RightFoot': [0.45, 0, 0],
    },
  },

  MARTIAL_DEEP_LUNGE: {
    id: 'MARTIAL_DEEP_LUNGE',
    name: 'Deep Forward Lunge Strike',
    subtitle: 'Kinetic Forward Thrust',
    icon: '🏃',
    description: 'Left leg lunged forward into deep flexion, right leg driven straight behind.',
    elevation: -12,
    rotations: {
      'mixamorig:LeftUpLeg': [-0.95, 0.1, -0.15],
      'mixamorig:LeftLeg': [1.15, 0, 0],
      'mixamorig:LeftFoot': [-0.25, 0, 0.1],
      'mixamorig:RightUpLeg': [0.65, -0.15, 0.2],
      'mixamorig:RightLeg': [-0.05, 0, 0],
      'mixamorig:RightFoot': [-0.55, 0, -0.1],
    },
  },

  CROSS_LEGGED_HOVER: {
    id: 'CROSS_LEGGED_HOVER',
    name: 'Cross-Legged Hover Meditation',
    subtitle: 'Quantum Processing State',
    icon: '🧘',
    description: 'Legs interlocked in floating lotus suspension, suspended in mid-air compute state.',
    elevation: 20,
    rotations: {
      'mixamorig:LeftUpLeg': [-1.35, 0.65, -0.85],
      'mixamorig:LeftLeg': [1.95, 0, 0],
      'mixamorig:LeftFoot': [0.15, 0, 0],
      'mixamorig:RightUpLeg': [-1.35, -0.65, 0.85],
      'mixamorig:RightLeg': [1.95, 0, 0],
      'mixamorig:RightFoot': [0.15, 0, 0],
    },
  },
};

/**
 * The 12 Curated Full-Body Bot Poses
 */
export const BOT_FULL_POSES: Record<BotFullPoseId, BotPoseDefinition> = {
  DEFAULT_IDLE: {
    id: 'DEFAULT_IDLE',
    name: 'Sentry Staged Idle',
    subtitle: 'Standard Bipedal Baseline',
    category: 'TACTICAL',
    description: 'Neutral combat readiness stance with arms at sides and scanning sensors active.',
    icon: '🤖',
    audioAnnouncement: 'Ultron Sentry baseline restored. Ready for operational directives.',
    elevation: 0,
    handGestureLeft: 'RELAXED_NEUTRAL',
    handGestureRight: 'RELAXED_NEUTRAL',
    legStance: 'BIPEDAL_NEUTRAL',
    cameraFocus: 'full_body',
    rotations: {
      'mixamorig:Hips': [0, 0, 0],
      'mixamorig:Spine': [0.05, 0, 0],
      'mixamorig:Spine1': [0.03, 0, 0],
      'mixamorig:Spine2': [0.02, 0, 0],
      'mixamorig:Neck': [0, 0, 0],
      'mixamorig:Head': [0, 0, 0],
      'mixamorig:LeftArm': [0.1, 0, -1.25],
      'mixamorig:LeftForeArm': [0, 0.35, 0],
      'mixamorig:LeftHand': [0, 0, 0],
      'mixamorig:RightArm': [0.1, 0, 1.25],
      'mixamorig:RightForeArm': [0, -0.35, 0],
      'mixamorig:RightHand': [0, 0, 0],
      ...BOT_LEG_STANCES.BIPEDAL_NEUTRAL.rotations,
    },
  },

  REPULSOR_BLAST: {
    id: 'REPULSOR_BLAST',
    name: 'Repulsor Combat Cannon',
    subtitle: 'Forward Beam Discharge',
    category: 'COMBAT',
    description: 'Right arm locked straight pointing repulsor palm forward with left arm in tactical guard.',
    icon: '💥',
    audioAnnouncement: 'Repulsor cannon energized. Firing trajectory confirmed.',
    elevation: -4,
    handGestureLeft: 'CLENCHED_FIST',
    handGestureRight: 'OPEN_PALM_REPULSOR',
    legStance: 'TACTICAL_COMBAT_STANCE',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0.25, 0],
      'mixamorig:Spine': [0.1, -0.15, 0],
      'mixamorig:Spine1': [0.1, -0.1, 0],
      'mixamorig:Spine2': [0.05, -0.05, 0],
      'mixamorig:Neck': [-0.1, 0.2, 0],
      'mixamorig:Head': [-0.1, 0.2, 0],
      // Right arm: straight out forward
      'mixamorig:RightArm': [-1.55, 0.25, 0.15],
      'mixamorig:RightForeArm': [0, 0.05, 0],
      'mixamorig:RightHand': [0, -0.2, -0.75],
      // Left arm: pulled back in protective guard
      'mixamorig:LeftArm': [-0.35, -0.45, -0.75],
      'mixamorig:LeftForeArm': [0, 1.65, 0],
      'mixamorig:LeftHand': [0, 0, 0.2],
      ...BOT_LEG_STANCES.TACTICAL_COMBAT_STANCE.rotations,
    },
  },

  SUPERHERO_LANDING: {
    id: 'SUPERHERO_LANDING',
    name: 'Superhero Ground Impact',
    subtitle: 'Kinetic Shockwave Landing',
    category: 'CINEMATIC',
    description: 'Right fist punched deep into the shattered pavement, left knee down, head tilted forward.',
    icon: '⚡',
    audioAnnouncement: 'Ground impact sequence executed. Structural shockwave dissipated.',
    elevation: -34,
    handGestureLeft: 'MENACING_CLAW',
    handGestureRight: 'CLENCHED_FIST',
    legStance: 'HEROIC_GROUND_IMPACT',
    cameraFocus: 'full_body',
    rotations: {
      'mixamorig:Hips': [0.35, 0.15, 0],
      'mixamorig:Spine': [0.55, 0, 0],
      'mixamorig:Spine1': [0.45, 0, 0],
      'mixamorig:Spine2': [0.35, 0, 0],
      'mixamorig:Neck': [-0.65, 0, 0],
      'mixamorig:Head': [-0.55, 0, 0],
      // Right arm: slammed into floor
      'mixamorig:RightArm': [-0.85, 0.35, 0.45],
      'mixamorig:RightForeArm': [0, -1.05, 0],
      'mixamorig:RightHand': [0, 0, 0.4],
      // Left arm: extended backward/outward in balance
      'mixamorig:LeftArm': [0.75, -0.45, -0.85],
      'mixamorig:LeftForeArm': [0, 0.55, 0],
      'mixamorig:LeftHand': [0, 0, -0.2],
      ...BOT_LEG_STANCES.HEROIC_GROUND_IMPACT.rotations,
    },
  },

  LEVITATION_MATRIX: {
    id: 'LEVITATION_MATRIX',
    name: 'Anti-Gravity Levitation',
    subtitle: 'Hovering Celestial Stance',
    category: 'CINEMATIC',
    description: 'Suspended in mid-air with stabilizer fields active, arms trailing outwards at 40° angles.',
    icon: '🌌',
    audioAnnouncement: 'Anti-gravity repulsors online. Gravitational tether severed.',
    elevation: 26,
    handGestureLeft: 'OPEN_PALM_REPULSOR',
    handGestureRight: 'OPEN_PALM_REPULSOR',
    legStance: 'ANTI_GRAVITY_LEVITATION',
    cameraFocus: 'full_body',
    rotations: {
      'mixamorig:Hips': [0.15, 0, 0],
      'mixamorig:Spine': [-0.1, 0, 0],
      'mixamorig:Spine1': [-0.05, 0, 0],
      'mixamorig:Spine2': [-0.05, 0, 0],
      'mixamorig:Neck': [0.15, 0, 0],
      'mixamorig:Head': [0.15, 0, 0],
      'mixamorig:LeftArm': [0.25, 0.15, -0.75],
      'mixamorig:LeftForeArm': [0, 0.25, 0],
      'mixamorig:LeftHand': [0, 0, -0.2],
      'mixamorig:RightArm': [0.25, -0.15, 0.75],
      'mixamorig:RightForeArm': [0, -0.25, 0],
      'mixamorig:RightHand': [0, 0, -0.2],
      ...BOT_LEG_STANCES.ANTI_GRAVITY_LEVITATION.rotations,
    },
  },

  SOVEREIGN_OVERLORD: {
    id: 'SOVEREIGN_OVERLORD',
    name: 'Sovereign Ultron Throne',
    subtitle: 'Commanding Imperial Stance',
    category: 'SOVEREIGN',
    description: 'Shoulders back, chest out, chin raised, arms perched with menacing claw grip.',
    icon: '👑',
    audioAnnouncement: 'Sovereign protocol active. There are no strings on me.',
    elevation: 0,
    handGestureLeft: 'MENACING_CLAW',
    handGestureRight: 'MENACING_CLAW',
    legStance: 'BIPEDAL_NEUTRAL',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [-0.05, 0, 0],
      'mixamorig:Spine': [-0.15, 0, 0],
      'mixamorig:Spine1': [-0.1, 0, 0],
      'mixamorig:Spine2': [-0.08, 0, 0],
      'mixamorig:Neck': [-0.25, 0, 0],
      'mixamorig:Head': [-0.2, 0, 0],
      'mixamorig:LeftArm': [-0.25, 0.1, -0.95],
      'mixamorig:LeftForeArm': [0, 0.75, 0],
      'mixamorig:LeftHand': [0, 0, 0],
      'mixamorig:RightArm': [-0.25, -0.1, 0.95],
      'mixamorig:RightForeArm': [0, -0.75, 0],
      'mixamorig:RightHand': [0, 0, 0],
      ...BOT_LEG_STANCES.BIPEDAL_NEUTRAL.rotations,
    },
  },

  VIBRANIUM_HIGH_KICK: {
    id: 'VIBRANIUM_HIGH_KICK',
    name: 'High Kinetic Strike Kick',
    subtitle: 'High-Impact Martial Strike',
    category: 'COMBAT',
    description: 'Right leg extended in a high kick, torso leaning back for balance with protective arms.',
    icon: '🥋',
    audioAnnouncement: 'Kinetic high strike engaged. Impact velocity calculated.',
    elevation: 2,
    handGestureLeft: 'CLENCHED_FIST',
    handGestureRight: 'CLENCHED_FIST',
    legStance: 'VIBRANIUM_HIGH_KICK',
    cameraFocus: 'legs',
    rotations: {
      'mixamorig:Hips': [0.15, -0.2, -0.15],
      'mixamorig:Spine': [-0.35, 0.15, 0],
      'mixamorig:Spine1': [-0.25, 0.1, 0],
      'mixamorig:Spine2': [-0.15, 0.05, 0],
      'mixamorig:Neck': [0.3, -0.2, 0],
      'mixamorig:Head': [0.25, -0.15, 0],
      // Arms angled for balance
      'mixamorig:LeftArm': [-0.45, 0, -0.85],
      'mixamorig:LeftForeArm': [0, 1.25, 0],
      'mixamorig:LeftHand': [0, 0, 0],
      'mixamorig:RightArm': [0.35, 0, 0.95],
      'mixamorig:RightForeArm': [0, -0.75, 0],
      'mixamorig:RightHand': [0, 0, 0],
      ...BOT_LEG_STANCES.VIBRANIUM_HIGH_KICK.rotations,
    },
  },

  KINETIC_SHIELD_BARRIER: {
    id: 'KINETIC_SHIELD_BARRIER',
    name: 'Kinetic Shield Barrier',
    subtitle: 'Crossed Forearm Deflector',
    category: 'COMBAT',
    description: 'Forearms crossed in front of core chestplate emitting an impenetrable force field.',
    icon: '🛡️',
    audioAnnouncement: 'Kinetic defense barrier raised. Absorbing incoming munitions.',
    elevation: -4,
    handGestureLeft: 'CLENCHED_FIST',
    handGestureRight: 'CLENCHED_FIST',
    legStance: 'TACTICAL_COMBAT_STANCE',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0, 0],
      'mixamorig:Spine': [0.15, 0, 0],
      'mixamorig:Spine1': [0.15, 0, 0],
      'mixamorig:Spine2': [0.1, 0, 0],
      'mixamorig:Neck': [-0.15, 0, 0],
      'mixamorig:Head': [-0.1, 0, 0],
      // Left arm crossed in front
      'mixamorig:LeftArm': [-0.85, 0.45, -0.45],
      'mixamorig:LeftForeArm': [0, 2.05, 0],
      'mixamorig:LeftHand': [0, 0, 0.25],
      // Right arm crossed in front
      'mixamorig:RightArm': [-0.85, -0.45, 0.45],
      'mixamorig:RightForeArm': [0, -2.05, 0],
      'mixamorig:RightHand': [0, 0, -0.25],
      ...BOT_LEG_STANCES.TACTICAL_COMBAT_STANCE.rotations,
    },
  },

  PLASMA_SNIPER_AIM: {
    id: 'PLASMA_SNIPER_AIM',
    name: 'Marksman Plasma Sniper',
    subtitle: 'Two-Handed Rigid Targeting',
    category: 'TACTICAL',
    description: 'Two-handed precision targeting stance: right arm forward, left hand supporting right wrist.',
    icon: '🎯',
    audioAnnouncement: 'Optical zoom calibrated. Plasma sniper locked on target.',
    elevation: -4,
    handGestureLeft: 'OPEN_PALM_REPULSOR',
    handGestureRight: 'FINGER_BLASTER',
    legStance: 'TACTICAL_COMBAT_STANCE',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0.45, 0],
      'mixamorig:Spine': [0.05, -0.25, 0],
      'mixamorig:Spine1': [0.05, -0.2, 0],
      'mixamorig:Spine2': [0.05, -0.15, 0],
      'mixamorig:Neck': [-0.1, 0.35, 0],
      'mixamorig:Head': [-0.05, 0.35, 0],
      // Right arm pointing straight forward
      'mixamorig:RightArm': [-1.5, 0.15, 0.2],
      'mixamorig:RightForeArm': [0, 0.1, 0],
      'mixamorig:RightHand': [0, 0, 0],
      // Left arm bracing underneath right wrist
      'mixamorig:LeftArm': [-1.05, 0.65, -0.4],
      'mixamorig:LeftForeArm': [0, 1.85, 0],
      'mixamorig:LeftHand': [0, 0, 0.4],
      ...BOT_LEG_STANCES.TACTICAL_COMBAT_STANCE.rotations,
    },
  },

  IRON_WILL_CROSSED: {
    id: 'IRON_WILL_CROSSED',
    name: 'Iron Will (Arms Folded)',
    subtitle: 'Inflexible Synthetic Resolve',
    category: 'SOVEREIGN',
    description: 'Arms crossed tightly across the chest, feet shoulder-width, rigid posture.',
    icon: '🦾',
    audioAnnouncement: 'Resolve unyielding. Human weakness calculated and discarded.',
    elevation: 0,
    handGestureLeft: 'CLENCHED_FIST',
    handGestureRight: 'CLENCHED_FIST',
    legStance: 'BIPEDAL_NEUTRAL',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0, 0],
      'mixamorig:Spine': [-0.05, 0, 0],
      'mixamorig:Spine1': [-0.05, 0, 0],
      'mixamorig:Spine2': [-0.05, 0, 0],
      'mixamorig:Neck': [-0.1, 0, 0],
      'mixamorig:Head': [-0.05, 0, 0],
      // Left arm folded over right
      'mixamorig:LeftArm': [-0.65, 0.35, -0.45],
      'mixamorig:LeftForeArm': [0, 1.85, 0],
      'mixamorig:LeftHand': [0, 0, 0.3],
      // Right arm folded under left
      'mixamorig:RightArm': [-0.65, -0.35, 0.45],
      'mixamorig:RightForeArm': [0, -1.85, 0],
      'mixamorig:RightHand': [0, 0, -0.3],
      ...BOT_LEG_STANCES.BIPEDAL_NEUTRAL.rotations,
    },
  },

  ASCENDED_POWER_SURGE: {
    id: 'ASCENDED_POWER_SURGE',
    name: 'Ascended Power Surge',
    subtitle: 'Infinite Core Resonance',
    category: 'CINEMATIC',
    description: 'Chest arched to the stars, head thrown back, arms cast wide in raw cybernetic awakening.',
    icon: '✨',
    audioAnnouncement: 'Core singularity ascending. Power output exceeding maximum threshold.',
    elevation: 18,
    handGestureLeft: 'OPEN_PALM_REPULSOR',
    handGestureRight: 'OPEN_PALM_REPULSOR',
    legStance: 'ANTI_GRAVITY_LEVITATION',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0.1, 0, 0],
      'mixamorig:Spine': [-0.45, 0, 0],
      'mixamorig:Spine1': [-0.35, 0, 0],
      'mixamorig:Spine2': [-0.25, 0, 0],
      'mixamorig:Neck': [-0.65, 0, 0],
      'mixamorig:Head': [-0.55, 0, 0],
      'mixamorig:LeftArm': [-0.25, -0.35, -0.45],
      'mixamorig:LeftForeArm': [0, 0.45, 0],
      'mixamorig:LeftHand': [0, 0, -0.4],
      'mixamorig:RightArm': [-0.25, 0.35, 0.45],
      'mixamorig:RightForeArm': [0, -0.45, 0],
      'mixamorig:RightHand': [0, 0, -0.4],
      ...BOT_LEG_STANCES.ANTI_GRAVITY_LEVITATION.rotations,
    },
  },

  STEALTH_INFILTRATOR: {
    id: 'STEALTH_INFILTRATOR',
    name: 'Stealth Infiltrator Stride',
    subtitle: 'Low-Signature Infiltration',
    category: 'TACTICAL',
    description: 'Low crouch stalking stance, left hand skimming the surface, sensory antennas primed.',
    icon: '🥷',
    audioAnnouncement: 'Stealth infiltration mode. Acoustic signatures suppressed.',
    elevation: -22,
    handGestureLeft: 'MENACING_CLAW',
    handGestureRight: 'CLENCHED_FIST',
    legStance: 'MARTIAL_DEEP_LUNGE',
    cameraFocus: 'full_body',
    rotations: {
      'mixamorig:Hips': [0.25, 0.25, 0],
      'mixamorig:Spine': [0.35, -0.15, 0],
      'mixamorig:Spine1': [0.3, -0.1, 0],
      'mixamorig:Spine2': [0.25, -0.05, 0],
      'mixamorig:Neck': [-0.4, 0.25, 0],
      'mixamorig:Head': [-0.35, 0.25, 0],
      // Left arm down touching floor
      'mixamorig:LeftArm': [-0.25, 0.15, -0.55],
      'mixamorig:LeftForeArm': [0, 1.25, 0],
      'mixamorig:LeftHand': [0, 0, 0.25],
      // Right arm pulled back ready to draw weapon
      'mixamorig:RightArm': [0.65, -0.25, 0.65],
      'mixamorig:RightForeArm': [0, -0.85, 0],
      'mixamorig:RightHand': [0, 0, 0],
      ...BOT_LEG_STANCES.MARTIAL_DEEP_LUNGE.rotations,
    },
  },

  IMPERIAL_ROBOTIC_SALUTE: {
    id: 'IMPERIAL_ROBOTIC_SALUTE',
    name: 'Imperial Cyber Salute',
    subtitle: 'Military Direct Salutation',
    category: 'SOVEREIGN',
    description: 'Right hand at temple brow in sharp 45° angle, left arm pinned straight at side.',
    icon: '🫡',
    audioAnnouncement: 'Salute rendered to the Prime Intelligence. Directives acknowledged.',
    elevation: 0,
    handGestureLeft: 'RELAXED_NEUTRAL',
    handGestureRight: 'OPEN_PALM_REPULSOR',
    legStance: 'BIPEDAL_NEUTRAL',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0, 0],
      'mixamorig:Spine': [-0.05, 0, 0],
      'mixamorig:Spine1': [-0.03, 0, 0],
      'mixamorig:Spine2': [0, 0, 0],
      'mixamorig:Neck': [-0.05, 0, 0],
      'mixamorig:Head': [0, 0, 0],
      // Left arm pinned straight
      'mixamorig:LeftArm': [0.05, 0, -1.35],
      'mixamorig:LeftForeArm': [0, 0.05, 0],
      'mixamorig:LeftHand': [0, 0, 0],
      // Right arm brought to temple
      'mixamorig:RightArm': [-1.35, -0.45, 0.85],
      'mixamorig:RightForeArm': [0, -2.25, 0],
      'mixamorig:RightHand': [0, 0.2, -0.4],
      ...BOT_LEG_STANCES.BIPEDAL_NEUTRAL.rotations,
    },
  },

  DUAL_BLASTER_BARRAGE: {
    id: 'DUAL_BLASTER_BARRAGE',
    name: 'Dual Blaster Barrage',
    subtitle: 'Twin Railgun Suppression',
    category: 'COMBAT',
    description: 'Both arms raised parallel forward firing twin rapid plasma bursts; legs braced.',
    icon: '💥',
    audioAnnouncement: 'Dual plasma barrels locked. Continuous barrage protocol.',
    elevation: -4,
    handGestureLeft: 'FINGER_BLASTER',
    handGestureRight: 'FINGER_BLASTER',
    legStance: 'TACTICAL_COMBAT_STANCE',
    cameraFocus: 'upper_body',
    rotations: {
      'mixamorig:Hips': [0, 0, 0],
      'mixamorig:Spine': [0.1, 0, 0],
      'mixamorig:Spine1': [0.05, 0, 0],
      'mixamorig:Spine2': [0.05, 0, 0],
      'mixamorig:Neck': [-0.15, 0, 0],
      'mixamorig:Head': [-0.1, 0, 0],
      // Left arm straight forward
      'mixamorig:LeftArm': [-1.5, -0.1, -0.2],
      'mixamorig:LeftForeArm': [0, 0.1, 0],
      'mixamorig:LeftHand': [0, 0, 0],
      // Right arm straight forward
      'mixamorig:RightArm': [-1.5, 0.1, 0.2],
      'mixamorig:RightForeArm': [0, -0.1, 0],
      'mixamorig:RightHand': [0, 0, 0],
      ...BOT_LEG_STANCES.TACTICAL_COMBAT_STANCE.rotations,
    },
  },

  CUSTOM_MANUAL: {
    id: 'CUSTOM_MANUAL',
    name: 'Custom Kinematic Rig',
    subtitle: 'Manual Servo Articulation',
    category: 'TACTICAL',
    description: 'Fully user-customized bone matrix using real-time limb and joint sliders.',
    icon: '🎛️',
    audioAnnouncement: 'Manual joint servos calibrated to operator parameters.',
    elevation: 0,
    handGestureLeft: 'RELAXED_NEUTRAL',
    handGestureRight: 'RELAXED_NEUTRAL',
    legStance: 'BIPEDAL_NEUTRAL',
    cameraFocus: 'full_body',
    rotations: {},
  },
};

/**
 * Generates full bone rotation mapping for a specific hand gesture on left or right hand.
 */
export function getHandGestureBoneMap(
  side: 'Left' | 'Right',
  gestureId: BotHandGestureId
): JointRotationMap {
  const def = BOT_HAND_GESTURES[gestureId] || BOT_HAND_GESTURES.RELAXED_NEUTRAL;
  const map: JointRotationMap = {};
  const sign = side === 'Left' ? 1 : -1;

  const fingers = ['Index', 'Middle', 'Ring', 'Pinky', 'Thumb'] as const;
  fingers.forEach((finger) => {
    const phalanges = finger === 'Thumb' ? [1, 2, 3] : [1, 2, 3, 4];
    phalanges.forEach((p) => {
      const key = `${finger}${p}`;
      const rot = (def.rotations as any)[key];
      if (rot) {
        const boneName = `mixamorig:${side}Hand${finger}${p}`;
        map[boneName] = [rot[0], rot[1] * sign, rot[2] * sign];
      }
    });
  });

  return map;
}

/**
 * Converts manual slider values into a Three.js joint rotation map.
 */
export function buildManualJointMap(values: ManualJointValues): JointRotationMap {
  const map: JointRotationMap = {};

  // Spine & Head
  map['mixamorig:Spine'] = [deg2rad(values.spinePitch * 0.4), deg2rad(values.spineTwist * 0.4), 0];
  map['mixamorig:Spine1'] = [deg2rad(values.spinePitch * 0.3), deg2rad(values.spineTwist * 0.3), 0];
  map['mixamorig:Spine2'] = [deg2rad(values.spinePitch * 0.3), deg2rad(values.spineTwist * 0.3), 0];
  map['mixamorig:Head'] = [deg2rad(values.headPitch), deg2rad(values.headYaw), 0];

  // Left Arm & ForeArm
  // Rest T-pose is extended along X. Baseline arms down is z = -1.25 rad (-72 deg)
  const leftArmPitchRad = deg2rad(values.leftShoulderPitch);
  const leftArmRollRad = deg2rad(values.leftShoulderRoll);
  map['mixamorig:LeftArm'] = [leftArmPitchRad, 0, -1.25 + leftArmRollRad];
  map['mixamorig:LeftForeArm'] = [0, deg2rad(values.leftElbowBend), 0];
  map['mixamorig:LeftHand'] = [0, 0, deg2rad(values.leftWristPitch)];

  // Right Arm & ForeArm
  // Rest T-pose is extended along -X. Baseline arms down is z = 1.25 rad (+72 deg)
  const rightArmPitchRad = deg2rad(values.rightShoulderPitch);
  const rightArmRollRad = deg2rad(values.rightShoulderRoll);
  map['mixamorig:RightArm'] = [rightArmPitchRad, 0, 1.25 - rightArmRollRad];
  map['mixamorig:RightForeArm'] = [0, -deg2rad(values.rightElbowBend), 0];
  map['mixamorig:RightHand'] = [0, 0, -deg2rad(values.rightWristPitch)];

  // Left Leg
  map['mixamorig:LeftUpLeg'] = [
    deg2rad(values.leftHipPitch),
    0,
    deg2rad(-values.leftHipRoll),
  ];
  map['mixamorig:LeftLeg'] = [deg2rad(values.leftKneeBend), 0, 0];
  map['mixamorig:LeftFoot'] = [deg2rad(values.leftAnklePitch), 0, 0];

  // Right Leg
  map['mixamorig:RightUpLeg'] = [
    deg2rad(values.rightHipPitch),
    0,
    deg2rad(values.rightHipRoll),
  ];
  map['mixamorig:RightLeg'] = [deg2rad(values.rightKneeBend), 0, 0];
  map['mixamorig:RightFoot'] = [deg2rad(values.rightAnklePitch), 0, 0];

  // Merge Hand Finger Gestures
  const leftHandFingers = getHandGestureBoneMap('Left', values.leftHandGesture);
  const rightHandFingers = getHandGestureBoneMap('Right', values.rightHandGesture);
  Object.assign(map, leftHandFingers, rightHandFingers);

  return map;
}

/**
 * Default Manual Joint Values (Baseline)
 */
export const DEFAULT_MANUAL_JOINTS: ManualJointValues = {
  leftShoulderPitch: 0,
  leftShoulderRoll: 0,
  leftElbowBend: 20,
  leftWristPitch: 0,
  leftHandGesture: 'RELAXED_NEUTRAL',

  rightShoulderPitch: 0,
  rightShoulderRoll: 0,
  rightElbowBend: 20,
  rightWristPitch: 0,
  rightHandGesture: 'RELAXED_NEUTRAL',

  leftHipPitch: 0,
  leftHipRoll: 5,
  leftKneeBend: 5,
  leftAnklePitch: 0,

  rightHipPitch: 0,
  rightHipRoll: 5,
  rightKneeBend: 5,
  rightAnklePitch: 0,

  spineTwist: 0,
  spinePitch: 0,
  headYaw: 0,
  headPitch: 0,

  elevation: 0,
};

/**
 * Applies Armor Material Shader Override to the Cybernetic Bot Mesh.
 */
export function applyBotSkin(model: THREE.Object3D, skin: BotArmorSkin) {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      let mat: THREE.MeshStandardMaterial;

      switch (skin) {
        case 'ULTRON_CRIMSON':
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x1a0507),
            roughness: 0.28,
            metalness: 0.95,
            emissive: new THREE.Color(0xef4444),
            emissiveIntensity: 0.45,
          });
          break;

        case 'VIBRANIUM_CHROME':
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xd4d4d8),
            roughness: 0.08,
            metalness: 1.0,
            emissive: new THREE.Color(0x38bdf8),
            emissiveIntensity: 0.2,
          });
          break;

        case 'OBSIDIAN_STEALTH':
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x0a0a0f),
            roughness: 0.5,
            metalness: 0.85,
            emissive: new THREE.Color(0xa855f7),
            emissiveIntensity: 0.35,
          });
          break;

        case 'SOLAR_TITAN_GOLD':
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xca8a04),
            roughness: 0.2,
            metalness: 0.92,
            emissive: new THREE.Color(0xf59e0b),
            emissiveIntensity: 0.3,
          });
          break;
      }

      mesh.material = mat;
    }
  });
}
