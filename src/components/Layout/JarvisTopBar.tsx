/**
 * JarvisTopBar Component (Golden Space Theme)
 *
 * Cinematic Golden Top Bar:
 * - Left: Glowing Golden AI Emblem + "JARVIS" + "AI OPERATING SYSTEM"
 * - Center: Digital Clock (font-mono tabular-nums) + Formatted Date
 * - Right:
 *    - Status: Online indicator
 *    - Sound FX Toggle
 *    - Settings button
 *    - Window controls (Minimize, Maximize, Close)
 */

import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Minus, Square, X } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisTopBarProps {
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  isOnline?: boolean;
}

export const JarvisTopBar: React.FC<JarvisTopBarProps> = ({
  onSettingsClick,
  onProfileClick,
  isOnline = true,
}) => {
  const [timeStr, setTimeStr] = useState('14:28:00');
  const [dateStr, setDateStr] = useState('Mon, 26 Oct 2026');
  const [extraSoundOn, setExtraSoundOn] = useState<boolean>(() => soundFx.isExtraSoundEnabled());

  useEffect(() => {
    const handleSoundChange = (e: any) => {
      setExtraSoundOn(Boolean(e.detail?.enabled));
    };
    window.addEventListener('jarvis_extra_sound_changed', handleSoundChange);
    return () => window.removeEventListener('jarvis_extra_sound_changed', handleSoundChange);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs}`);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && (window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && (window as any).electronAPI?.maximize) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && (window as any).electronAPI?.close) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <header className="h-14 w-full px-5 py-2 flex items-center justify-between select-none relative z-30 bg-[#030712]/90 backdrop-blur-md border-b border-[#D4AF37]/20">
      {/* Subtle top ambient golden illumination line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      {/* LEFT: JARVIS Identity */}
      <div className="flex items-center gap-3">
        {/* Golden Emblem */}
        <div
          onClick={onProfileClick}
          className="relative w-8 h-8 flex items-center justify-center cursor-pointer group"
          title="JARVIS System Core"
        >
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40 animate-spin-slow group-hover:border-[#FFD76A]" />
          <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#FFD76A] flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFF5C0] shadow-[0_0_6px_#FFD76A] animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-sans font-bold tracking-widest bg-gradient-to-r from-[#FFD76A] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">
              JARVIS
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37]/70 uppercase hidden sm:inline">
              v2.5
            </span>
          </div>
        </div>
      </div>

      {/* CENTER: Digital Clock & Date */}
      <div className="flex flex-col items-center justify-center">
        <span className="font-mono tabular-nums text-base tracking-wider text-[#E8EAF0] font-semibold">
          {timeStr}
        </span>
        <span className="text-[10px] font-sans tracking-wide text-[#D4AF37]/75">
          {dateStr}
        </span>
      </div>

      {/* RIGHT: Status, Settings, Controls */}
      <div className="flex items-center gap-3">
        {/* Online Status */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#E8EAF0] px-2.5 py-1 rounded-full bg-[#030712] border border-[#D4AF37]/25">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#FFD76A] shadow-[0_0_6px_#FFD76A]' : 'bg-red-400'}`} />
          <span className="text-[11px] font-sans tracking-wide text-[#FFD76A] font-medium">
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Audio Effects Toggle */}
        <button
          type="button"
          onClick={() => {
            soundFx.toggleExtraSound();
            setExtraSoundOn(soundFx.isExtraSoundEnabled());
          }}
          title={extraSoundOn ? 'Acoustic Sound Effects: Enabled' : 'Acoustic Sound Effects: Muted'}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            extraSoundOn
              ? 'border-[#D4AF37]/40 text-[#FFD76A] bg-[#D4AF37]/10'
              : 'border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {extraSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            if (onSettingsClick) onSettingsClick();
          }}
          title="Open Settings"
          className="p-1.5 rounded-lg border border-[#D4AF37]/30 text-slate-300 hover:text-[#FFD76A] hover:border-[#FFD76A]/50 hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Window controls (minimize, maximize, close) */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
          <button
            type="button"
            onClick={handleMinimize}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Maximize"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
