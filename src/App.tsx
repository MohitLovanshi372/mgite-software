/**
 * Main Application Entry Point
 * Cinematic Autonomous Robotic AI Operating System (Ultron Aesthetic)
 *
 * Full-screen HUD layout:
 * - TopBar: Identity, status telemetry, synchronized clock, security badge, window controls
 * - Sidebar: 14 Mechanical Navigation Pages
 * - Main Center Stage: Active view with 3D Robotic AI Core & Bottom Command Console
 * - RightPanel: Live Radar sweep, System status, Background processes, Hardware telemetry, Activity feed
 * - Full interactive mock state cycle: IDLE -> LISTENING -> THINKING -> EXECUTING -> SPEAKING
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { TopBar } from './components/Layout/TopBar.tsx';
import { Sidebar } from './components/Layout/Sidebar.tsx';
import { RightPanel } from './components/Layout/RightPanel.tsx';
import { CommandConsole } from './components/Layout/CommandConsole.tsx';

// Pages
import { CommandCenter } from './pages/CommandCenter.tsx';
import { IntelligencePage } from './pages/Intelligence.tsx';
import { MemoryPage } from './pages/Memory.tsx';
import { TasksPage } from './pages/Tasks.tsx';
import { CalendarPage } from './pages/Calendar.tsx';
import { ResearchPage } from './pages/Research.tsx';
import { DocumentsPage } from './pages/Documents.tsx';
import { ApplicationsPage } from './pages/Applications.tsx';
import { NotificationsPage } from './pages/Notifications.tsx';
import { SystemControlPage } from './pages/SystemControl.tsx';
import { NetworkPage } from './pages/Network.tsx';
import { LogsPage } from './pages/Logs.tsx';
import { ArchitecturePage } from './pages/Architecture.tsx';
import { SettingsPage } from './pages/Settings.tsx';

import { NavigationPageId, AIStateMode, NotificationItem } from './types/index.ts';
import { LearnedGesture } from './types/gestures.ts';
import { initialNotifications } from './data/mockData.ts';
import { soundFx } from './utils/audioEffects.ts';
import { ultronVoice } from './utils/ultronVoice.ts';

export default function App() {
  const [activePage, setActivePage] = useState<NavigationPageId>('command_center');
  const [avatarState, setAvatarState] = useState<AIStateMode>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>(
    'Systems online. Sovereign airgap barrier verified. I observe. I analyze. I act.'
  );

  // Right Intelligence Panel Visibility State (for entry/exit animations)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Notification State & Pulse Key (pulses the Right Intelligence Panel on new alerts)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [notificationPulseKey, setNotificationPulseKey] = useState<number>(0);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  const speechTimeoutRef = useRef<any>(null);

  const handleStateChange = useCallback((newState: AIStateMode) => {
    setAvatarState(newState);
    soundFx.playStateSound(newState);
  }, []);

  // Autonomous Notification Dispatch (adds notification, pulses right panel, plays acoustic ping)
  const dispatchNotification = useCallback(
    (title: string, subsystem = 'AUTONOMOUS SENTINEL', isUrgent = false) => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subsystem,
        title,
        time: timeStr,
        isUrgent,
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setLatestNotification(newNotif);
      setNotificationPulseKey((prev) => prev + 1);
      soundFx.playNotificationPing();
    },
    []
  );

  // Autonomous Execution Cycle
  const triggerAICycle = useCallback(
    (commandText: string) => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

      // 1. LISTENING
      handleStateChange('LISTENING');
      setIsListening(true);
      setInterimTranscript(commandText);

      // 2. THINKING (1.2s)
      speechTimeoutRef.current = setTimeout(() => {
        handleStateChange('THINKING');
        setIsListening(false);
        setInterimTranscript('');

        // 3. EXECUTING (1.4s)
        speechTimeoutRef.current = setTimeout(() => {
          handleStateChange('EXECUTING');

          // 4. SPEAKING (1.3s)
          speechTimeoutRef.current = setTimeout(() => {
            handleStateChange('SPEAKING');

            const responses = [
              `Directive recognized: "${commandText}". Local vector graphs indexed. Kinematic servos executing.`,
              `Affirmative. "${commandText}" executed under sovereign clearance. Zero telemetry egress.`,
              `Neural synthesis complete for: "${commandText}". Internal registers locked and nominal.`,
              `Autonomous plan finalized. All tasks, schedules, and process bridges synchronized.`,
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            setLastAssistantMessage(response);

            // Trigger Ultron Deep Voice Speech Synthesis
            ultronVoice.speak(response, {
              onEnd: () => {
                handleStateChange('SUCCESS');
                dispatchNotification(
                  `Directive executed: "${commandText.slice(0, 42)}"`,
                  'DIRECTIVE ENGINE'
                );
                speechTimeoutRef.current = setTimeout(() => {
                  handleStateChange('IDLE');
                }, 1800);
              },
              onError: () => {
                handleStateChange('SUCCESS');
                speechTimeoutRef.current = setTimeout(() => {
                  handleStateChange('IDLE');
                }, 1800);
              },
            });
          }, 1300);
        }, 1400);
      }, 1200);
    },
    [handleStateChange, dispatchNotification]
  );

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
      handleStateChange('IDLE');
      setInterimTranscript('');
      ultronVoice.stop();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    } else {
      triggerAICycle('Analyze system defense perimeter and pending directives.');
    }
  };

  const handleSecurityAlert = () => {
    if (avatarState === 'SECURITY_ALERT') {
      handleStateChange('IDLE');
      const msg = 'Security alarm silenced. Perimeter returned to nominal standby.';
      setLastAssistantMessage(msg);
      ultronVoice.speak(msg);
    } else {
      handleStateChange('SECURITY_ALERT');
      const alertMsg = 'CRITICAL ALERT: Unauthorized network probing intercepted by airgap sentinel.';
      setLastAssistantMessage(alertMsg);
      ultronVoice.speak(alertMsg);
    }
  };

  const handleThreatChange = (threat: 'LOW' | 'ELEVATED' | 'CRITICAL') => {
    if (threat === 'CRITICAL') {
      handleStateChange('SECURITY_ALERT');
    } else if (threat === 'ELEVATED') {
      handleStateChange('THINKING');
    } else {
      handleStateChange('IDLE');
    }
  };

  // Render the selected view
  const renderActivePage = () => {
    switch (activePage) {
      case 'command_center':
        return (
          <CommandCenter
            avatarState={avatarState}
            onAvatarStateChange={handleStateChange}
            interimTranscript={interimTranscript}
            lastAssistantMessage={lastAssistantMessage}
            onGestureTrigger={(gesture: LearnedGesture) => {
              dispatchNotification(
                `Optical Gesture Recognized: "${gesture.name}" -> ${gesture.triggerAction}`,
                'OPTICAL LAB'
              );
              setLastAssistantMessage(
                `Optical gesture received: [${gesture.name}]. Autonomous action: "${gesture.triggerAction}" dispatched.`
              );
              ultronVoice.speak(`Gesture confirmed. Executing ${gesture.name}.`);
            }}
          />
        );
      case 'intelligence':
        return <IntelligencePage />;
      case 'memory':
        return <MemoryPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'research':
        return <ResearchPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'notifications':
        return (
          <NotificationsPage
            notifications={notifications}
            onMarkAll={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onClearAll={() => setNotifications([])}
            onDispatchTest={() =>
              dispatchNotification(
                'Manual security dispatch: Airgap isolation barrier confirmed.',
                'SECURITY SENTINEL'
              )
            }
          />
        );
      case 'system_control':
        return <SystemControlPage />;
      case 'network':
        return <NetworkPage />;
      case 'logs':
        return <LogsPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      id="ultron-root-app"
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#020306] text-zinc-100 font-mono select-none"
    >
      {/* 1. Futuristic Top Bar */}
      <TopBar
        onSecurityClick={handleSecurityAlert}
        onStatusClick={() => setActivePage('system_control')}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => {
          soundFx.playClick();
          setIsRightPanelOpen((prev) => !prev);
        }}
        onSimulateNotification={() => {
          const alertPool = [
            { title: 'Subsystem ping verified: Optical sensory grid nominal.', sys: 'PERIMETER RADAR' },
            { title: 'Airgap firewall audit completed: Zero telemetry egress detected.', sys: 'SECURITY SENTINEL' },
            { title: 'Neural weight matrix re-synchronized across active memory registers.', sys: 'CORE INFERENCE' },
            { title: 'Autonomous background task scheduled: Thermal dissipation verified.', sys: 'HARDWARE TELEMETRY' },
          ];
          const pick = alertPool[Math.floor(Math.random() * alertPool.length)];
          dispatchNotification(pick.title, pick.sys);
        }}
      />

      {/* 2. Main Three-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar (14 pages) */}
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            soundFx.playClick();
            setActivePage(page);
          }}
          badgeCounts={{ tasks: 3, notifications: unreadNotificationsCount, memory: 4 }}
        />

        {/* Center Main Stage View (Active page + Command Console) */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#040508] relative">
          <div className="flex-1 overflow-hidden relative">
            {renderActivePage()}
          </div>

          {/* Bottom Command Console (Always accessible across views or in Command Center) */}
          <CommandConsole
            onExecute={triggerAICycle}
            isListening={isListening}
            onToggleListening={handleToggleListening}
            onNavigate={(page) => {
              soundFx.playClick();
              setActivePage(page);
            }}
          />
        </main>

        {/* Right Intelligence Panel with Framer Motion entry, exit & notification pulse */}
        <AnimatePresence mode="wait">
          {isRightPanelOpen && (
            <RightPanel
              key="right-intelligence-panel"
              onThreatChange={handleThreatChange}
              onClose={() => {
                soundFx.playClick();
                setIsRightPanelOpen(false);
              }}
              notificationPulseKey={notificationPulseKey}
              latestNotification={latestNotification}
              onTriggerTestNotification={() =>
                dispatchNotification(
                  'Sensory grid ping: Thermal flux stabilized across GPU nodes.',
                  'TELEMETRY SENTINEL'
                )
              }
            />
          )}
        </AnimatePresence>

        {/* Sleek floating expand tab when Right Panel is collapsed */}
        <AnimatePresence>
          {!isRightPanelOpen && (
            <motion.button
              key="intel-expand-handle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                soundFx.playClick();
                setIsRightPanelOpen(true);
              }}
              title="Expand Intelligence Panel"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#07080c]/95 border-l border-t border-b border-red-600/70 hover:border-red-500 text-zinc-300 hover:text-red-400 py-3.5 px-1.5 flex flex-col items-center gap-2 rounded-l-xs shadow-[-4px_0_14px_rgba(220,38,38,0.3)] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
                INTEL // EXPAND
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
