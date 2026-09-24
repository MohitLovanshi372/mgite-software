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

  // Space Star & Neural Wave Theme State with Local Storage & 3-Slot History
  const [spaceThemeEnabled, setSpaceThemeEnabled] = useState<boolean>(true);
  const [currentSpaceTheme, setCurrentSpaceTheme] = useState<SpaceThemeId>(() => {
    const saved = localStorage.getItem('ultron_space_theme_active');
    return (saved as SpaceThemeId) && SPACE_THEME_CATALOG[saved as SpaceThemeId]
      ? (saved as SpaceThemeId)
      : DEFAULT_SPACE_THEME;
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

      // Track active task title
      const lowerCmd = commandText.toLowerCase();
      if (lowerCmd.includes('youtube')) {
        setCurrentTaskTitle('Searching YouTube... Arijit Singh');
      } else if (lowerCmd.includes('status')) {
        setCurrentTaskTitle('Checking System Status...');
      } else if (lowerCmd.includes('yaad') || lowerCmd.includes('remind')) {
        setCurrentTaskTitle('Creating Reminder Directive...');
      } else if (lowerCmd.includes('note')) {
        setCurrentTaskTitle('Recording Encrypted Note...');
      } else {
        setCurrentTaskTitle(`Processing: ${commandText.slice(0, 24)}...`);
      }

      // Proactive Acknowledgment Engine ("answers before it works" - bridges the tool-writing silence)
      const proactiveAck = ProactiveAcknowledgmentEngine.generateImmediateAcknowledgment(commandText);
      if (proactiveAck.isSpoken) {
        setLastAssistantMessage(proactiveAck.text);
        ultronVoice.speak(proactiveAck.text);
      }

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

            const lowerCmd = commandText.toLowerCase();
            const parsedHinglish = parseHinglishCommand(commandText);
            const intentResult = IntentDetector.detectIntent(commandText);
            let customResponse: string | null = null;

            // Dictionary-based Hindi & Hinglish Command Evaluation
            if (parsedHinglish.target === 'light' && parsedHinglish.action === 'turn_on') {
              customResponse = 'Light on kar di gayi hai. Optical illumination systems online and fully energized.';
            } else if (parsedHinglish.target === 'light' && parsedHinglish.action === 'turn_off') {
              customResponse = 'Light band kar di gayi hai. Stealth illumination engaged.';
            } else if (
              lowerCmd.includes('mera system status') ||
              lowerCmd.includes('system status batao') ||
              lowerCmd.includes('सिस्टम स्टेटस बताओ') ||
              parsedHinglish.target === 'system_status' ||
              parsedHinglish.action === 'status' ||
              lowerCmd.includes('system status dikhao') ||
              lowerCmd.includes('status dikhao') ||
              lowerCmd.includes('सिस्टम स्टेटस दिखाओ')
            ) {
              setActivePage('command_center');
              customResponse = 'Bilkul, main aapke system ka status check karti hoon.';
            } else if (
              lowerCmd.includes('yaad dilana') ||
              lowerCmd.includes('yaad dila') ||
              lowerCmd.includes('याद दिलाना') ||
              lowerCmd.includes('remind me')
            ) {
              if (lowerCmd.includes('10 baje') || lowerCmd.includes('10:00')) {
                customResponse = 'Bilkul, kal 10 baje main aapko yaad dilaungi.';
              } else {
                customResponse = 'Bilkul, main aapko samay par yaad dilaungi.';
              }
            } else if (
              lowerCmd.includes('kya haal hai') ||
              lowerCmd.includes('kya chal raha hai') ||
              lowerCmd.includes('क्या हाल है')
            ) {
              if (/[\u0900-\u097F]/.test(commandText)) {
                customResponse = 'सब ठीक है। आप बताइए, मैं आपकी क्या सहायता कर सकती हूँ?';
              } else {
                customResponse = 'Main badhiya hoon. Aap bataiye, main aapki kya madad kar sakti hoon?';
              }
            } else if (
              lowerCmd.includes('aaj kya karna hai') ||
              lowerCmd.includes('aaj ka kya plan hai') ||
              lowerCmd.includes('आज क्या करना है')
            ) {
              customResponse = 'Aaj ke schedule me aapke core system checks aur task operations ready hain.';
            // AVATAR EMOTE VOICE CONTROLS DURING CONVERSATION
            } else if (
              lowerCmd.includes('avatar smile') ||
              lowerCmd.includes('smile karo') ||
              lowerCmd.includes('happy emote') ||
              lowerCmd.includes('be happy') ||
              lowerCmd.includes('hanso')
            ) {
              setControlledEmote('happy');
              customResponse = 'Main smile kar rahi hoon. Main bohot khush aur ready hoon!';
            } else if (
              lowerCmd.includes('avatar think') ||
              lowerCmd.includes('avatar socho') ||
              lowerCmd.includes('thinking emote') ||
              lowerCmd.includes('socho')
            ) {
              setControlledEmote('thinking');
              customResponse = 'Main is directive ke baare mein soch rahi hoon.';
            } else if (
              lowerCmd.includes('avatar nod') ||
              lowerCmd.includes('nod karo') ||
              lowerCmd.includes('agree emote')
            ) {
              setControlledEmote('friendly');
              customResponse = 'Main aapse sahmat hoon aur nod kar rahi hoon.';
            } else if (
              lowerCmd.includes('avatar wave') ||
              lowerCmd.includes('wave karo') ||
              lowerCmd.includes('hello bolo')
            ) {
              setControlledEmote('friendly');
              customResponse = 'Namaste! Main aapka swagat karti hoon.';
            } else if (
              lowerCmd.includes('avatar serious') ||
              lowerCmd.includes('serious ho jao') ||
              lowerCmd.includes('serious mode')
            ) {
              setControlledEmote('serious');
              customResponse = 'Main serious mode activate kar rahi hoon.';
            } else if (
              lowerCmd.includes('avatar excited') ||
              lowerCmd.includes('excited ho jao')
            ) {
              setControlledEmote('excited');
              customResponse = 'Main bohot excited aur energized hoon!';
            } else if (
              lowerCmd.includes('avatar normal') ||
              lowerCmd.includes('auto emote') ||
              lowerCmd.includes('neutral emote')
            ) {
              setControlledEmote(null);
              customResponse = 'Main auto emote mode par switch kar chuki hoon.';

            // YOUTUBE & MUSIC VIDEO CONTROLS (Auto Play, Change Video, Download)
            } else if (
              lowerCmd.includes('change video') ||
              lowerCmd.includes('next video') ||
              lowerCmd.includes('video change') ||
              lowerCmd.includes('dusra video') ||
              lowerCmd.includes('agla video') ||
              lowerCmd.includes('video badlo') ||
              lowerCmd.includes('next song') ||
              lowerCmd.includes('agla gana') ||
              lowerCmd.includes('dusra gana')
            ) {
              const nextVideo = youtubePlayerService.changeVideo('next');
              setActivePage('youtube_media');
              customResponse = `Main video change kar rahi hoon. Ab ${nextVideo.title} play ho raha hai.`;
            } else if (
              lowerCmd.includes('previous video') ||
              lowerCmd.includes('pichla video') ||
              lowerCmd.includes('previous song') ||
              lowerCmd.includes('pichla gana')
            ) {
              const prevVideo = youtubePlayerService.changeVideo('prev');
              setActivePage('youtube_media');
              customResponse = `Main pichla video play kar rahi hoon: ${prevVideo.title}.`;
            } else if (
              lowerCmd.includes('download video') ||
              lowerCmd.includes('video download') ||
              lowerCmd.includes('download song') ||
              lowerCmd.includes('gana download') ||
              lowerCmd.includes('download audio') ||
              lowerCmd.includes('download mp4') ||
              lowerCmd.includes('download mp3')
            ) {
              const format = lowerCmd.includes('audio') || lowerCmd.includes('mp3') ? 'MP3' : 'MP4';
              const dlTask = youtubePlayerService.download(format);
              setActivePage('youtube_media');
              customResponse = `Main ${dlTask.title} ka ${format} download shuru kar rahi hoon.`;
            } else if (
              lowerCmd.includes('pause video') ||
              lowerCmd.includes('video pause') ||
              lowerCmd.includes('video roko')
            ) {
              youtubePlayerService.pause();
              customResponse = 'Main video pause kar rahi hoon.';
            } else if (
              lowerCmd.includes('resume video') ||
              lowerCmd.includes('video chalu') ||
              lowerCmd.includes('resume karo')
            ) {
              youtubePlayerService.play();
              customResponse = 'Main video resume kar rahi hoon.';
            } else if (
              parsedHinglish.intent === 'open_youtube' ||
              intentResult.intent === 'open_youtube' ||
              lowerCmd.includes('open youtube') ||
              lowerCmd.includes('youtube kholo')
            ) {
              safeBrowserControl.openYouTube();
              setActivePage('youtube_media');
              customResponse = 'YouTube open kar rahi hoon.';
            } else if (
              parsedHinglish.intent === 'stop_music' ||
              intentResult.intent === 'stop_music'
            ) {
              cyberMusic.stop();
              youtubePlayerService.pause();
              safeBrowserControl.stopMusic();
              customResponse = 'Music band kar di gayi hai.';
            } else if (
              parsedHinglish.intent === 'play_music' ||
              intentResult.intent === 'play_music' ||
              lowerCmd.includes('play music video') ||
              lowerCmd.includes('play video') ||
              lowerCmd.includes('video chalao')
            ) {
              const query = commandText
                .replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[,\s]*/i, '')
                .replace(/\b(play|video|music|chalao|gaana|gana|on youtube|bajaao|bajao)\b/gi, '')
                .trim();
              if (query) {
                const searched = youtubePlayerService.searchAndPlay(query);
                setActivePage('youtube_media');
                customResponse = `Sure, ${searched.title} search karke play kar rahi hoon.`;
              } else {
                youtubePlayerService.play();
                safeBrowserControl.playMusic();
                setActivePage('youtube_media');
                customResponse = 'YouTube open kar rahi hoon.';
              }
            } else if (
              parsedHinglish.intent === 'search_youtube' ||
              intentResult.intent === 'search_youtube'
            ) {
              const query =
                parsedHinglish.query ||
                intentResult.query ||
                intentResult.entities?.query ||
                commandText
                  .replace(/^(hey\s+)?(jarvis|ultron|जार्विस)[,\s]*/i, '')
                  .replace(/\b(play|search|chalao|on youtube|ke songs|ke gaane)\b/gi, '')
                  .trim();
              safeBrowserControl.searchYouTube(query);
              youtubePlayerService.searchAndPlay(query);
              setActivePage('youtube_media');
              customResponse = `Sure, ${query} search kar rahi hoon.`;
            } else if (lowerCmd.includes('google') || lowerCmd.includes('search')) {
              const query = commandText.replace(/google|search|for/gi, '').trim() || 'Solar System astronomy telemetry';
              customResponse = `Querying astronomical ephemeris and Google index for "${query}". Celestial coordinates synchronized.`;
              if (lowerCmd.includes('open google') || lowerCmd.includes('open search')) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
              }
            } else if (lowerCmd.includes('model') || lowerCmd.includes('glb') || lowerCmd.includes('3d') || lowerCmd.includes('robot') || lowerCmd.includes('studio')) {
              setActivePage('glb_studio');
              customResponse = `Navigating to 3D GLB Model Studio. Hardware PBR shaders initialized.`;
            } else if (lowerCmd.includes('galaxy') || lowerCmd.includes('stars') || lowerCmd.includes('cosmos')) {
              setActivePage('galaxy_view');
              customResponse = `Navigating to Ultron 3D Galaxy Viewport. Accretion matrix online.`;
            } else if (lowerCmd.includes('command') || lowerCmd.includes('matrix') || lowerCmd.includes('overview') || lowerCmd.includes('center')) {
              setActivePage('command_center');
              customResponse = `Navigating to Command Matrix HUD. Real-time telemetry feeds synchronized.`;
            } else if (lowerCmd.includes('intel') || lowerCmd.includes('gesture') || lowerCmd.includes('cognitive')) {
              setActivePage('intelligence');
              customResponse = `Navigating to Cognitive Intelligence & Neural Directives.`;
            } else if (lowerCmd.includes('system') || lowerCmd.includes('setting') || lowerCmd.includes('hardware') || lowerCmd.includes('control')) {
              setActivePage('system_control');
              customResponse = `Navigating to System & Hardware Control Center. Registers calibrated.`;
            }

            const defaultResponses = [
              `Directive recognized: "${commandText}". Ultron cybernetic matrix calibrated.`,
              `Affirmative. "${commandText}" executed. System telemetry locked and nominal.`,
              `Cognitive synthesis complete for: "${commandText}". Neural vectors indexed.`,
              `Ultron protocol finalized. Autonomous parameters updated.`,
            ];
            const response = customResponse || defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#040814] text-slate-100 font-sans select-none relative"
    >
      {/* 0. Immersive Celestial Space Star Field & Chromatic Neural Network Waves Backdrop */}
      {spaceThemeEnabled && (
        <SpaceCanvasStarfield
          state={avatarState}
          theme={currentSpaceTheme}
          enableInteractiveWaves={true}
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
          onQuickAction={handleQuickAction}
        />
      </div>
    </div>
  );
}
