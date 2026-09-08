/**
 * Personal AI Assistant - Desktop Interface Entry Point (Phase 1 Foundation)
 * Integrates Titlebar, Chat Interface, SQLite Memory Inspector, System Logs, Settings, and Architecture Drawer.
 */

import React, { useState, useEffect } from 'react';
import { TitleBar } from '../apps/desktop/renderer/components/TitleBar.tsx';
import { ChatInterface } from '../apps/desktop/renderer/components/ChatInterface.tsx';
import { SettingsModal } from '../apps/desktop/renderer/components/SettingsModal.tsx';
import { MemoryInspector } from '../apps/desktop/renderer/components/MemoryInspector.tsx';
import { LogsViewer } from '../apps/desktop/renderer/components/LogsViewer.tsx';
import { ArchitectureDrawer } from '../apps/desktop/renderer/components/ArchitectureDrawer.tsx';
import { useOnlineStatus } from '../apps/desktop/renderer/hooks/useOnlineStatus.ts';
import { useAssistant } from '../apps/desktop/renderer/hooks/useAssistant.ts';
import { apiService } from '../apps/desktop/renderer/services/api.ts';
import { SystemStatus } from '../apps/desktop/renderer/types/index.ts';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function App() {
  const {
    isOnline,
    manualOfflineMode,
    cloudAiAvailable,
    toggleManualOffline,
    refreshStatus,
  } = useOnlineStatus();

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    isLoading,
    errorMessage,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    deleteConversation,
    clearAllHistory,
    refreshConversations,
  } = useAssistant(!isOnline);

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await apiService.getStatus();
      setSystemStatus(data);
    } catch (err) {
      console.warn('Backend status check pending or offline:', err);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none font-sans">
      {/* 1. Desktop TitleBar */}
      <TitleBar
        assistantName={systemStatus?.assistant_name || 'JARVIS'}
        isOnline={isOnline}
        manualOfflineMode={manualOfflineMode}
        onToggleOffline={toggleManualOffline}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMemory={() => setShowMemory(true)}
        onOpenLogs={() => setShowLogs(true)}
        onOpenArchitecture={() => setShowArchitecture(true)}
      />

      {/* 2. Offline Notice Banner if in Offline Mode */}
      {!isOnline && (
        <div
          id="offline-banner"
          className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {manualOfflineMode
                ? 'Manual Offline Mode is active. Cloud AI calls are blocked; local SQLite memory & local responses are operational.'
                : !cloudAiAvailable
                ? 'GEMINI_API_KEY is not configured or network unreachable. Operating in local-only fallback mode with SQLite.'
                : 'Offline: Operating in local-only mode.'}
            </span>
          </div>
          <button
            onClick={toggleManualOffline}
            className="text-[11px] underline hover:text-amber-100 font-mono cursor-pointer"
          >
            {manualOfflineMode ? 'Switch to Online' : 'Check Settings'}
          </button>
        </div>
      )}

      {/* 3. Error Banner if active */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-1.5 flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4. Chat Interface Center */}
      <ChatInterface
        conversations={conversations}
        activeConversationId={activeConversationId}
        messages={messages}
        isLoading={isLoading}
        isOnline={isOnline}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
        onClearAllHistory={clearAllHistory}
        onRetryMessage={retryLastMessage}
        onSendMessage={sendMessage}
      />

      {/* 5. Modals & Drawers */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        systemStatus={systemStatus}
        onConfigChanged={() => {
          loadStatus();
          refreshStatus();
          refreshConversations();
        }}
      />

      <MemoryInspector
        isOpen={showMemory}
        onClose={() => setShowMemory(false)}
      />

      <LogsViewer
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />

      <ArchitectureDrawer
        isOpen={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />
    </div>
  );
}
