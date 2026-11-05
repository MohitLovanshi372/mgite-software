/**
 * Curated 3D GLB Model Presets & Sample Catalogs
 */

import { GLBModelOption } from '../types/glbModels.ts';

export const DEFAULT_GLB_MODELS: GLBModelOption[] = [
  {
    id: 'jarvis_avatar',
    name: 'JARVIS MARK-I CYBERNETIC AVATAR',
    category: 'CYBERNETIC_BOT',
    description: 'Autonomous JARVIS humanoid avatar with full bipedal skeletal kinematics, 18 combat & locomotion animation tracks, real-time optical pose retargeting, and PBR shaders.',
    source: 'preset',
    url: '/models/cyber_android.glb',
    defaultScale: 1.2,
    animated: true,
    triangleEstimate: '~12K Tris',
    author: 'Stark Industries / JARVIS Protocol',
  },
  {
    id: 'jarvis_hologram',
    name: 'JARVIS HOLOGRAPHIC AI CORE',
    category: 'PROCEDURAL_CORE',
    description: 'Holographic JARVIS arc reactor with spinning quantum rings, floating neural synapses, and real-time pulse field.',
    source: 'procedural',
    url: 'procedural://jarvis_core',
    defaultScale: 1.3,
    animated: true,
    triangleEstimate: '~28K Tris',
    author: 'Stark Industries Neural Forge',
  },
  {
    id: 'procedural_singularity',
    name: 'ULTRON QUANTUM TESSERACT',
    category: 'PROCEDURAL_CORE',
    description: 'Autonomous 4D hypercube core with counter-rotating electromagnetic gimbal rings and gravitational pulse emitter.',
    source: 'procedural',
    url: 'procedural://singularity_core',
    defaultScale: 1.4,
    animated: true,
    triangleEstimate: '~35K Tris',
    author: 'Ultron Neural Forge',
  },
];
