/**
 * Main Application Entry Point
 * Cinematic Solar System & Celestial AI Operating System
 *
 * Full-screen HUD layout:
 * - TopBar: Identity, status telemetry, synchronized clock, security badge, window controls
 * - Sidebar: Mechanical & Astronomical Navigation Pages
 * - Main Center Stage: Active view with 3D Solar System & Bottom Command Console
 * - RightPanel: Live Radar sweep, System status, Background processes, Hardware telemetry, Activity feed
 * - Full interactive mock state cycle: IDLE -> LISTENING -> THINKING -> EXECUTING -> SPEAKING
 */

import React, { useState, useRef, useCallback } from 'react';
import { JarvisTopBar } from './components/Layout/JarvisTopBar.tsx';
import { JarvisLeftNav } from './components/Layout/JarvisLeftNav.tsx';
import { JarvisRightSidebar } from './components/Layout/JarvisRightSidebar.tsx';
import { JarvisVoiceStateCards } from './components/Layout/JarvisVoiceStateCards.tsx';
import { JarvisCommandBar } from './components/Layout/JarvisCommandBar.tsx';

// Pages - Core Essential Modules
import { CommandCenter } from './pages/CommandCenter.tsx';
import { ChatView } from './pages/ChatView.tsx';
import { TasksPage } from './pages/Tasks.tsx';
import { CalendarPage } from './pages/Calendar.tsx';
import { MemoryPage } from './pages/Memory.tsx';
import { NotificationsPage } from './pages/Notifications.tsx';
import { GLBStudioPage } from './pages/GLBStudioPage.tsx';
import { GalaxyViewPage } from './pages/GalaxyViewPage.tsx';
import { IntelligencePage } from './pages/Intelligence.tsx';
import { SystemControlPage } from './pages/SystemControl.tsx';
import { SettingsPage } from './pages/Settings.tsx';

import { NavigationPageId, AIStateMode, NotificationItem } from './types/index.ts';
import { LearnedGesture } from './types/gestures.ts';
import { initialNotifications } from './data/mockData.ts';
import { soundFx } from './utils/audioEffects.ts';
import { ultronVoice } from './utils/ultronVoice.ts';
import { cyberMusic } from './utils/cyberMusic.ts';
import { speechRecognitionService } from './utils/speechRecognitionService.ts';
import { parseHinglishCommand } from './utils/languageModel.ts';
import { pushToTalkService } from './utils/pushToTalkService.ts';
import { ProactiveAcknowledgmentEngine } from '../core/conversation/proactiveAcknowledgment.ts';
import { safeBrowserControl } from '../core/tools/browserControl.ts';
import { IntentDetector } from '../core/intent/intentDetector.ts';
import { SpaceCanvasStarfield } from './components/Theme/SpaceCanvasStarfield.tsx';
import { YouTubeFullPlayer } from './components/Media/YouTubeFullPlayer.tsx';
import { youtubePlayerService } from './utils/youtubePlayerService.ts';
import { AvatarEmotion } from './avatar/types.ts';
import {
  SpaceThemeId,
  DEFAULT_SPACE_THEME,
  DEFAULT_SPACE_THEME_HISTORY,
  SPACE_THEME_CATALOG,
} from './types/spaceTheme.ts';

