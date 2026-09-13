/**
 * RightPanel Component
 * Right Intelligence Panel with subtle Framer Motion entry and exit animations,
 * and a subtle pulse reaction when new notifications arrive.
 *
 * Contains:
 * - Top HUD header with collapse control and quick ping test trigger
 * - Animated new notification alert banner
 * - Perimeter Radar Sensors
 * - System Status telemetry
 * - Current Background Process & Threat Level
 * - Live Hardware Telemetry
 * - Recent Activity Stream
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, X, Radio, ShieldAlert } from 'lucide-react';
import { HUDFrame } from '../HUD/HUDFrame.tsx';
import { SystemStatus } from '../Dashboard/SystemStatus.tsx';
import { CurrentProcess } from '../Dashboard/CurrentProcess.tsx';
import { ActivityFeed } from '../Dashboard/ActivityFeed.tsx';
import { Telemetry } from '../HUD/Telemetry.tsx';
import { Radar } from '../HUD/Radar.tsx';
import { NotificationItem } from '../../types/index.ts';

interface RightPanelProps {
  onThreatChange?: (threat: 'LOW' | 'ELEVATED' | 'CRITICAL') => void;
  onClose?: () => void;
  notificationPulseKey?: number;
  latestNotification?: NotificationItem | null;
  onTriggerTestNotification?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  onThreatChange,
  onClose,
  notificationPulseKey = 0,
  latestNotification,
  onTriggerTestNotification,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const isInitialMount = useRef(true);

  // Trigger pulse animation whenever a new notification is dispatched
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (notificationPulseKey > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [notificationPulseKey]);

  return (
    <motion.aside
      id="right-intelligence-panel"
      initial={{ x: 120, opacity: 0 }}
      animate={
        isPulsing
          ? {
              x: 0,
              opacity: 1,
              scale: [1, 1.012, 0.997, 1],
              borderColor: [
                'rgba(39, 39, 42, 0.9)',
                'rgba(239, 68, 68, 0.9)',
                'rgba(220, 38, 38, 0.6)',
                'rgba(39, 39, 42, 0.9)',
              ],
              boxShadow: [
                '0 0 0px rgba(220, 38, 38, 0)',
                '-6px 0 28px rgba(220, 38, 38, 0.4), inset 0 0 16px rgba(220, 38, 38, 0.2)',
                '0 0 0px rgba(220, 38, 38, 0)',
              ],
            }
          : {
              x: 0,
              opacity: 1,
              scale: 1,
              borderColor: 'rgba(39, 39, 42, 0.9)',
              boxShadow: 'none',
            }
      }
      exit={{
        x: '100%',
        opacity: 0,
        transition: {
          duration: 0.32,
          ease: [0.32, 0, 0.67, 0],
        },
      }}
      transition={
        isPulsing
          ? {
              duration: 1.0,
              ease: 'easeInOut',
            }
          : {
              type: 'spring',
              stiffness: 240,
              damping: 26,
              mass: 0.85,
            }
      }
      className="w-72 lg:w-80 bg-[#07080c]/95 border-l border-zinc-800/90 flex flex-col h-full z-20 shrink-0 font-mono select-none overflow-y-auto custom-scrollbar p-3 space-y-3 relative"
    >
      {/* Top Header Bar with status & controls */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-zinc-200 uppercase">
              INTELLIGENCE
            </span>
            <span className="text-[8px] text-zinc-400">
              TELEMETRY & SENSORS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Notification Pulse Test Trigger */}
          {onTriggerTestNotification && (
            <button
              onClick={onTriggerTestNotification}
              title="Dispatch test notification to pulse panel"
              className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-red-600/70 text-zinc-400 hover:text-red-400 text-[9px] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-2.5 h-2.5 text-red-500" />
              <span>TEST PING</span>
            </button>
          )}

          {/* Close / Collapse button to test exit animation */}
          {onClose && (
            <button
              onClick={onClose}
              title="Collapse Intelligence Panel"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-zinc-800 rounded-xs transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle notification dispatch banner when pulsing */}
      <AnimatePresence>
        {isPulsing && latestNotification && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-2.5 bg-red-950/70 border border-red-500/80 rounded-xs shadow-[0_0_12px_rgba(220,38,38,0.3)]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-red-400 flex items-center gap-1 tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                DISPATCH SIGNAL DETECTED
              </span>
              <span className="text-[8px] text-zinc-400">{latestNotification.time}</span>
            </div>
            <div className="text-[10px] text-zinc-200 font-sans font-medium line-clamp-2 leading-tight">
              {latestNotification.title}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Radar Scanning Reticle */}
      <HUDFrame title="PERIMETER SENSORS" badge="ACTIVE" badgeColor="red">
        <Radar />
      </HUDFrame>

      {/* 2. System Status */}
      <HUDFrame title="SYSTEM STATUS" badge="ONLINE" badgeColor="emerald">
        <SystemStatus />
      </HUDFrame>

      {/* 3. Current Process & Threat Level */}
      <HUDFrame title="BACKGROUND PROCESS" badge="ACTIVE" badgeColor="red">
        <CurrentProcess onThreatChange={onThreatChange} />
      </HUDFrame>

      {/* 4. Live Hardware Telemetry */}
      <HUDFrame title="HARDWARE TELEMETRY" badge="NOMINAL" badgeColor="red">
        <Telemetry />
      </HUDFrame>

      {/* 5. Recent Activity Feed */}
      <HUDFrame title="RECENT ACTIVITY" badge="STREAM" badgeColor="gray">
        <ActivityFeed />
      </HUDFrame>
    </motion.aside>
  );
};
