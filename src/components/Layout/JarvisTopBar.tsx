/**
 * JarvisTopBar Component
 *
 * Rebuilt Top Bar closely matching the reference desktop AI interface:
 * - Left: Glowing Arc Reactor icon + "JARVIS" (bold title) + "Your Personal AI Assistant"
 * - Center: Large digital clock (e.g. 14:28) with formatted date underneath
 * - Right:
 *    - Green status pill (Online)
 *    - Settings button
 *    - Profile / System avatar circle
 *    - Window controls (Minimize, Maximize, Close)
 */

import React, { useState, useEffect } from 'react';
import { Settings, User, Minus, Square, X } from 'lucide-react';
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
  const [timeStr, setTimeStr] = useState('14:28');
  const [dateStr, setDateStr] = useState('Sat, 17 May 2025');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);

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
    // Electron ipcRenderer fallback if available
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
    <header className="h-16 w-full px-5 py-2 flex items-center justify-between select-none relative z-30 bg-[#060b18]/80 backdrop-blur-xl border-b border-blue-900/30">
      {/* Subtle top ambient cyan illumination line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

      {/* LEFT: JARVIS Identity & Subtitle */}
      <div className="flex items-center gap-3.5">
        {/* Glowing Arc Reactor Emblem */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-spin-slow" />
          <div className="absolute inset-1 rounded-full border border-cyan-400/60 border-t-cyan-300" />
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.8)]">
            <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-pulse" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-sans font-extrabold tracking-wider text-white flex items-center gap-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            JARVIS
          </h1>
          <p className="text-[11px] text-cyan-400/80 font-sans font-medium tracking-wide">
            Your Personal AI Assistant
          </p>
        </div>
      </div>

      {/* CENTER: Digital Clock & Date */}
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-mono font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {timeStr}
        </span>
        <span className="text-[11px] text-zinc-400 font-sans tracking-wide">
          {dateStr}
        </span>
      </div>

      {/* RIGHT: Status Badge, Settings, Profile, Window Controls */}
      <div className="flex items-center gap-3">
        {/* Online / Offline Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.25)]">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-zinc-500'}`} />
          <span className="text-xs font-sans font-semibold text-emerald-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            if (onSettingsClick) onSettingsClick();
          }}
          title="Settings"
          className="w-9 h-9 rounded-full bg-[#0a1428]/80 hover:bg-[#122244] border border-blue-500/30 hover:border-cyan-400 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(0,140,255,0.15)]"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile / System Icon */}
        <button
          onClick={() => {
            soundFx.playClick();
            if (onProfileClick) onProfileClick();
          }}
          title="User Profile"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-700/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer transition-all"
        >
          <User className="w-4 h-4" />
        </button>

        {/* Window Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-800">
          <button
            onClick={handleMinimize}
            title="Minimize"
            className="w-7 h-7 rounded-md hover:bg-zinc-800/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            title="Maximize"
            className="w-7 h-7 rounded-md hover:bg-zinc-800/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="w-7 h-7 rounded-md hover:bg-red-600/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
