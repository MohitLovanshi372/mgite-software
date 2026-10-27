/**
 * GoldenAICore Component
 *
 * Cinematic Golden AI Energy Core for JARVIS.
 * Surrounded by slowly rotating holographic rings that react to actual JARVIS states:
 * - IDLE: Slow golden breathing pulse
 * - LISTENING: Soft expanding golden waves radiating outward
 * - THINKING: Rapid rotating orbital gyroscopic rings
 * - SPEAKING: Natural audio-reactive golden waveform (360° oscillating frequencies)
 * - SUCCESS / COMPLETED: Gentle golden luminous flash that settles smoothly
 *
 * Optimized for high-performance 60fps rendering on Windows laptops (low CPU/GPU overhead).
 */

import React, { useRef, useEffect } from 'react';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { AIStateMode } from '../../types/index.ts';

interface GoldenAICoreProps {
  state?: AIStateMode | string;
  className?: string;
  size?: number;
  onCoreClick?: () => void;
}

export const GoldenAICore: React.FC<GoldenAICoreProps> = ({
  state = 'IDLE',
  className = '',
  size = 560,
  onCoreClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation physics state refs (avoids React re-renders)
  const animRef = useRef({
    angle1: 0,
    angle2: 0,
    angle3: 0,
    pulsePhase: 0,
    flashAlpha: 0,
    waveRipples: [] as { radius: number; maxRadius: number; alpha: number; speed: number }[],
    lastRippleTime: 0,
    waveformPhase: 0,
    lastState: state,
  });

  useEffect(() => {
    // Detect transition into SUCCESS / COMPLETED to trigger gentle golden flash
    const anim = animRef.current;
    if (state === 'SUCCESS' && anim.lastState !== 'SUCCESS') {
      anim.flashAlpha = 1.0;
    }
    anim.lastState = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentState = state.toUpperCase();
      const isSpeaking = currentState === 'SPEAKING' || ultronVoice.getSpeakingStatus();
      const isListening = currentState === 'LISTENING';
      const isThinking = currentState === 'THINKING' || currentState === 'EXECUTING';
      const isCompleted = currentState === 'SUCCESS';

      const anim = animRef.current;

      // 1. Resolve State-Governed Rotation Speeds
      let speed1 = 0.35; // outer ring
      let speed2 = -0.55; // middle orbital ring
      let speed3 = 0.4; // inner orbital ring

      if (isThinking) {
        speed1 = 2.8;
        speed2 = -3.4;
        speed3 = 2.2;
      } else if (isListening) {
        speed1 = 0.65;
        speed2 = -0.85;
        speed3 = 0.55;
      } else if (isSpeaking) {
        speed1 = 1.1;
        speed2 = -1.4;
        speed3 = 0.95;
      }

      anim.angle1 += speed1 * dt;
      anim.angle2 += speed2 * dt;
      anim.angle3 += speed3 * dt;
      anim.pulsePhase += (isSpeaking ? 5.5 : isThinking ? 4.0 : 1.8) * dt;
      anim.waveformPhase += dt * 4.0;

      // Decay completion flash gracefully
      if (anim.flashAlpha > 0.01) {
        anim.flashAlpha = Math.max(0, anim.flashAlpha - dt * 1.5);
      }

      // Handle expanding waves for LISTENING state
      if (isListening) {
        if (now - anim.lastRippleTime > 650) {
          anim.lastRippleTime = now;
          anim.waveRipples.push({
            radius: 45,
            maxRadius: size * 0.42,
            alpha: 0.85,
            speed: 110,
          });
        }
      }

      // Update active ripples
      for (let i = anim.waveRipples.length - 1; i >= 0; i--) {
        const ripple = anim.waveRipples[i];
        ripple.radius += ripple.speed * dt;
        const progress = ripple.radius / ripple.maxRadius;
        ripple.alpha = Math.max(0, (1 - progress) * 0.7);
        if (ripple.radius >= ripple.maxRadius) {
          anim.waveRipples.splice(i, 1);
        }
      }

      // Voice Audio Level Sampling (Actual Playback Audio Reactive)
      let audioLevel = 0;
      const freqData = isSpeaking ? ultronVoice.getAudioFrequencyData() : null;
      if (isSpeaking) {
        const realEnergy = ultronVoice.getAudioEnergyLevel();
        if (realEnergy > 0.05) {
          audioLevel = realEnergy;
        } else {
          const t = now / 1000;
          audioLevel =
            Math.abs(Math.sin(t * 12.0)) * 0.5 +
            Math.abs(Math.cos(t * 19.5)) * 0.35 +
            Math.abs(Math.sin(t * 7.2)) * 0.15;
        }
      }

      // Canvas dimensions
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // A. Ambient Soft Golden Light Vignette Behind Core
      const basePulse = (Math.sin(anim.pulsePhase) + 1) / 2;
      const ambientGlowRadius = size * 0.38 + basePulse * 15 + audioLevel * 25;
      const ambientGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, ambientGlowRadius);
      ambientGrad.addColorStop(0, `rgba(212, 175, 55, ${0.14 + basePulse * 0.08 + anim.flashAlpha * 0.35})`);
      ambientGrad.addColorStop(0.5, `rgba(245, 158, 11, ${0.05 + basePulse * 0.04})`);
      ambientGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');

      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, ambientGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // B. Expanding Golden Waves (Listening State)
      if (anim.waveRipples.length > 0) {
        for (const ripple of anim.waveRipples) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 106, ${ripple.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#FFD76A';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }
      }

      // C. Holographic Ring 1: Outer Calibrated Coordinate Ring
      const outerR = size * 0.35;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(anim.angle1 * 0.3);

      // Fine outer hairline
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Precision tick marks around perimeter
      const ticks = 48;
      for (let i = 0; i < ticks; i++) {
        const theta = (i / ticks) * Math.PI * 2;
        const isMajor = i % 6 === 0;
        const isMedium = i % 3 === 0;
        const tickLen = isMajor ? 7 : isMedium ? 4 : 2;
        const r1 = outerR - tickLen;
        const r2 = outerR;

        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * r1, Math.sin(theta) * r1);
        ctx.lineTo(Math.cos(theta) * r2, Math.sin(theta) * r2);
        ctx.strokeStyle = isMajor
          ? 'rgba(255, 215, 106, 0.65)'
          : isMedium
          ? 'rgba(212, 175, 55, 0.4)'
          : 'rgba(212, 175, 55, 0.18)';
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.stroke();
      }

      // Arc gaps on outer ring
      for (let i = 0; i < 4; i++) {
        const start = (i * Math.PI) / 2 + 0.15;
        const end = start + Math.PI / 2 - 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, outerR + 4, start, end);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // D. Holographic Ring 2: Primary Gyroscopic Ring (Tilted 3D Orbit)
      const midR = size * 0.28;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.42); // 3D tilt plane

      ctx.save();
      ctx.scale(1, 0.62); // 3D perspective squish
      ctx.rotate(anim.angle2);

      // Orbit track
      ctx.beginPath();
      ctx.arc(0, 0, midR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Bright segmented arcs on mid orbit
      for (let i = 0; i < 3; i++) {
        const aStart = (i * Math.PI * 2) / 3;
        const aEnd = aStart + 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, midR, aStart, aEnd);
        ctx.strokeStyle = '#FFD76A';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#FFD76A';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Small orbital satellite bead
        const beadX = Math.cos(aEnd) * midR;
        const beadY = Math.sin(aEnd) * midR;
        ctx.beginPath();
        ctx.arc(beadX, beadY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF5C0';
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();

      // E. Holographic Ring 3: Counter-Rotating Gyroscopic Ring
      const innerR = size * 0.21;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.5); // Opposite 3D tilt

      ctx.save();
      ctx.scale(1, 0.58);
      ctx.rotate(anim.angle3);

      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.32)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dashed inner telemetry ring
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, innerR - 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.restore();

      // F. Dynamic Audio Waveform Ring (Active during SPEAKING) or Cadence Pulse Ring
      const waveR = size * 0.15;
      ctx.save();
      ctx.translate(cx, cy);

      const wavePoints = 72;
      ctx.beginPath();
      for (let i = 0; i <= wavePoints; i++) {
        const theta = (i / wavePoints) * Math.PI * 2;
        let rOffset = 0;

        if (isSpeaking) {
          // Dynamic organic speech waveform spikes driven by actual playback frequencies
          let freqAmp = 0;
          if (freqData && freqData.length > 0) {
            const binIdx = Math.floor((i / wavePoints) * (freqData.length / 2));
            freqAmp = (freqData[binIdx] / 255) * 14;
          }
          const harmonic1 = Math.sin(theta * 6 + anim.waveformPhase) * (8 + freqAmp * 0.5) * audioLevel;
          const harmonic2 = Math.cos(theta * 14 - anim.waveformPhase * 1.5) * (4 + freqAmp * 0.3) * audioLevel;
          rOffset = harmonic1 + harmonic2 + freqAmp;
        } else if (isThinking) {
          rOffset = Math.sin(theta * 8 + anim.waveformPhase * 2.5) * 4;
        } else if (isListening) {
          rOffset = Math.sin(theta * 4 + anim.waveformPhase) * 3;
        } else {
          // Gentle idle shimmer
          rOffset = Math.sin(theta * 3 + anim.pulsePhase) * 1.5;
        }

        const currentR = waveR + rOffset;
        const px = Math.cos(theta) * currentR;
        const py = Math.sin(theta) * currentR;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.strokeStyle = isSpeaking
        ? '#FFD76A'
        : isThinking
        ? 'rgba(255, 215, 106, 0.8)'
        : 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = isSpeaking ? 2 : 1.2;
      if (isSpeaking || isThinking) {
        ctx.shadowColor = '#FFD76A';
        ctx.shadowBlur = 10;
      }
      ctx.stroke();
      ctx.restore();

      // G. Center Core: Animated Golden Plasma Sphere
      const corePulseRadius =
        size * 0.085 +
        basePulse * 4 +
        audioLevel * 10 +
        (isThinking ? Math.sin(now * 0.015) * 3 : 0) +
        anim.flashAlpha * 18;

      ctx.save();
      ctx.translate(cx, cy);

      // Core Outer Corona
      const coronaGrad = ctx.createRadialGradient(0, 0, corePulseRadius * 0.2, 0, 0, corePulseRadius * 1.5);
      coronaGrad.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
      coronaGrad.addColorStop(0.25, 'rgba(255, 215, 106, 0.85)');
      coronaGrad.addColorStop(0.65, 'rgba(212, 175, 55, 0.55)');
      coronaGrad.addColorStop(0.9, 'rgba(245, 158, 11, 0.25)');
      coronaGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, corePulseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core Solid Sphere
      const coreGrad = ctx.createRadialGradient(
        -corePulseRadius * 0.25,
        -corePulseRadius * 0.25,
        corePulseRadius * 0.1,
        0,
        0,
        corePulseRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.2, '#FFF5C0');
      coreGrad.addColorStop(0.55, '#FFD76A');
      coreGrad.addColorStop(0.85, '#D4AF37');
      coreGrad.addColorStop(1, '#B8860B');

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#FFD76A';
      ctx.shadowBlur = 24 + anim.flashAlpha * 40;
      ctx.beginPath();
      ctx.arc(0, 0, corePulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Internal Holographic Geometric Emblem / Sacred Lattice
      ctx.save();
      ctx.rotate(anim.angle1 * 0.6);
      ctx.beginPath();
      const hexPoints = 6;
      const hexR = corePulseRadius * 0.65;
      for (let i = 0; i < hexPoints; i++) {
        const theta = (i / hexPoints) * Math.PI * 2;
        const x = Math.cos(theta) * hexR;
        const y = Math.sin(theta) * hexR;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(3, 7, 18, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Connecting inner nodal rays
      for (let i = 0; i < 3; i++) {
        const theta = (i / 3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * hexR, Math.sin(theta) * hexR);
        ctx.lineTo(-Math.cos(theta) * hexR, -Math.sin(theta) * hexR);
        ctx.stroke();
      }
      ctx.restore();

      // Pure White Center Pinpoint of Fusion Light
      ctx.beginPath();
      ctx.arc(0, 0, 3 + basePulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.restore();

      // H. Gentle Completion Golden Flash Overlay
      if (anim.flashAlpha > 0.02) {
        ctx.save();
        const flashGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size * 0.45);
        flashGrad.addColorStop(0, `rgba(255, 245, 192, ${anim.flashAlpha * 0.55})`);
        flashGrad.addColorStop(0.5, `rgba(255, 215, 106, ${anim.flashAlpha * 0.3})`);
        flashGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size, state]);

  // Handle high-dpi sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  }, [size]);

  return (
    <div
      onClick={onCoreClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-[1.01] ${className}`}
      title="JARVIS Golden AI Core"
    >
      <canvas ref={canvasRef} className="block pointer-events-auto" />
    </div>
  );
};
