/**
 * TopBar Component
 * Cinematic technical header with Ultron Core identity, telemetry status pills,
 * real-time clock, date, security level, and window controls.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Terminal, Lock, Minus, Square, X, Bell } from 'lucide-react';

interface TopBarProps {
  onStatusClick?: () => void;
  onSecurityClick?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onSimulateNotification?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onStatusClick,
  onSecurityClick,
  isRightPanelOpen = true,
  onToggleRightPanel,
  onSimulateNotification,
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
    <header className="h-14 bg-[#07080c] border-b border-zinc-800/90 px-4 flex items-center justify-between font-mono select-none z-30 relative shadow-md">
      {/* Top Ambient Red Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/70 to-transparent" />

      {/* LEFT: ULTRON CORE + Subtitle + Version + Telemetry Pills */}
      <div className="flex items-center gap-4">
        {/* Core Icon & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-[#10121a] border border-red-600/70 flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.4)] relative">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-xs shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">
                ULTRON CORE
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
                v1.0.0
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 tracking-wider">
              AUTONOMOUS INTELLIGENCE SYSTEM
            </p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />

        {/* STATUS PILLS: SYSTEM ONLINE, CORE STABLE, NETWORK SECURE, VOICE READY */}
        <div className="hidden lg:flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0e1017] border border-zinc-800 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            SYSTEM ONLINE
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0e1017] border border-zinc-800 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            CORE STABLE
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0e1017] border border-zinc-800 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            NETWORK SECURE
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0e1017] border border-zinc-800 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
            VOICE READY
          </span>
        </div>
      </div>

      {/* RIGHT: Clock, Date, Security Level, Window Controls */}
      <div className="flex items-center gap-4">
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

        {/* Test Notification Ping Trigger */}
        {onSimulateNotification && (
          <button
            onClick={onSimulateNotification}
            title="Dispatch test notification (pulses the Intelligence panel)"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#0e1017] border border-zinc-800 hover:border-red-600/70 text-zinc-400 hover:text-red-400 text-[10px] font-bold rounded-xs transition-colors cursor-pointer"
          >
            <Bell className="w-3 h-3 text-red-500" />
            <span>+ PING</span>
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

        {/* Window controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
          <button
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer rounded-xs"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer rounded-xs"
            title="Maximize"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/60 transition-colors cursor-pointer rounded-xs"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
