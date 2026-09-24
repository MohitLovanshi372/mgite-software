/**
 * GLB 3D Models & Galaxy View Definitions
 */

export interface GLBModelOption {
  id: string;
  name: string;
  category: 'ULTRON_ARMOR' | 'CYBERNETIC_BOT' | 'PROCEDURAL_CORE' | 'SPACECRAFT' | 'USER_UPLOAD';
  description: string;
  source: 'preset' | 'upload' | 'url' | 'procedural';
  url: string;
  defaultScale: number;
  author?: string;
  animated?: boolean;
  triangleEstimate?: string;
  thumbnailIcon?: string;
  arrayBuffer?: ArrayBuffer;
}

export type LightingMode =
  | 'crimson_forge'
  | 'galactic_starlight'
  | 'deep_void'
  | 'studio'
  | 'cyber_neon';

export type MaterialMode =
  | 'original'
  | 'crimson_glow'
  | 'obsidian_titanium'
  | 'wireframe_ghost'
  | 'cyber_matrix'
  | 'jarvis_cyan'
  | 'gold_titanium';

export type AnimationLoopMode = 'REPEAT' | 'ONCE' | 'PING_PONG';
export type LoopMode = AnimationLoopMode;
export type AnimationDirection = 'FORWARD' | 'REVERSE';

export interface AnimationTrackData {
  name: string;
  duration: number;
  tracksCount: number;
  category: 'LOCOMOTION' | 'ACTION' | 'EMOTE' | 'IDLE' | 'STANCE' | 'PROCEDURAL';
}

export interface GLBViewerSettings {
  wireframe: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  lightingMode: LightingMode;
  materialMode: MaterialMode;
  modelScale: number;
  selectedAnimation: string;
  animationSpeed: number;
  isPlaying: boolean;
  showGrid: boolean;
  showBoundingBox: boolean;
  showAxes: boolean;
  showSkeleton?: boolean;
  loopMode?: AnimationLoopMode;
  playbackDirection?: AnimationDirection;
  blendDuration?: number;
  actionWeight?: number;
}

export interface ModelTelemetry {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
  animations: string[];
  bounds: { x: number; y: number; z: number };
  fileSize?: string;
}

export type GestureControlMode = 'DUAL' | 'ROTATE' | 'TRANSLATE' | 'LEVITATE';

export interface GestureTelemetryHUD {
  isTracking: boolean;
  gesture: string;
  confidence: number;
  palmX: number;
  palmY: number;
  mode: GestureControlMode;
}

export type GalaxyQuadrant =
  | 'SAGITTARIUS_A_CORE'
  | 'ORION_CYGNUS_ARM'
  | 'PERSEUS_ARM'
  | 'SCUTUM_CENTAURUS_ARM'
  | 'OUTER_RIM';

export interface GalaxyTelemetry {
  quadrant: GalaxyQuadrant;
  name: string;
  starsEstimate: string;
  blackHoleMass: string;
  angularVelocity: string;
  radiationIndex: string;
  coordinates: string;
  threatLevel: 'ALPHA_DOMINANT' | 'STABLE' | 'VOLATILE' | 'SINGULARITY';
}
