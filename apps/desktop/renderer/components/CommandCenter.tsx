/**
 * JARVIS Premium Futuristic AI Command Center Component
 *
 * Upgraded Layout:
 * 1. Top Status Bar (Integrated & contextualized)
 * 2. Left Sidebar (12 navigation items)
 * 3. Center Stage (Dominant 3D Avatar with concentric holographic circular rings,
 *    subtle ambient glow, state indicator, background grid/particles, smooth transitions)
 * 4. Right Intelligence Panel (AI ●, Voice ●, Memory ●, Privacy ● + Today's Tasks,
 *    Reminders, Calendar, Important Notifications, Recent Activity)
 * 5. Bottom Command Bar ("Ask JARVIS anything...", mic with aura, send button,
 *    waveform indicator, keyboard shortcuts, quick action chips)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AvatarState, AvatarSettingsConfig } from '../../../../src/avatar/types.ts';
import { avatarController } from '../../../../src/avatar/AvatarController.ts';
import { avatarSettings } from '../../../../src/avatar/AvatarSettings.ts';
import { avatarEventBus } from '../../../../src/avatar/AvatarEventBus.ts';
import { useVoiceEngine } from '../hooks/useVoiceEngine.ts';
import { LeftSidebar, SidebarNavId } from './LeftSidebar.tsx';
import { CenterStageHUD, CenterStageState } from './CenterStageHUD.tsx';
import { RightIntelligencePanel } from './RightIntelligencePanel.tsx';
import { BottomCommandBar } from './BottomCommandBar.tsx';

interface CommandCenterProps {
  assistantName: string;
  isOnline: boolean;
  isLoading: boolean;
  lastAssistantMessage?: string;
  onSendMessage: (text: string) => void;
  onOpenChat: () => void;
  onOpenTasks: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onOpenCalendar?: () => void;
  onOpenResearch?: () => void;
  onOpenApps?: () => void;
  onOpenNotifications?: () => void;
  onOpenLogs?: () => void;
  onOpenArchitecture?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  assistantName = 'JARVIS',
  isOnline,
  isLoading,
  lastAssistantMessage,
  onSendMessage,
  onOpenChat,
  onOpenTasks,
  onOpenMemory,
  onOpenSettings,
  onOpenCalendar,
  onOpenResearch,
  onOpenApps,
  onOpenNotifications,
  onOpenLogs,
  onOpenArchitecture,
}) => {
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [settings, setSettings] = useState<AvatarSettingsConfig>(() =>
    avatarSettings.getSettings()
  );
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeNav, setActiveNav] = useState<SidebarNavId>('command_center');

  // Voice Engine hook for speech-to-text and text-to-speech
  const {
    voiceState,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceEngine({
    onTranscriptComplete: (text) => {
      if (text.trim()) {
        onSendMessage(text.trim());
      }
    },
  });

  // Keep avatar state synchronized with Voice Engine and Assistant loading status
  useEffect(() => {
    if (isLoading) {
      avatarController.setState('THINKING');
      setAvatarState('THINKING');
    } else if (voiceState === 'LISTENING') {
      avatarController.setState('LISTENING');
      setAvatarState('LISTENING');
    } else if (voiceState === 'SPEAKING') {
      avatarController.setState('SPEAKING');
      setAvatarState('SPEAKING');
    } else {
      const curr = avatarController.stateManager.getState();
      setAvatarState(curr);
    }
  }, [isLoading, voiceState]);

  // Subscribe to Avatar Event Bus & Settings updates
  useEffect(() => {
    const unsub = avatarEventBus.onAny((event) => {
      if (event.payload?.state) {
        setAvatarState(event.payload.state);
      }
    });
    const unsubSettings = avatarSettings.subscribe(setSettings);
    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  // Speak assistant response when newly received and audio is not muted
  useEffect(() => {
    if (lastAssistantMessage && !isAudioMuted && !isLoading && voiceState !== 'LISTENING') {
      speak(lastAssistantMessage);
    }
  }, [lastAssistantMessage, isAudioMuted]);

  // Compute unified HUD state
  const centerStageState: CenterStageState = useMemo(() => {
    if (avatarState === 'ERROR') return 'ERROR';
    if (isLoading) return 'THINKING';
    if (voiceState === 'LISTENING' || avatarState === 'LISTENING') return 'LISTENING';
    if (voiceState === 'SPEAKING' || avatarState === 'SPEAKING') return 'SPEAKING';
    if (avatarState === 'HAPPY' || avatarState === 'EXCITED') return 'SUCCESS';
    return 'IDLE';
  }, [avatarState, isLoading, voiceState]);

  // Handle navigation from Left Sidebar
  const handleNavClick = (id: SidebarNavId) => {
    setActiveNav(id);
    switch (id) {
      case 'command_center':
        // already in command center
        break;
      case 'assistant':
        onOpenChat();
        break;
      case 'memory':
      case 'documents':
        onOpenMemory();
        break;
      case 'tasks':
        onOpenTasks();
        break;
      case 'calendar':
        if (onOpenCalendar) onOpenCalendar();
        break;
      case 'research':
        if (onOpenResearch) onOpenResearch();
        break;
      case 'apps':
        if (onOpenApps) onOpenApps();
        break;
      case 'notifications':
        if (onOpenNotifications) onOpenNotifications();
        break;
      case 'system_control':
        if (onOpenApps) onOpenApps();
        else if (onOpenLogs) onOpenLogs();
        break;
      case 'logs':
        if (onOpenLogs) onOpenLogs();
        break;
      case 'architecture':
        if (onOpenArchitecture) onOpenArchitecture();
        break;
      case 'settings':
        onOpenSettings();
        break;
      default:
        break;
    }
  };

  const handleToggleVoice = () => {
    if (voiceState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div
      id="jarvis-command-center"
      className="relative flex flex-col h-full w-full bg-[#06080e] text-slate-100 select-none overflow-hidden font-sans"
    >
      {/* Middle Workspace: Left Sidebar + Center Stage (Avatar) + Right Intelligence Panel */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* 1. Left Sidebar */}
        <LeftSidebar
          activeId={activeNav}
          onNavigate={handleNavClick}
          badgeCounts={{
            tasks: 3,
            notifications: 1,
            memory: 14,
          }}
        />

        {/* 2. Center Stage HUD with Dominant 3D Avatar and Holographic Rings */}
        <CenterStageHUD
          state={centerStageState}
          avatarState={avatarState}
          assistantName={assistantName}
          isOnline={isOnline}
          interimTranscript={interimTranscript}
          lastAssistantMessage={lastAssistantMessage}
          isAudioMuted={isAudioMuted}
          avatarEnabled={settings.enabled}
          onToggleAudioMute={() => setIsAudioMuted(!isAudioMuted)}
          onToggleAvatar={() =>
            avatarSettings.updateSettings({ enabled: !settings.enabled })
          }
        />

        {/* 3. Right Intelligence Panel */}
        <RightIntelligencePanel
          isOnline={isOnline}
          aiStatus={isOnline ? 'Online (Cloud)' : 'Airgap (Local)'}
          voiceStatus={voiceState === 'LISTENING' ? 'Listening' : voiceState === 'SPEAKING' ? 'Speaking' : 'Standby'}
          memoryCount={14}
          onOpenCalendar={onOpenCalendar}
          onOpenTasks={onOpenTasks}
          onOpenNotifications={onOpenNotifications}
        />
      </div>

      {/* 4. Bottom Command Bar */}
      <BottomCommandBar
        onSendMessage={onSendMessage}
        onToggleVoice={handleToggleVoice}
        isListening={voiceState === 'LISTENING'}
        voiceState={voiceState}
        isLoading={isLoading}
        assistantName={assistantName}
      />
    </div>
  );
};
