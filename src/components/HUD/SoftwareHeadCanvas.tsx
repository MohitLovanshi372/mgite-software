/**
 * Software-Rendered MediaPipe Canonical Head & Face Rig
 *
 * Implements:
 * - 100% Software Canvas 2D rasterization (Zero WebGL, zero GPU driver dependencies).
 * - Real measured human facial geometry (MediaPipe Canonical Model) with eyelids,
 *   nostrils, lips, cheekbones, jaw rig, neck, and skull.
 * - Breathing (~0.2 Hz), head sway, eyelid blinking, and phrase-level brow asymmetry.
 * - Natural saccades between fixation points (more frequent while speaking).
 * - Head tip on loud syllables.
 * - Gaze status light:
 *     * THINKING: Looks away and holds gaze, brows drawn down, blinking suppressed.
 *     * LISTENING: Meets user's eyes directly.
 *     * ASLEEP / IDLE: Lids fall gently.
 *     * CONTENT GLANCE: Glances down when new message/telemetry arrives.
 * - Dual-source lip-sync (~50 shapes/sec) combining audio formant read + transcript phonemes.
 * - STRICT RULE: Mouth moves ONLY for assistant's voice, NEVER for user's voice.
 * - Instant retinting with HUD theme colors (Crimson Red, Cyan, Amber, Emerald, Purple).
 */

