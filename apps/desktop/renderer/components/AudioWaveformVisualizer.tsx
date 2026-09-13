/**
 * Real-Time Audio Visualization Waveform Component
 *
 * Visualizes microphone input levels and acoustic frequency spectrum in real-time.
 * Features:
 * 1. Web Audio API real-time microphone stream analysis
 * 2. Multi-mode rendering:
 *    - Mode A: Symmetrical Frequency Equalizer Bars with floating peak caps
 *    - Mode B: Glowing Neon Oscilloscope Waveform (Canvas-based)
 * 3. Reactive state themes:
 *    - LISTENING: Emerald / Cyan vibrant acoustic response
 *    - SPEAKING: Sky blue speech synthesis wave
 *    - PROCESSING / THINKING: Violet quantum pulsing wave
 *    - IDLE: Soft cyan/slate ambient baseline
 * 4. Acoustic Telemetry:
 *    - Live dB input level readout
 *    - Voice Activity Detection (VAD) indicator
 *    - Mode switcher & Sensitivity boost
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMicrophoneAudio } from '../hooks/useMicrophoneAudio.ts';
import { Activity, Radio, BarChart2, Waves, Volume2, VolumeX } from 'lucide-react';

export type WaveformDisplayMode = 'bars' | 'wave' | 'hybrid';

interface AudioWaveformVisualizerProps {
  isListening: boolean;
  voiceState?: string;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  showControls?: boolean;
  height?: number;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isListening,
  voiceState = 'IDLE',
  isLoading = false,
  className = '',
  compact = false,
  showControls = true,
  height = 36,
}) => {
  const [displayMode, setDisplayMode] = useState<WaveformDisplayMode>('bars');
  const [sensitivityBoost, setSensitivityBoost] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hook into real microphone stream when listening
  const {
    micLevel,
    rawLevel,
    peakLevel,
    frequencyData,
    timeDomainData,
    isVoiceActive,
    dB,
    status: micStatus,
    errorMessage,
  } = useMicrophoneAudio({
    enabled: isListening,
    fftSize: 64,
    smoothingTimeConstant: 0.75,
    gainMultiplier: sensitivityBoost ? 2.8 : 1.8,
  });

  const isSpeaking = voiceState === 'SPEAKING';
  const isProcessing = isLoading || voiceState === 'PROCESSING' || voiceState === 'THINKING';

  // Fallback organic wave values when mic is active but quiet or during synthetic speech
  const syntheticTimeRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Canvas drawing loop for Oscilloscope Wave mode
  useEffect(() => {
    if (displayMode !== 'wave' && displayMode !== 'hybrid') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const renderWave = () => {
      if (!active) return;
      syntheticTimeRef.current += 0.05;
      const t = syntheticTimeRef.current;

      const width = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, width, h);

      // Determine palette based on state
      let strokeColor = '#06b6d4'; // cyan-500
      let glowColor = 'rgba(6, 182, 212, 0.4)';
      let shadowBlur = 8;

      if (isListening) {
        if (isVoiceActive || micLevel > 0.1) {
          strokeColor = '#10b981'; // emerald-500
          glowColor = 'rgba(16, 185, 129, 0.6)';
          shadowBlur = 12;
        } else {
          strokeColor = '#34d399'; // emerald-400
          glowColor = 'rgba(52, 211, 153, 0.3)';
        }
      } else if (isSpeaking) {
        strokeColor = '#38bdf8'; // sky-400
        glowColor = 'rgba(56, 189, 248, 0.5)';
        shadowBlur = 10;
      } else if (isProcessing) {
        strokeColor = '#a855f7'; // purple-500
        glowColor = 'rgba(168, 85, 247, 0.5)';
      } else {
        strokeColor = 'rgba(100, 116, 139, 0.4)'; // slate-500
        glowColor = 'rgba(100, 116, 139, 0.15)';
        shadowBlur = 2;
      }

      ctx.save();
      ctx.shadowBlur = shadowBlur;
      ctx.shadowColor = glowColor;
      ctx.lineWidth = isListening && isVoiceActive ? 2.5 : 1.8;
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      const numPoints = timeDomainData.length || 64;
      const sliceWidth = width / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const x = i * sliceWidth;
        let y = centerY;

        if (isListening && micStatus === 'active') {
          // Real-time microphone acoustic waveform
          const rawAmp = timeDomainData[i] || 0;
          // Apply windowing envelope to prevent edge jumping
          const envelope = Math.sin((i / (numPoints - 1)) * Math.PI);
          const ampScale = (h * 0.45) * (sensitivityBoost ? 1.4 : 1.0);
          y = centerY + rawAmp * ampScale * envelope;
        } else if (isSpeaking) {
          // Organic speech modulation
          const envelope = Math.sin((i / (numPoints - 1)) * Math.PI);
          const speechAmp = Math.sin(t * 3.5 + i * 0.3) * Math.cos(t * 2.1 + i * 0.15);
          y = centerY + speechAmp * (h * 0.38) * envelope;
        } else if (isProcessing) {
          // Quantum ripple
          const envelope = Math.sin((i / (numPoints - 1)) * Math.PI);
          const ripple = Math.sin(t * 4 + i * 0.45);
          y = centerY + ripple * (h * 0.25) * envelope;
        } else {
          // Resting baseline ripple
          const envelope = Math.sin((i / (numPoints - 1)) * Math.PI);
          const idleWave = Math.sin(t * 1.5 + i * 0.2) * 2;
          y = centerY + idleWave * envelope;
        }

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw secondary mirror reflection for holographic depth
      if (isListening || isSpeaking) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = glowColor;
        for (let i = 0; i < numPoints; i++) {
          const x = i * sliceWidth;
          const rawAmp = isListening ? (timeDomainData[i] || 0) : Math.sin(t * 3.5 + i * 0.3) * 0.5;
          const envelope = Math.sin((i / (numPoints - 1)) * Math.PI);
          const y = centerY - rawAmp * (h * 0.28) * envelope;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [displayMode, isListening, isSpeaking, isProcessing, micStatus, isVoiceActive, micLevel, timeDomainData, sensitivityBoost]);

  // Compute 20 symmetrical frequency bars with peak hold logic
  const numBars = compact ? 14 : 22;
  const barHeights = useMemo(() => {
    const bars: { height: number; peak: number }[] = [];
    const freqLen = frequencyData.length || 32;

    for (let i = 0; i < numBars; i++) {
      // Symmetrical center-weighted mapping: map index so lowest frequencies are in center or progressive
      const normalizedPos = Math.abs(i - numBars / 2) / (numBars / 2);
      const freqIndex = Math.min(
        freqLen - 1,
        Math.floor((1 - normalizedPos) * (freqLen * 0.85))
      );

      let rawVal = 0;

      if (isListening && micStatus === 'active') {
        // Real microphone frequency input + RMS volume amplification
        const binVal = frequencyData[freqIndex] || 0;
        rawVal = Math.min(1.0, binVal * 1.5 + micLevel * 0.8);
      } else if (isSpeaking) {
        // Dynamic speech oscillation
        rawVal = 0.25 + 0.65 * Math.abs(Math.sin((i + 1) * 0.8 + Date.now() * 0.005));
      } else if (isProcessing) {
        // Wave pulse
        rawVal = 0.15 + 0.45 * Math.abs(Math.sin(i * 0.5 + Date.now() * 0.006));
      } else {
        // Resting idle baseline
        rawVal = 0.06 + 0.08 * Math.sin(i * 0.4 + Date.now() * 0.002);
      }

      // Calculate bar height in pixels (clamp between min 4px and max height - 6px)
      const maxH = height - 8;
      const hPx = Math.max(3, Math.min(maxH, rawVal * maxH));
      const peakPx = Math.min(maxH, hPx + 4);

      bars.push({ height: hPx, peak: peakPx });
    }

    return bars;
  }, [numBars, isListening, micStatus, frequencyData, micLevel, isSpeaking, isProcessing, height]);

  // Color scheme based on state
  const getBarColor = (index: number) => {
    if (isListening) {
      if (isVoiceActive) {
        // High vocal energy: Emerald to neon cyan
        return 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-cyan-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      }
      return 'bg-gradient-to-t from-emerald-700/80 to-emerald-400/90';
    }
    if (isSpeaking) {
      return 'bg-gradient-to-t from-blue-600 via-sky-400 to-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]';
    }
    if (isProcessing) {
      return 'bg-gradient-to-t from-purple-600 to-violet-400 animate-pulse';
    }
    return 'bg-slate-700/60 hover:bg-slate-600/70';
  };

  return (
    <div
      id="realtime-audio-waveform-visualizer"
      className={`relative flex items-center gap-2 select-none ${className}`}
      style={{ minHeight: `${height}px` }}
    >
      {/* 1. Primary Waveform Visualizer Display */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 border border-cyan-500/20 px-2 py-1 transition-all"
        style={{ height: `${height}px`, minWidth: compact ? '90px' : '150px' }}
      >
        {/* Glow ambient background when voice active */}
        {isListening && isVoiceActive && (
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none rounded-xl" />
        )}

        {displayMode === 'bars' || displayMode === 'hybrid' ? (
          /* Multi-Bar Symmetrical Equalizer */
          <div className="relative z-10 flex items-center justify-center gap-[2.5px] sm:gap-[3px] h-full w-full">
            {barHeights.map((bar, idx) => (
              <div
                key={idx}
                className="relative flex flex-col justify-center items-center h-full w-[3px] sm:w-[4px]"
              >
                {/* Floating Peak Cap */}
                {isListening && (
                  <span
                    className="absolute w-full h-[1.5px] rounded-full bg-cyan-300 transition-all duration-150"
                    style={{
                      bottom: `${(height / 2) + (bar.peak / 2)}px`,
                      opacity: bar.height > 6 ? 0.9 : 0.2,
                    }}
                  />
                )}

                {/* Symmetrical Vertical Bar */}
                <div
                  className={`w-full rounded-full transition-all duration-75 ${getBarColor(idx)}`}
                  style={{
                    height: `${bar.height}px`,
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {displayMode === 'wave' || displayMode === 'hybrid' ? (
          /* Neon Oscilloscope Canvas */
          <canvas
            ref={canvasRef}
            width={compact ? 120 : 180}
            height={height}
            className={`w-full h-full z-10 ${displayMode === 'hybrid' ? 'absolute inset-0 pointer-events-none opacity-85' : ''}`}
          />
        ) : null}
      </div>

      {/* 2. Live Telemetry HUD: dB Readout & Voice Activity Indicator */}
      {!compact && (
        <div className="hidden md:flex flex-col justify-center text-[10px] font-mono leading-tight px-1.5 py-0.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isListening
                  ? isVoiceActive
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                    : 'bg-emerald-600'
                  : isSpeaking
                  ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400 font-semibold tracking-wider">
              {isListening
                ? isVoiceActive
                  ? 'VOCAL ACTIVE'
                  : 'LISTENING'
                : isSpeaking
                ? 'SYNTHESIS'
                : 'ACOUSTIC'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-slate-500 pt-0.5">
            <span>
              {isListening && micStatus === 'active'
                ? `${dB > -60 ? dB : -60} dB`
                : isSpeaking
                ? 'OUT: 100%'
                : 'IDLE'}
            </span>
            <span className="text-[9px] text-cyan-400/70">
              {isListening ? `${Math.round(micLevel * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      )}

      {/* 3. Mode Switcher & Sensitivity Controls (if showControls is true) */}
      {showControls && (
        <div className="flex items-center gap-1">
          {/* Toggle between Bars / Wave modes */}
          <button
            type="button"
            onClick={() =>
              setDisplayMode((prev) =>
                prev === 'bars' ? 'wave' : prev === 'wave' ? 'hybrid' : 'bars'
              )
            }
            title={`Visualizer Style: ${displayMode.toUpperCase()} (Click to toggle)`}
            aria-label="Toggle waveform visualization mode"
            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-cyan-500/30 cursor-pointer"
          >
            {displayMode === 'bars' ? (
              <BarChart2 className="w-3.5 h-3.5" />
            ) : displayMode === 'wave' ? (
              <Waves className="w-3.5 h-3.5" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {/* Sensitivity Boost Toggle */}
          {isListening && (
            <button
              type="button"
              onClick={() => setSensitivityBoost(!sensitivityBoost)}
              title={
                sensitivityBoost
                  ? 'High Gain Active (Click for Standard Gain)'
                  : 'Boost Acoustic Sensitivity (Click for High Gain)'
              }
              aria-label="Toggle mic sensitivity boost"
              className={`p-1 rounded-md transition-colors cursor-pointer border ${
                sensitivityBoost
                  ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              <Radio className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
