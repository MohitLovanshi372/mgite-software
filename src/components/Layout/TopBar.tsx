/**
 * TopBar Component
 * Cinematic technical header with Ultron Core identity, telemetry status pills,
 * real-time clock, date, security level, and window controls.
 */

import React, { useState, useEffect } from 'react';
import { Radio, Lock, Tv } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';
import { ScanlineIntensity } from '../Theme/UltronScanlineOverlay.tsx';
import { SpaceThemeId } from '../../types/spaceTheme.ts';
import { SpaceThemeDropdown } from '../Theme/SpaceThemeDropdown.tsx';

interface TopBarProps {
  onStatusClick?: () => void;
  onSecurityClick?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  aiState?: AIStateMode;
  scanlineIntensity?: ScanlineIntensity;
  onCycleScanlines?: () => void;
  currentSpaceTheme?: SpaceThemeId;
  spaceThemeHistory?: SpaceThemeId[];
  onSelectSpaceTheme?: (themeId: SpaceThemeId) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onStatusClick,
  onSecurityClick,
  isRightPanelOpen = true,
  onToggleRightPanel,
  aiState = 'IDLE',
  scanlineIntensity = 'CINEMA',
  onCycleScanlines,
  currentSpaceTheme,
  spaceThemeHistory,
  onSelectSpaceTheme,
}) => {
  const [timeStr, setTimeStr] = useState('12:40:17');
  const [dateStr, setDateStr] = useState('FRI, 13 SEP 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs}`);

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#07080c]/90 backdrop-blur-md border-b border-zinc-800/90 px-4 flex items-center justify-between font-mono select-none z-30 relative shadow-md">
      {/* Top Ambient Ultron Crimson & Galactic Violet Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-red-600 via-purple-600 via-red-500 to-cyan-500" />

      {/* LEFT: ULTRON GALAXY OS + Subtitle + Version + Telemetry Pills */}
      <div className="flex items-center gap-4">
        {/* Core Icon & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-[#120406] border border-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)] relative">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-xs shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">
                ULTRON GALAXY OS
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-red-950/90 border border-red-700 text-red-300 font-bold">
                PRIME v5.0
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 tracking-wider">
              GALACTIC OBSERVATORY & 3D GLB MODEL STUDIO
            </p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />

        {/* Clean status pill */}
        <div className="hidden lg:flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#140608] border border-red-900/80 text-red-200 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
            ULTRON CORE ONLINE
          </span>
        </div>
      </div>

      {/* RIGHT: Clock, Date, Security Level, Intel Panel toggle */}
      <div className="flex items-center gap-3">
        {/* Clock & Date */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold tracking-widest text-zinc-100 flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>{timeStr}</span>
          </div>
          <div className="text-[9px] text-zinc-400 tracking-wider">
            {dateStr}
          </div>
        </div>

        {/* Space Theme Quick-Switch Dropdown with Local History */}
        {onSelectSpaceTheme && currentSpaceTheme && (
          <SpaceThemeDropdown
            currentTheme={currentSpaceTheme}
            themeHistory={spaceThemeHistory || []}
            onSelectTheme={onSelectSpaceTheme}
          />
        )}

        {/* Ultron CRT Scanline Mode Toggle */}
        {onCycleScanlines && (
          <button
            onClick={onCycleScanlines}
            title={`CRT Scanline Engine: ${scanlineIntensity}. Sync State: ${aiState}. Click to cycle mode.`}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-xs transition-all cursor-pointer ${
              aiState === 'EXECUTING'
                ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse'
                : aiState === 'THINKING'
                ? 'bg-orange-950/90 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse'
                : scanlineIntensity === 'OFF'
                ? 'bg-[#090a0f] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                : 'bg-[#12141e] border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-zinc-700'
            }`}
          >
            <Tv className={`w-3 h-3 ${
              aiState === 'EXECUTING' ? 'text-red-400 animate-spin-slow' : aiState === 'THINKING' ? 'text-orange-400' : 'text-zinc-400'
            }`} />
            <span className="hidden xl:inline text-[9px] text-zinc-400">CRT RASTER:</span>
            <span className={aiState === 'EXECUTING' ? 'text-red-400 font-extrabold' : aiState === 'THINKING' ? 'text-orange-400 font-bold' : 'text-zinc-200'}>
              {scanlineIntensity}
            </span>
            {(aiState === 'THINKING' || aiState === 'EXECUTING') && (
              <span className={`w-1.5 h-1.5 rounded-full ${aiState === 'EXECUTING' ? 'bg-red-500 animate-ping' : 'bg-orange-500 animate-ping'}`} />
            )}
          </button>
        )}

        {/* Intelligence Panel Collapse/Expand Toggle */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            title={isRightPanelOpen ? "Collapse Intelligence Panel" : "Expand Intelligence Panel"}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-xs transition-all cursor-pointer ${
              isRightPanelOpen
                ? 'bg-[#12141e] border-red-600/70 text-red-400 shadow-[0_0_8px_rgba(220,38,38,0.25)]'
                : 'bg-[#090a0f] border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span className="hidden md:inline">INTEL PANEL</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRightPanelOpen
                  ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                  : 'bg-zinc-600'
              }`}
            />
          </button>
        )}

        {/* Security Badge */}
        <div
          onClick={onSecurityClick}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/40 border border-red-600/50 text-red-400 text-[10px] font-bold tracking-wider rounded-xs cursor-pointer hover:bg-red-950/70 transition-colors shadow-[0_0_8px_rgba(220,38,38,0.2)]"
        >
          <Lock className="w-3 h-3" />
          <span>PROTECTED</span>
        </div>
      </div>
    </header>
  );
};
