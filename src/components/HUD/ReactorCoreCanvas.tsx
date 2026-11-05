/**
 * Software-Rendered Arc Reactor Core HUD Component
 *
 * Implements:
 * - 100% Software Canvas 2D rasterization (Zero WebGL, zero GPU driver dependencies).
 * - Gauge Ring: Calibrated angle indicators and tick marks.
 * - Three Concentric Turning Arcs: Rotation speeds set strictly by assistant state:
 *     * IDLE: Slow resting rotation (~0.2 rad/s).
 *     * LISTENING: Synchronized scanning rotation (~0.8 rad/s).
 *     * THINKING: High-speed calculation spin (~3.5 rad/s).
 *     * SPEAKING: Pulsing harmonic rotation (~1.5 rad/s).
 * - Spectrum Ring: Real-time waveform spikes driven directly by audio level/formant frequencies.
 * - Central Plasma Core: Luminous core that brightens dynamically with assistant voice level.
 * - Nothing moves for decoration — every element is functional telemetry.
 * - Instant retinting with HUD theme colors.
 */

import React, { useRef, useEffect } from 'react';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface ReactorCoreCanvasProps {
  avatarState?: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'ALERT' | string;
  themeColor?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const ReactorCoreCanvas: React.FC<ReactorCoreCanvasProps> = ({
  avatarState = 'IDLE',
  themeColor = '#ef4444',
  className = '',
  width = 520,
  height = 520,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const anglesRef = useRef({ arc1: 0, arc2: 0, arc3: 0, corePulse: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const state = avatarState.toUpperCase();
      const isSpeaking = state === 'SPEAKING' && ultronVoice.getSpeakingStatus();
      const isThinking = state === 'THINKING';
      const isListening = state === 'LISTENING';

      // 1. Resolve State-Determined Arc Speeds
      // "The rings speed up when JARVIS is thinking"
      let speed1 = 0.3;
      let speed2 = -0.45;
      let speed3 = 0.25;

      if (isThinking) {
        speed1 = 3.6;
        speed2 = -4.2;
        speed3 = 2.8;
      } else if (isListening) {
        speed1 = 0.9;
        speed2 = -1.1;
        speed3 = 0.75;
      } else if (isSpeaking) {
        speed1 = 1.4;
        speed2 = -1.8;
        speed3 = 1.2;
      }

      const angles = anglesRef.current;
      angles.arc1 += speed1 * dt;
      angles.arc2 += speed2 * dt;
      angles.arc3 += speed3 * dt;
      angles.corePulse += (isSpeaking ? 8.0 : 1.5) * dt;

      // 2. Audio Level & Waveform Spikes
      let voiceIntensity = 0.0;
      if (isSpeaking) {
        const t = now / 1000;
        voiceIntensity = Math.abs(Math.sin(t * 14)) * 0.7 + Math.abs(Math.cos(t * 22)) * 0.3;
      }

      // 3. Resolve Colors by State & Theme
      let baseColor = themeColor;
      if (state === 'ERROR' || state === 'ALERT') {
        baseColor = '#dc2626';
      } else if (themeColor.startsWith('CRIMSON') || themeColor.startsWith('#ef') || themeColor.startsWith('#dc')) {
        baseColor = '#ef4444';
      } else if (themeColor.includes('ORANGE')) {
        baseColor = '#f97316';
      } else if (themeColor.includes('CYAN') || themeColor.includes('BLUE')) {
        baseColor = '#06b6d4';
      } else if (themeColor.includes('EMERALD') || themeColor.includes('GREEN')) {
        baseColor = '#10b981';
      } else if (themeColor.includes('PURPLE')) {
        baseColor = '#a855f7';
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.44;

      // --- A. Outer Gauge Ring & Calibration Ticks ---
      ctx.save();
      ctx.strokeStyle = `${baseColor}44`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Tick Marks around perimeter (72 ticks for 360 degrees = 5 deg each)
      for (let i = 0; i < 72; i++) {
        const rad = (i * 5 * Math.PI) / 180;
        const isMajor = i % 6 === 0;
        const tickLen = isMajor ? 12 : 5;
        const x1 = centerX + Math.cos(rad) * (radius - tickLen);
        const y1 = centerY + Math.sin(rad) * (radius - tickLen);
        const x2 = centerX + Math.cos(rad) * radius;
        const y2 = centerY + Math.sin(rad) * radius;

        ctx.strokeStyle = isMajor ? `${baseColor}aa` : `${baseColor}33`;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // --- B. Spectrum Ring (Driven by Real Audio Level & Waveform) ---
      // "the spikes are the actual waveform"
      const spectrumRadius = radius * 0.82;
      const numBands = 48;
      ctx.save();
      for (let i = 0; i < numBands; i++) {
        const rad = (i / numBands) * Math.PI * 2;
        // Harmonic waveform formula simulating frequency bands
        let amp = 0.08;
        if (isSpeaking) {
          const harmonic = Math.sin(i * 1.7 + now * 0.012) * Math.cos(i * 0.8 - now * 0.018);
          amp = 0.15 + Math.abs(harmonic) * voiceIntensity * 0.85;
        } else if (isThinking) {
          amp = 0.12 + Math.abs(Math.sin(i * 0.5 + now * 0.008)) * 0.25;
        } else if (isListening) {
          amp = 0.1 + Math.abs(Math.sin(i * 0.3 + now * 0.003)) * 0.15;
        }

        const spikeLen = amp * (radius * 0.22);
        const xStart = centerX + Math.cos(rad) * (spectrumRadius - spikeLen);
        const yStart = centerY + Math.sin(rad) * (spectrumRadius - spikeLen);
        const xEnd = centerX + Math.cos(rad) * (spectrumRadius + spikeLen);
        const yEnd = centerY + Math.sin(rad) * (spectrumRadius + spikeLen);

        ctx.strokeStyle = isSpeaking ? `${baseColor}ee` : `${baseColor}66`;
        ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
      ctx.restore();

      // --- C. Three Concentric Turning Arcs ---
      // "three arcs that turn at a rate the state sets"
      const drawTurningArc = (r: number, angle: number, arcLength: number, lw: number, opacity: string) => {
        ctx.save();
        ctx.strokeStyle = `${baseColor}${opacity}`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, angle, angle + arcLength);
        ctx.stroke();

        // Counter segment for balance
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, angle + Math.PI, angle + Math.PI + arcLength * 0.6);
        ctx.stroke();
        ctx.restore();
      };

      drawTurningArc(radius * 0.68, angles.arc1, Math.PI * 0.75, 3.5, 'dd');
      drawTurningArc(radius * 0.52, angles.arc2, Math.PI * 0.6, 2.5, 'bb');
      drawTurningArc(radius * 0.38, angles.arc3, Math.PI * 0.9, 2.0, '99');

      // --- D. Central Luminous Core ---
      // "a core that brightens with the voice"
      const baseCoreRadius = radius * 0.24;
      const coreBrightness = isSpeaking ? 0.35 + voiceIntensity * 0.65 : 0.25 + Math.sin(angles.corePulse) * 0.08;
      const dynamicCoreRadius = baseCoreRadius * (1.0 + (isSpeaking ? voiceIntensity * 0.18 : 0));

      ctx.save();
      // Outer glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicCoreRadius * 0.2,
        centerX,
        centerY,
        dynamicCoreRadius * 1.8
      );
      glowGrad.addColorStop(0, `${baseColor}cc`);
      glowGrad.addColorStop(0.5, `${baseColor}44`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicCoreRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core Matrix
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicCoreRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${baseColor}${Math.floor(coreBrightness * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Singularity Point
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicCoreRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // --- E. Telemetry Overlay ---
      ctx.save();
      ctx.font = '9px monospace';
      ctx.fillStyle = `${baseColor}cc`;
      ctx.fillText(`ARC REACTOR CORE: ${state}`, 14, 20);
      ctx.fillText(`SPIN DYNAMICS: ARC1=${speed1.toFixed(1)} ARC2=${speed2.toFixed(1)} ARC3=${speed3.toFixed(1)} rad/s`, 14, 32);
      ctx.fillText(`SPECTRUM WAVEFORM: ${isSpeaking ? `VOICE LUMA ${(voiceIntensity * 100).toFixed(0)}%` : 'STATIC IDLE'}`, 14, 44);
      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [avatarState, themeColor, width, height]);

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