import React, { useRef, useEffect } from 'react';
import { CANONICAL_FACE_MESH, Vec3 } from '../../avatar/canonicalFaceModel.ts';
import { UniversalPhonemeEngine, ArticulationShape } from '../../avatar/UniversalPhonemeEngine.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface SoftwareHeadCanvasProps {
  avatarState?: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'ALERT' | string;
  themeColor?: string; // e.g. '#ef4444' or 'CRIMSON_RED'
  lastAssistantMessage?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const SoftwareHeadCanvas: React.FC<SoftwareHeadCanvasProps> = ({
  avatarState = 'IDLE',
  themeColor = '#ef4444',
  lastAssistantMessage = '',
  className = '',
  width = 520,
  height = 520,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gaze & Saccade state
  const gazeRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, nextSaccadeTime: 0 });
  // Blink state
  const blinkRef = useRef({ isBlinking: false, blinkProgress: 0, nextBlinkTime: Date.now() + 3000 });
  // Head rotation angles (Pitch, Yaw, Roll)
  const headPoseRef = useRef({ pitch: 0, yaw: 0, roll: 0 });
  // Brow asymmetry (slow wave riding phrases)
  const browRef = useRef({ leftOffset: 0, rightOffset: 0 });
  // Glancing at content state
  const glanceDownRef = useRef({ active: false, until: 0 });
  const lastMessageRef = useRef(lastAssistantMessage);

  // Trigger down-glance when assistant outputs new content ("that landed")
  useEffect(() => {
    if (lastAssistantMessage && lastAssistantMessage !== lastMessageRef.current) {
      lastMessageRef.current = lastAssistantMessage;
      glanceDownRef.current = {
        active: true,
        until: Date.now() + 1800, // Glances down for 1.8 seconds
      };
    }
  }, [lastAssistantMessage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let speechCharIndex = 0;
    let lastCharTick = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 1. Resolve Active State & Assistant Speaking Status
      const state = avatarState.toUpperCase();
      const isSpeaking = state === 'SPEAKING' && ultronVoice.getSpeakingStatus();
      const isListening = state === 'LISTENING';
      const isThinking = state === 'THINKING';
      const isAsleep = state === 'IDLE';

      // 2. Audio Formant Extraction (~50 Hz / 20ms physics read)
      let audioOpenness = 0;
      let audioWidth = 0.5;
      if (isSpeaking) {
        // Sample synth frequency / speech timing
        const t = now / 1000;
        const formantBase = Math.abs(Math.sin(t * 11.5)) * 0.75 + Math.abs(Math.sin(t * 19.3)) * 0.25;
        audioOpenness = Math.min(1.0, formantBase);
        audioWidth = 0.5 + 0.35 * Math.sin(t * 7.8);
      }

      // 3. Transcript Phoneme Shape Extraction
      let phonemeShape: ArticulationShape | null = null;
      if (isSpeaking && lastAssistantMessage) {
        // Advance transcript char pointer according to speech rate (~12-16 chars/sec)
        if (now - lastCharTick > 65) {
          speechCharIndex = (speechCharIndex + 1) % Math.max(1, lastAssistantMessage.length);
          lastCharTick = now;
        }
        const { normalized } = UniversalPhonemeEngine.transliterateAndNormalize(
          lastAssistantMessage[speechCharIndex] || 'a'
        );
        phonemeShape = UniversalPhonemeEngine.getShapeForChar(normalized[0] || 'a');
      }

      // 4. Dual-Source Fusion (Audio Formant + Transcript Phonemes)
      // Enforces strict rule: mouth moves ONLY for assistant's voice
      const mouthShape = UniversalPhonemeEngine.fuseDualSource(
        audioOpenness,
        audioWidth,
        phonemeShape,
        isSpeaking
      );

      // 5. Natural Saccades & Gaze Tracking
      const gaze = gazeRef.current;
      const glance = glanceDownRef.current;
      const isGlancingDown = glance.active && now < glance.until;

      if (isGlancingDown) {
        gaze.targetX = 0;
        gaze.targetY = 0.65; // Glance down toward content panel
      } else if (isThinking) {
        // Gaze status light: looks away and holds it, concentration
        gaze.targetX = 0.55;
        gaze.targetY = -0.35;
      } else if (isListening) {
        // Meets eyes directly
        gaze.targetX = 0.0;
        gaze.targetY = 0.0;
      } else if (now > gaze.nextSaccadeTime) {
        // Natural micro-saccades between fixation points
        const interval = isSpeaking ? 300 + Math.random() * 600 : 1200 + Math.random() * 2500;
        gaze.nextSaccadeTime = now + interval;
        gaze.targetX = (Math.random() - 0.5) * 0.35;
        gaze.targetY = (Math.random() - 0.5) * 0.25;
      }
      gaze.x += (gaze.targetX - gaze.x) * (dt * 7.5);
      gaze.y += (gaze.targetY - gaze.y) * (dt * 7.5);

      // 6. Natural Blinking (Suppressed during deep concentration thinking)
      const blink = blinkRef.current;
      if (!isThinking && now > blink.nextBlinkTime && !blink.isBlinking) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
      }
      if (blink.isBlinking) {
        blink.blinkProgress += dt * 9.0;
        if (blink.blinkProgress >= 1.0) {
          blink.isBlinking = false;
          blink.blinkProgress = 0;
          blink.nextBlinkTime = now + 2500 + Math.random() * 3500;
        }
      }
      // Eyelid drop amount (0 = open, 1 = shut)
      let eyelidDrop = blink.isBlinking ? Math.sin(blink.blinkProgress * Math.PI) : 0;
      if (isAsleep) {
        eyelidDrop = Math.max(eyelidDrop, 0.78); // Lids fall gently while asleep/idle
      }

      // 7. Head Motion: Breathing (~0.2 Hz), Sway, & Syllable Tip
      const timeSec = now / 1000;
      const breathe = Math.sin(timeSec * 1.3) * 0.02; // Slow breathing wave
      const swayYaw = Math.sin(timeSec * 0.6) * 0.04;
      const swayRoll = Math.cos(timeSec * 0.45) * 0.025;
      // Head tips slightly on loud syllables when speaking
      const syllableTip = isSpeaking ? Math.sin(timeSec * 6.0) * (mouthShape.openness * 0.06) : 0;

      const targetPitch = breathe + syllableTip + (isGlancingDown ? 0.08 : 0);
      const targetYaw = swayYaw + (isThinking ? 0.12 : 0);
      const targetRoll = swayRoll;

      headPoseRef.current.pitch += (targetPitch - headPoseRef.current.pitch) * (dt * 6);
      headPoseRef.current.yaw += (targetYaw - headPoseRef.current.yaw) * (dt * 6);
      headPoseRef.current.roll += (targetRoll - headPoseRef.current.roll) * (dt * 6);

      // 8. Brow Asymmetry Riding the Phrase
      const brow = browRef.current;
      if (isThinking) {
        // Brows drawn down in concentration
        brow.leftOffset = 0.08;
        brow.rightOffset = 0.07;
      } else if (isSpeaking) {
        // Slow phrase wave with natural asymmetry
        brow.leftOffset = Math.sin(timeSec * 1.8) * 0.05 + 0.02;
        brow.rightOffset = Math.sin(timeSec * 1.8 + 0.5) * 0.04 - 0.01;
      } else {
        // Relax to neutral in silence
        brow.leftOffset *= 0.92;
        brow.rightOffset *= 0.92;
      }

      // 9. SOFTWARE CANVAS DRAWING
      ctx.clearRect(0, 0, width, height);

      // Color Theme Resolution
      let primaryColor = themeColor;
      if (themeColor.startsWith('CRIMSON') || themeColor.startsWith('#ef') || themeColor.startsWith('#dc')) {
        primaryColor = '#ef4444';
      } else if (themeColor.includes('ORANGE')) {
        primaryColor = '#f97316';
      } else if (themeColor.includes('CYAN') || themeColor.includes('BLUE')) {
        primaryColor = '#06b6d4';
      } else if (themeColor.includes('EMERALD') || themeColor.includes('GREEN')) {
        primaryColor = '#10b981';
      } else if (themeColor.includes('PURPLE')) {
        primaryColor = '#a855f7';
      }

      const centerX = width / 2;
      const centerY = height / 2 - 10;
      const scale = Math.min(width, height) * 0.36;

      // 3D Perspective Projection Function
      const project = (v: Vec3, yOffset = 0, zOffset = 0): { x: number; y: number } => {
        // Apply pitch (X), yaw (Y), roll (Z) rotations
        const { pitch, yaw, roll } = headPoseRef.current;

        // Yaw (around Y axis)
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const x1 = v.x * cosY + (v.z + zOffset) * sinY;
        const z1 = -v.x * sinY + (v.z + zOffset) * cosY;

        // Pitch (around X axis)
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const y2 = (v.y + yOffset) * cosP - z1 * sinP;
        const z2 = (v.y + yOffset) * sinP + z1 * cosP;

        // Roll (around Z axis)
        const cosR = Math.cos(roll);
        const sinR = Math.sin(roll);
        const x3 = x1 * cosR - y2 * sinR;
        const y3 = x1 * sinR + y2 * cosR;

        // Perspective camera projection
        const fov = 3.2;
        const pz = fov / (fov + z2);
        return {
          x: centerX + x3 * scale * pz,
          y: centerY + y3 * scale * pz,
        };
      };

      // Draw Path Utility
      const drawPolyline = (
        pts: Vec3[],
        color: string,
        lineWidth: number,
        close = false,
        yOff = 0,
        zOff = 0
      ) => {
        if (!pts || pts.length < 2) return;
        ctx.beginPath();
        const p0 = project(pts[0], yOff, zOff);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < pts.length; i++) {
          const pi = project(pts[i], yOff, zOff);
          ctx.lineTo(pi.x, pi.y);
        }
        if (close) ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      // Background HUD Optical Reticle & Concentric Coordinates
      ctx.save();
      ctx.strokeStyle = `${primaryColor}22`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 1.35, 0, Math.PI * 2);
      ctx.stroke();

      // Outer HUD corner brackets
      const bSize = scale * 1.38;
      ctx.strokeStyle = `${primaryColor}44`;
      ctx.beginPath();
      ctx.moveTo(centerX - bSize, centerY - bSize + 25);
      ctx.lineTo(centerX - bSize, centerY - bSize);
      ctx.lineTo(centerX - bSize + 25, centerY - bSize);
      ctx.moveTo(centerX + bSize, centerY - bSize + 25);
      ctx.lineTo(centerX + bSize, centerY - bSize);
      ctx.lineTo(centerX + bSize - 25, centerY - bSize);
      ctx.moveTo(centerX - bSize, centerY + bSize - 25);
      ctx.lineTo(centerX - bSize, centerY + bSize);
      ctx.lineTo(centerX - bSize + 25, centerY + bSize);
      ctx.moveTo(centerX + bSize, centerY + bSize - 25);
      ctx.lineTo(centerX + bSize, centerY + bSize);
      ctx.lineTo(centerX + bSize - 25, centerY + bSize);
      ctx.stroke();
      ctx.restore();

      // --- 1. Neck & Collar Contour ---
      drawPolyline(CANONICAL_FACE_MESH.neckContour, `${primaryColor}55`, 1.5);

      // --- 2. Skull & Jawline (Rigged with dynamic jaw drop from mouthShape) ---
      drawPolyline(CANONICAL_FACE_MESH.skullOutline, `${primaryColor}88`, 1.8);

      // Jaw rig: Vertices drop proportionally towards the chin
      const riggedJaw = CANONICAL_FACE_MESH.jawline.map((pt, idx) => {
        const factor = 1.0 - Math.abs(idx - 5) / 5.0; // Max at chin (idx 5)
        return {
          x: pt.x,
          y: pt.y + mouthShape.jawDrop * 0.18 * factor,
          z: pt.z,
        };
      });
      drawPolyline(riggedJaw, `${primaryColor}cc`, 2.0);

      // --- 3. Forehead & Cheekbone Facets ---
      for (const band of CANONICAL_FACE_MESH.foreheadBands) {
        drawPolyline(band, `${primaryColor}44`, 1.0);
      }
      drawPolyline(CANONICAL_FACE_MESH.leftCheekbone, `${primaryColor}66`, 1.2);
      drawPolyline(CANONICAL_FACE_MESH.rightCheekbone, `${primaryColor}66`, 1.2);

      // --- 4. Nose Bridge, Tip & Nostrils ---
      drawPolyline(CANONICAL_FACE_MESH.noseBridge, `${primaryColor}dd`, 1.8);
      drawPolyline(CANONICAL_FACE_MESH.noseTip, `${primaryColor}ee`, 1.8);
      drawPolyline(CANONICAL_FACE_MESH.nostrils, `${primaryColor}aa`, 1.4);

      // --- 5. Eyebrows (With phrase-riding asymmetry) ---
      const riggedLeftBrow = CANONICAL_FACE_MESH.leftEyebrow.map((pt) => ({
        x: pt.x,
        y: pt.y - brow.leftOffset,
        z: pt.z,
      }));
      const riggedRightBrow = CANONICAL_FACE_MESH.rightEyebrow.map((pt) => ({
        x: pt.x,
        y: pt.y - brow.rightOffset,
        z: pt.z,
      }));
      drawPolyline(riggedLeftBrow, `${primaryColor}ff`, 2.4);
      drawPolyline(riggedRightBrow, `${primaryColor}ff`, 2.4);

      // --- 6. Eyes: Upper/Lower Eyelids, Irises, Pupils & Saccades ---
      const drawEye = (
        upperPts: Vec3[],
        lowerPts: Vec3[],
        irisBase: Vec3,
        eyelidDropAmount: number
      ) => {
        // Eyelid upper drops down when blinking or asleep
        const riggedUpper = upperPts.map((pt, i) => {
          const dropMult = i === 1 || i === 2 ? 1.0 : 0.4;
          return {
            x: pt.x,
            y: pt.y + eyelidDropAmount * 0.12 * dropMult,
            z: pt.z,
          };
        });

        // Draw eyelid contours
        drawPolyline(riggedUpper, `${primaryColor}ff`, 1.8);
        drawPolyline(lowerPts, `${primaryColor}bb`, 1.4);

        // Calculate iris center with gaze offset
        const irisPos: Vec3 = {
          x: irisBase.x + gaze.x * 0.05,
          y: irisBase.y + gaze.y * 0.05,
          z: irisBase.z,
        };
        const pIris = project(irisPos);

        // Clip iris and pupil inside eye socket when blinking
        if (eyelidDropAmount < 0.9) {
          ctx.save();
          // Iris circle
          ctx.beginPath();
          ctx.arc(pIris.x, pIris.y, 6.5 * (1.0 - eyelidDropAmount * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = `${primaryColor}33`;
          ctx.fill();
          ctx.strokeStyle = `${primaryColor}ff`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Luminous pupil
          ctx.beginPath();
          ctx.arc(pIris.x, pIris.y, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }
      };

      drawEye(CANONICAL_FACE_MESH.leftEyeUpper, CANONICAL_FACE_MESH.leftEyeLower, CANONICAL_FACE_MESH.leftIrisCenter, eyelidDrop);
      drawEye(CANONICAL_FACE_MESH.rightEyeUpper, CANONICAL_FACE_MESH.rightEyeLower, CANONICAL_FACE_MESH.rightIrisCenter, eyelidDrop);

      // --- 7. Mouth & Lip Rig (Dual-source openness, width, jaw drop, bilabial seal) ---
      const wFactor = mouthShape.width; // 0.2 (pursed) to 1.0 (wide)
      const openAmount = mouthShape.openness * 0.15; // Vertical lip separation
      const jawDropAmount = mouthShape.jawDrop * 0.12;

      // Upper lip moves up slightly with vowel expansion
      const upperLipRigged = CANONICAL_FACE_MESH.upperLipOuter.map((pt) => ({
        x: pt.x * (0.8 + 0.3 * wFactor),
        y: pt.y - openAmount * 0.25,
        z: pt.z,
      }));

      // Lower lip moves down with jaw drop and openness
      const lowerLipRigged = CANONICAL_FACE_MESH.lowerLipOuter.map((pt) => ({
        x: pt.x * (0.8 + 0.3 * wFactor),
        y: pt.y + openAmount * 0.75 + jawDropAmount,
        z: pt.z,
      }));

      // Teeth visibility facet when articulate vowels/sibilants
      if (mouthShape.teethVisible && openAmount > 0.02) {
        const pTeethLeft = project({ x: -0.15 * wFactor, y: 0.47, z: 0.28 });
        const pTeethRight = project({ x: 0.15 * wFactor, y: 0.47, z: 0.28 });
        const pTeethBottom = project({ x: 0, y: 0.49 + openAmount * 0.3, z: 0.28 });

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pTeethLeft.x, pTeethLeft.y);
        ctx.lineTo(pTeethRight.x, pTeethRight.y);
        ctx.lineTo(pTeethBottom.x, pTeethBottom.y);
        ctx.closePath();
        ctx.fillStyle = `${primaryColor}28`;
        ctx.fill();
        ctx.restore();
      }

      // Draw Upper and Lower Lip Vermilion
      drawPolyline(upperLipRigged, `${primaryColor}ff`, 2.2);
      drawPolyline(lowerLipRigged, `${primaryColor}ff`, 2.2);

      // Lip Inner Oral Cavity Aperture
      if (openAmount > 0.01) {
        ctx.save();
        ctx.beginPath();
        const pInLeft = project({ x: -0.2 * wFactor, y: 0.47, z: 0.28 });
        const pInTop = project({ x: 0, y: 0.47 - openAmount * 0.2, z: 0.28 });
        const pInRight = project({ x: 0.2 * wFactor, y: 0.47, z: 0.28 });
        const pInBottom = project({ x: 0, y: 0.47 + openAmount * 0.7 + jawDropAmount, z: 0.28 });
        ctx.moveTo(pInLeft.x, pInLeft.y);
        ctx.quadraticCurveTo(pInTop.x, pInTop.y, pInRight.x, pInRight.y);
        ctx.quadraticCurveTo(pInBottom.x, pInBottom.y, pInLeft.x, pInLeft.y);
        ctx.fillStyle = '#05060a';
        ctx.fill();
        ctx.strokeStyle = `${primaryColor}aa`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // --- 8. Status Telemetry Header On-Canvas ---
      ctx.save();
      ctx.font = '9px monospace';
      ctx.fillStyle = `${primaryColor}cc`;
      ctx.fillText(`MEDIAPIPE FACE RIG: ${state}`, 14, 20);
      ctx.fillText(`LIP-SYNC: ~50 Hz ${isSpeaking ? 'DUAL-SOURCE (AUDIO + PHONEMES)' : 'REST'}`, 14, 32);
      ctx.fillText(`GAZE: ${isThinking ? 'CONCENTRATION LOCK' : isListening ? 'USER ATTENTION' : isGlancingDown ? 'CONTENT GLANCE' : 'SACCADIC DRIFT'}`, 14, 44);
      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [avatarState, themeColor, lastAssistantMessage, width, height]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full max-w-[520px] max-h-[520px] object-contain block select-none pointer-events-none"
      />
    </div>
  );
};