export default function App() {
  const [activePage, setActivePage] = useState<NavigationPageId>('command_center');
  const [avatarState, setAvatarState] = useState<AIStateMode>('IDLE');
  const [controlledEmote, setControlledEmote] = useState<AvatarEmotion | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>(
    'JARVIS online. System vitals and 3D humanoid avatar ready. Standing by for commands.'
  );
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>('System Standby');

  // Space Star & Golden Space Theme State
  const [spaceThemeEnabled, setSpaceThemeEnabled] = useState<boolean>(true);
  const [currentSpaceTheme, setCurrentSpaceTheme] = useState<SpaceThemeId>(() => {
    const saved = localStorage.getItem('ultron_space_theme_active');
    return (saved as SpaceThemeId) && SPACE_THEME_CATALOG[saved as SpaceThemeId] && saved !== 'CRIMSON_NEBULA'
      ? (saved as SpaceThemeId)
      : 'SOLAR_GOLD';
  });

  const [spaceThemeHistory, setSpaceThemeHistory] = useState<SpaceThemeId[]>(() => {
    try {
      const saved = localStorage.getItem('ultron_space_theme_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id: any) => Boolean(SPACE_THEME_CATALOG[id as SpaceThemeId])) as SpaceThemeId[];
          if (valid.length > 0) return valid.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Failed to parse space theme history', e);
    }
    return DEFAULT_SPACE_THEME_HISTORY;
  });

  const handleSelectSpaceTheme = useCallback((themeId: SpaceThemeId) => {
    setCurrentSpaceTheme(themeId);
    localStorage.setItem('ultron_space_theme_active', themeId);
    soundFx.playClick();

    setSpaceThemeHistory((prevHistory) => {
      const filtered = prevHistory.filter((id) => id !== themeId);
      const updated = [themeId, ...filtered].slice(0, 3);
      localStorage.setItem('ultron_space_theme_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Notification State & Pulse Key
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [notificationPulseKey, setNotificationPulseKey] = useState<number>(0);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  // Auto-Speech Continuous Conversation State
  const [isAutoSpeechActive, setIsAutoSpeechActive] = useState<boolean>(false);
  const isAutoSpeechActiveRef = useRef<boolean>(false);
  const handleToggleListeningRef = useRef<((forceState?: boolean) => void) | null>(null);

  const speechTimeoutRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);

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

  // Stop current speech playback and return core to idle
  const handleStopSpeaking = useCallback(() => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    ultronVoice.stop();
    handleStateChange('IDLE');
    setCurrentTaskTitle('System Standby');
    dispatchNotification('Speech playback interrupted.', 'JARVIS AUDIO');
  }, [handleStateChange, dispatchNotification]);

  // Real Autonomous Execution Cycle (Mic/Text -> Gemini Backend AI -> Response -> Fish Audio TTS -> Audio Playback)
  const triggerAICycle = useCallback(
    async (commandText: string) => {
      const trimmed = commandText.trim();
      if (!trimmed) return;

      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      ultronVoice.stop();

      const lowerCmd = trimmed.toLowerCase();

      // Instant UI/Media interceptors for responsive tactile feedback
      if (lowerCmd.includes('change video') || lowerCmd.includes('next video') || lowerCmd.includes('next song') || lowerCmd.includes('agla video') || lowerCmd.includes('dusra gana')) {
        const nextVideo = youtubePlayerService.changeVideo('next');
        setActivePage('youtube_media');
        setLastAssistantMessage(`Playing next video: ${nextVideo.title}`);
        ultronVoice.speak(`Agla video play kar rahi hoon: ${nextVideo.title}`);
        return;
      }
      if (lowerCmd.includes('previous video') || lowerCmd.includes('pichla video') || lowerCmd.includes('previous song') || lowerCmd.includes('pichla gana')) {
        const prevVideo = youtubePlayerService.changeVideo('prev');
        setActivePage('youtube_media');
        setLastAssistantMessage(`Playing previous video: ${prevVideo.title}`);
        ultronVoice.speak(`Pichla video play kar rahi hoon: ${prevVideo.title}`);
        return;
      }
      if (lowerCmd.includes('pause video') || lowerCmd.includes('video roko') || lowerCmd.includes('video pause')) {
        youtubePlayerService.pause();
        setLastAssistantMessage('Video paused.');
        ultronVoice.speak('Video pause kar di gayi hai.');
        return;
      }
      if (lowerCmd.includes('resume video') || lowerCmd.includes('video chalu') || lowerCmd.includes('resume karo')) {
        youtubePlayerService.play();
        setLastAssistantMessage('Video resumed.');
        ultronVoice.speak('Video resume kar di gayi hai.');
        return;
      }
      if (lowerCmd.includes('download video') || lowerCmd.includes('download song') || lowerCmd.includes('video download')) {
        const format = lowerCmd.includes('audio') || lowerCmd.includes('mp3') ? 'MP3' : 'MP4';
        const dlTask = youtubePlayerService.download(format);
        setActivePage('youtube_media');
        setLastAssistantMessage(`Downloading ${dlTask.title} (${format})`);
        ultronVoice.speak(`Main ${dlTask.title} ka ${format} download shuru kar rahi hoon.`);
        return;
      }
      if (lowerCmd.includes('open youtube') || lowerCmd.includes('youtube kholo')) {
        safeBrowserControl.openYouTube();
        setActivePage('youtube_media');
        setLastAssistantMessage('Opening YouTube media center.');
        ultronVoice.speak('YouTube open kar rahi hoon.');
        return;
      }
      if (lowerCmd.includes('play music') || lowerCmd.includes('play video') || lowerCmd.includes('gaana chalao') || lowerCmd.includes('video chalao')) {
        const query = trimmed
          .replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[,\s]*/i, '')
          .replace(/\b(play|video|music|chalao|gaana|gana|on youtube|bajaao|bajao)\b/gi, '')
          .trim();
        if (query) {
          const searched = youtubePlayerService.searchAndPlay(query);
          setActivePage('youtube_media');
          setLastAssistantMessage(`Playing: ${searched.title}`);
          ultronVoice.speak(`${searched.title} play kar rahi hoon.`);
          return;
        }
      }
      if (lowerCmd.includes('avatar smile') || lowerCmd.includes('smile karo')) {
        setControlledEmote('happy');
      } else if (lowerCmd.includes('avatar nod') || lowerCmd.includes('nod karo')) {
        setControlledEmote('friendly');
      } else if (lowerCmd.includes('avatar think') || lowerCmd.includes('socho')) {
        setControlledEmote('thinking');
      } else if (lowerCmd.includes('avatar serious')) {
        setControlledEmote('serious');
      } else if (lowerCmd.includes('avatar excited')) {
        setControlledEmote('excited');
      } else if (lowerCmd.includes('avatar normal') || lowerCmd.includes('auto emote')) {
        setControlledEmote(null);
      }

      // Quick navigation intents
      if (lowerCmd.includes('tasks dikhao') || lowerCmd.includes('open tasks') || lowerCmd.includes('aaj kya karna hai')) {
        setActivePage('tasks');
      } else if (lowerCmd.includes('reminders') || lowerCmd.includes('calendar') || lowerCmd.includes('yaad dilana') || lowerCmd.includes('remind me')) {
        setActivePage('calendar');
      } else if (lowerCmd.includes('glb studio') || lowerCmd.includes('3d model') || lowerCmd.includes('avatar mode')) {
        setActivePage('glb_studio');
      }

      // 1. Transition state to THINKING
      handleStateChange('THINKING');
      setIsListening(false);
      setInterimTranscript('');
      setCurrentTaskTitle(`Gemini Brain: ${trimmed.slice(0, 24)}...`);

      try {
        // Real Backend Call to Gemini AI Brain
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationIdRef.current || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.conversationId) {
          conversationIdRef.current = data.conversationId;
        }

        const aiResponseText: string = data.response || 'Affirmative. Directive processed.';
        setLastAssistantMessage(aiResponseText);
        setCurrentTaskTitle(`Speaking: ${aiResponseText.slice(0, 24)}...`);

        if (data.emotion) {
          setControlledEmote(data.emotion);
        }

        // 2. Transition state to SPEAKING
        handleStateChange('SPEAKING');

        // 3. Fish Audio TTS -> Audio Playback & Audio-reactive Core Waveform
        ultronVoice.speak(aiResponseText, {
          onEnd: () => {
            handleStateChange('SUCCESS');
            dispatchNotification(
              `Directive completed: "${trimmed.slice(0, 36)}"`,
              'JARVIS BRAIN'
            );
            speechTimeoutRef.current = setTimeout(() => {
              handleStateChange('IDLE');
              setCurrentTaskTitle('System Standby');
              if (isAutoSpeechActiveRef.current && handleToggleListeningRef.current) {
                setTimeout(() => {
                  handleToggleListeningRef.current?.(true);
                }, 400);
              }
            }, 1200);
          },
          onError: () => {
            handleStateChange('SUCCESS');
            speechTimeoutRef.current = setTimeout(() => {
              handleStateChange('IDLE');
              setCurrentTaskTitle('System Standby');
            }, 1000);
          },
        });
      } catch (err: any) {
        const errorMsg = `Neural Core Error: ${err.message || 'Unable to communicate with AI provider'}`;
        setLastAssistantMessage(errorMsg);
        dispatchNotification(errorMsg, 'AI ERROR', true);
        handleStateChange('IDLE');
        setCurrentTaskTitle('System Standby');
        ultronVoice.speak('AI service temporarily unreachable. Standing by.');
      }
    },
    [handleStateChange, dispatchNotification]
  );

  const handleToggleListening = useCallback((forceState?: boolean) => {
    const shouldListen = forceState !== undefined ? forceState : !isListening;

    if (!shouldListen) {
      speechRecognitionService.stopListening();
      setIsListening(false);
      handleStateChange('IDLE');
      setInterimTranscript('');
      ultronVoice.stop();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    } else {
      if (speechRecognitionService.isSupported()) {
        const started = speechRecognitionService.startListening({
          language: 'auto',
          enginePriority: ['en-IN', 'hi-IN', 'en-US'], // Prioritizes Indian English & Hindi mixed detection engines
          onStart: (engine) => {
            handleStateChange('LISTENING');
            setIsListening(true);
            setInterimTranscript(`Listening [${engine}] (Hindi / Hinglish / English)...`);
          },
          onInterim: (text) => {
            setInterimTranscript(text);
          },
          onResult: (finalText) => {
            setInterimTranscript(finalText);
            speechRecognitionService.stopListening();
            triggerAICycle(finalText);
          },
          onError: () => {
            setIsListening(false);
            handleStateChange('IDLE');
            dispatchNotification('Microphone unavailable or timed out.', 'SPEECH STT');
          },
        });
        if (!started) {
          triggerAICycle('Jarvis, system status dikhao');
        }
      } else {
        triggerAICycle('Jarvis, system status dikhao');
      }
    }
  }, [isListening, handleStateChange, dispatchNotification, triggerAICycle]);

  handleToggleListeningRef.current = handleToggleListening;

  const handleToggleAutoSpeech = useCallback(() => {
    setIsAutoSpeechActive((prev) => {
      const next = !prev;
      isAutoSpeechActiveRef.current = next;
      if (next) {
        soundFx.playSuccess();
        dispatchNotification('Auto-Speech Conversations Active. Continuous voice chat engaged.', 'SPEECH AI');
        handleToggleListening(true);
      } else {
        soundFx.playClick();
        dispatchNotification('Auto-Speech Conversations Deactivated.', 'SPEECH AI');
      }
      return next;
    });
  }, [dispatchNotification, handleToggleListening]);

  // Push-to-Talk (Ctrl+Space chord) listener subscription
  React.useEffect(() => {
    pushToTalkService.initKeyListeners();
    const unsubscribePTT = pushToTalkService.subscribe((isHolding) => {
      if (pushToTalkService.isPushToTalkEnabled()) {
        if (isHolding) {
          handleToggleListening(true);
        } else {
          handleToggleListening(false);
        }
      }
    });

    return () => {
      unsubscribePTT();
    };
  }, [handleToggleListening]);

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
            controlledEmote={controlledEmote}
            onEmoteChange={(emote) => setControlledEmote(emote)}
            isAutoSpeechActive={isAutoSpeechActive}
            onToggleAutoSpeech={handleToggleAutoSpeech}
            onGestureTrigger={(gesture: LearnedGesture) => {
              dispatchNotification(
                `Optical Gesture Recognized: "${gesture.name}" -> ${gesture.triggerAction}`,
                'OPTICAL LAB'
              );

              // Gesture direct execution hooks
              if (gesture.type === 'THUMBS_UP') {
                cyberMusic.play('ULTRON CYBER MATRIX (SYNTH)');
                const msg = 'Thumbs up detected. Commencing cyber audio telemetry.';
                setLastAssistantMessage(msg);
                ultronVoice.speak(msg);
              } else if (gesture.type === 'OPEN_PALM') {
                cyberMusic.stop();
                const msg = 'Open palm halt detected. Halting audio streams and locking defensive perimeter.';
                setLastAssistantMessage(msg);
                ultronVoice.speak(msg);
              } else if (gesture.type === 'VICTORY_PEACE') {
                setActivePage('glb_studio');
                const msg = 'Peace gesture detected. Navigating to 3D GLB Model Studio.';
                setLastAssistantMessage(msg);
                ultronVoice.speak(msg);
              } else {
                setLastAssistantMessage(
                  `Optical gesture received: [${gesture.name}]. Autonomous action: "${gesture.triggerAction}" dispatched.`
                );
                ultronVoice.speak(`Gesture confirmed. Executing ${gesture.name}.`);
              }
            }}
          />
        );
      case 'chat':
        return (
          <ChatView
            onSendMessage={triggerAICycle}
            lastAssistantMessage={lastAssistantMessage}
          />
        );
      case 'voice':
        return <SystemControlPage onNavigate={(page) => setActivePage(page)} />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'memory':
        return <MemoryPage />;
      case 'tools':
        return (
          <IntelligencePage
            currentAIState={avatarState}
            onExecuteCommand={(command, mappedState) => {
              dispatchNotification(`Directive executed: ${command}`, 'TOOLS');
              if (mappedState) {
                handleStateChange(mappedState);
              }
              setLastAssistantMessage(`Executed: [${command}]. State: ${mappedState || avatarState}.`);
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationsPage
            notifications={notifications}
            onMarkRead={(id) => {
              setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
            }}
            onMarkAll={() => {
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            onClearAll={() => setNotifications([])}
          />
        );
      case 'glb_studio':
        return <GLBStudioPage />;
      case 'galaxy_view':
        return <GalaxyViewPage />;
      case 'intelligence':
        return (
          <IntelligencePage
            currentAIState={avatarState}
            onExecuteCommand={(command, mappedState) => {
              dispatchNotification(`Gesture directive executed: ${command}`, 'GESTURE CALIBRATION');
              if (mappedState) {
                handleStateChange(mappedState);
              }
              setLastAssistantMessage(`Calibrated gesture triggered directive: [${command}]. State mapped: ${mappedState || avatarState}.`);
            }}
          />
        );
      case 'system_control':
        return <SystemControlPage onNavigate={(page) => setActivePage(page)} />;
      case 'settings':
        return <SettingsPage />;
      case 'youtube_media':
        return (
          <div className="w-full h-full p-4 overflow-y-auto bg-[#040915] rounded-2xl border border-cyan-500/25">
            <YouTubeFullPlayer className="max-w-5xl mx-auto" />
          </div>
        );
      default:
        return null;
    }
  };

  const handleQuickAction = useCallback(
    (actionKey: 'system_status' | 'open_youtube' | 'create_reminder' | 'take_note') => {
      soundFx.playClick();
      switch (actionKey) {
        case 'system_status':
          triggerAICycle('Mera system status batao');
          break;
        case 'open_youtube':
          triggerAICycle('YouTube kholo');
          break;
        case 'create_reminder':
          triggerAICycle('Kal 10 baje yaad dilana');
          break;
        case 'take_note':
          triggerAICycle('Ek note likho');
          break;
      }
    },
    [triggerAICycle]
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      id="jarvis-desktop-app"
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#030712] text-[#E8EAF0] font-sans select-none relative"
    >
      {/* 0. Immersive Golden Space Starfield Backdrop */}
      {spaceThemeEnabled && (
        <SpaceCanvasStarfield
          state={avatarState}
          theme={currentSpaceTheme}
          enableInteractiveWaves={false}
        />
      )}

      {/* 1. Futuristic Top Bar matching reference image */}
      <JarvisTopBar
        onSettingsClick={() => setActivePage('settings')}
        onProfileClick={() => setActivePage('command_center')}
        isOnline={true}
      />

      {/* 2. Main Three-Column Desktop Workspace (Left Nav + Center Stage + Right Sidebar) */}
      <div className="flex-1 flex min-h-0 overflow-hidden px-4 pb-3 pt-2 gap-3.5 relative z-10">
        {/* Left Vertical Navigation */}
        <JarvisLeftNav
          activePage={activePage}
          onNavigate={(page) => {
            soundFx.playClick();
            setActivePage(page);
          }}
          unreadCount={unreadNotificationsCount}
        />

        {/* Center Main Stage Column (Avatar Stage + Voice Cards + Bottom Command Area) */}
        <main className="flex-1 min-w-0 flex flex-col h-full gap-2.5 relative">
          {/* Dedicated Center Stage View Area */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {renderActivePage()}
          </div>

          {/* Voice State Cards (Listening, Thinking, Speaking, Completed) */}
          <div className="shrink-0">
            <JarvisVoiceStateCards
              currentState={avatarState}
              onSelectState={handleStateChange}
            />
          </div>

          {/* Bottom Command Area (Microphone button + "Ask JARVIS anything..." + Suggested Pills) */}
          <div className="shrink-0">
            <JarvisCommandBar
              onExecute={triggerAICycle}
              isListening={isListening}
              onToggleListening={handleToggleListening}
              onStop={handleStopSpeaking}
              isSpeaking={avatarState === 'SPEAKING'}
            />
          </div>
        </main>

        {/* Right Intelligence Sidebar (System Status, Current Task, Security, Quick Actions) */}
        <JarvisRightSidebar
          currentTaskTitle={currentTaskTitle}
          isTaskRunning={avatarState === 'THINKING' || avatarState === 'EXECUTING'}
          geminiConnected={true}
          voiceReady={true}
          ttsReady={true}
          onVoicePersonaChange={(persona) => ultronVoice.setVoicePersona(persona)}
          onLanguageChange={(lang) => ultronVoice.setLanguageMode(lang)}
          onQuickAction={(actionKey) => {
            if (actionKey === 'open_tasks') {
              setActivePage('tasks');
            } else if (actionKey === 'create_reminder') {
              setActivePage('calendar');
            } else {
              handleQuickAction(actionKey as any);
            }
          }}
        />
      </div>
    </div>
  );
}
