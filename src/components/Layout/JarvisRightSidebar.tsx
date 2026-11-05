/**
 * JarvisRightSidebar Component (Golden Space Theme)
 *
 * Right Panel matching strict layout requirements:
 * 1. VOICE MODE SELECTOR:
 *    - JARVIS CINEMATIC (Deep calm intelligent male AI)
 *    - BIG BOSS POWERFUL (Deep bass dramatic Hindi announcer)
 *    - NATURAL FEMALE ASSISTANT (Warm professional Hindi/Hinglish female)
 *    - Preview voice button
 * 2. LANGUAGE SELECTOR:
 *    - Auto Detect, Hindi, English, Hinglish
 * 3. COMPACT SYSTEM STATUS:
 *    - AI Core: Gemini 2.5 Flash
 *    - Voice Synthesis: Fish Audio / Neural
 *    - Speech Recog: Active
 *    - Airgap Shield: Protected
 * 4. CURRENT TASK & ACTIVE PROCESSES:
 *    - Real running task indicator
 *    - Quick action triggers
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Globe,
  Activity,
  Youtube,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  ultronVoice,
  JarvisVoicePersona,
  JARVIS_VOICE_PERSONAS,
} from '../../utils/ultronVoice.ts';
import { LanguageMode } from '../../utils/pronunciationEngine.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface JarvisRightSidebarProps {
  currentTaskTitle?: string;
  isTaskRunning?: boolean;
  onQuickAction?: (actionKey: 'system_status' | 'open_youtube' | 'create_reminder' | 'open_tasks') => void;
  geminiConnected?: boolean;
  voiceReady?: boolean;
  ttsReady?: boolean;
  onVoicePersonaChange?: (persona: JarvisVoicePersona) => void;
  onLanguageChange?: (lang: LanguageMode) => void;
}

export const JarvisRightSidebar: React.FC<JarvisRightSidebarProps> = ({
  currentTaskTitle = 'System Standby',
  isTaskRunning = false,
  onQuickAction,
  geminiConnected = true,
  voiceReady = true,
  ttsReady = true,
  onVoicePersonaChange,
  onLanguageChange,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<JarvisVoicePersona>(() => ultronVoice.getVoicePersona());
  const [selectedLang, setSelectedLang] = useState<LanguageMode>(() => ultronVoice.getLanguageMode());
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  useEffect(() => {
    setSelectedPersona(ultronVoice.getVoicePersona());
    setSelectedLang(ultronVoice.getLanguageMode());
  }, []);

  const handleSelectPersona = (persona: JarvisVoicePersona) => {
    soundFx.playClick();
    setSelectedPersona(persona);
    ultronVoice.setVoicePersona(persona);
    if (onVoicePersonaChange) {
      onVoicePersonaChange(persona);
    }
  };

  const handleSelectLanguage = (lang: LanguageMode) => {
    soundFx.playClick();
    setSelectedLang(lang);
    ultronVoice.setLanguageMode(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const handlePreviewPersona = async (e: React.MouseEvent, persona: JarvisVoicePersona) => {
    e.stopPropagation();
    soundFx.playClick();
    setIsPreviewing(true);
    await ultronVoice.previewVoicePersona(persona);
    setIsPreviewing(false);
  };

  const handleAction = (key: 'system_status' | 'open_youtube' | 'create_reminder' | 'open_tasks') => {
    soundFx.playClick();
    if (onQuickAction) {
      onQuickAction(key);
    }
  };

  return (
    <aside className="w-68 xl:w-72 h-full flex flex-col gap-2.5 shrink-0 select-none overflow-y-auto custom-scrollbar z-20">
      {/* 1. VOICE MODE SELECTOR */}
      <div className="p-3.5 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#FFD76A]" />
            <span className="text-[11px] font-sans font-bold tracking-wider text-[#FFD76A] uppercase">
              VOICE MODE
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#D4AF37]/80">FISH AUDIO</span>
        </div>

        <div className="space-y-1.5">
          {/* Persona 1: JARVIS CINEMATIC */}
          <div
            onClick={() => handleSelectPersona('JARVIS_CINEMATIC')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPersona === 'JARVIS_CINEMATIC'
                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD76A]/10 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                : 'bg-[#030712]/60 border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-slate-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${selectedPersona === 'JARVIS_CINEMATIC' ? 'text-[#FFD76A]' : 'text-slate-200'}`}>
                  JARVIS Cinematic
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Deep calm intelligent male</p>
            </div>
            <button
              type="button"
              onClick={(e) => handlePreviewPersona(e, 'JARVIS_CINEMATIC')}
              title="Preview voice"
              className="p-1 rounded-md bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#FFD76A] transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>

          {/* Persona 2: BIG BOSS POWERFUL */}
          <div
            onClick={() => handleSelectPersona('BIG_BOSS_POWERFUL')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPersona === 'BIG_BOSS_POWERFUL'
                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD76A]/10 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                : 'bg-[#030712]/60 border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-slate-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${selectedPersona === 'BIG_BOSS_POWERFUL' ? 'text-[#FFD76A]' : 'text-slate-200'}`}>
                  Big Boss Powerful
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Deep bass Hindi announcer</p>
            </div>
            <button
              type="button"
              onClick={(e) => handlePreviewPersona(e, 'BIG_BOSS_POWERFUL')}
              title="Preview voice"
              className="p-1 rounded-md bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#FFD76A] transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>

          {/* Persona 3: NATURAL FEMALE ASSISTANT */}
          <div
            onClick={() => handleSelectPersona('FEMALE_ASSISTANT')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPersona === 'FEMALE_ASSISTANT'
                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD76A]/10 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                : 'bg-[#030712]/60 border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-slate-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${selectedPersona === 'FEMALE_ASSISTANT' ? 'text-[#FFD76A]' : 'text-slate-200'}`}>
                  Female Assistant
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Warm Hindi/Hinglish female</p>
            </div>
            <button
              type="button"
              onClick={(e) => handlePreviewPersona(e, 'FEMALE_ASSISTANT')}
              title="Preview voice"
              className="p-1 rounded-md bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 text-[#FFD76A] transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LANGUAGE SELECTOR */}
      <div className="p-3.5 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#FFD76A]" />
            <span className="text-[11px] font-sans font-bold tracking-wider text-[#FFD76A] uppercase">
              LANGUAGE
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#FFD76A] uppercase">{selectedLang}</span>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[11px]">
          {(['AUTO', 'HINDI', 'ENGLISH', 'HINGLISH'] as LanguageMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelectLanguage(mode)}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-sans ${
                selectedLang === mode
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FFD76A] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  : 'bg-[#030712] border-[#D4AF37]/15 text-slate-400 hover:text-slate-200 hover:border-[#D4AF37]/30'
              }`}
            >
              {mode === 'AUTO' && 'Auto Detect'}
              {mode === 'HINDI' && 'हिन्दी (Hindi)'}
              {mode === 'ENGLISH' && 'English'}
              {mode === 'HINGLISH' && 'Hinglish'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. COMPACT SYSTEM STATUS */}
      <div className="p-3.5 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/15">
          <span className="text-[11px] font-sans font-bold tracking-wider text-[#FFD76A] uppercase">
            AI & SYSTEM STATUS
          </span>
          <span className="text-[10px] font-mono text-[#FFD76A] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
            ONLINE
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-sans">
          {/* AI Brain */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-300">Gemini Brain</span>
            <span className="text-[#FFD76A] font-mono text-[11px] font-medium">gemini-2.5-flash</span>
          </div>

          {/* Voice Engine */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-300">TTS Engine</span>
            <span className="text-[#FFD76A] font-mono text-[11px] font-medium">Fish Audio (s2.1-pro)</span>
          </div>

          {/* Fallback */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-300">Local Fallback</span>
            <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
          </div>

          {/* Security Gate */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-300">Privacy Shield</span>
            <span className="text-[#FFD76A] font-mono text-[11px]">Active</span>
          </div>
        </div>
      </div>

      {/* 4. CURRENT TASK PANEL */}
      <div className="p-3.5 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/15">
          <span className="text-[11px] font-sans font-bold tracking-wider text-[#FFD76A] uppercase">
            CURRENT TASK
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isTaskRunning
              ? 'text-[#FFD76A] bg-[#D4AF37]/15 border border-[#D4AF37]/40 animate-pulse'
              : 'text-slate-400 bg-slate-900 border border-slate-800'
          }`}>
            {isTaskRunning ? 'RUNNING' : 'STANDBY'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 py-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isTaskRunning
              ? 'border border-[#FFD76A] animate-spin text-[#FFD76A]'
              : 'border border-[#D4AF37]/30 text-slate-500'
          }`}>
            <Clock className="w-3 h-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#E8EAF0] font-medium truncate">
              {currentTaskTitle}
            </p>
            <p className="text-[10px] text-[#D4AF37]/70 truncate">
              {isTaskRunning ? 'Processing directive...' : 'Standing by for instruction'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. QUICK DIRECTIVES */}
      <div className="p-3 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.04)] flex flex-col gap-2">
        <span className="text-[11px] font-sans font-bold tracking-wider text-[#FFD76A] uppercase pb-1 border-b border-[#D4AF37]/15">
          QUICK DIRECTIVES
        </span>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleAction('system_status')}
            className="p-2 rounded-xl bg-[#030712] border border-[#D4AF37]/20 hover:border-[#FFD76A]/50 hover:bg-[#D4AF37]/10 text-slate-300 hover:text-[#FFD76A] transition-all flex items-center gap-2 cursor-pointer text-left"
          >
            <Activity className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="text-[11px] truncate">Status</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('open_youtube')}
            className="p-2 rounded-xl bg-[#030712] border border-[#D4AF37]/20 hover:border-[#FFD76A]/50 hover:bg-[#D4AF37]/10 text-slate-300 hover:text-[#FFD76A] transition-all flex items-center gap-2 cursor-pointer text-left"
          >
            <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-[11px] truncate">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('create_reminder')}
            className="p-2 rounded-xl bg-[#030712] border border-[#D4AF37]/20 hover:border-[#FFD76A]/50 hover:bg-[#D4AF37]/10 text-slate-300 hover:text-[#FFD76A] transition-all flex items-center gap-2 cursor-pointer text-left"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="text-[11px] truncate">Reminder</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('open_tasks')}
            className="p-2 rounded-xl bg-[#030712] border border-[#D4AF37]/20 hover:border-[#FFD76A]/50 hover:bg-[#D4AF37]/10 text-slate-300 hover:text-[#FFD76A] transition-all flex items-center gap-2 cursor-pointer text-left"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#FFD76A] shrink-0" />
            <span className="text-[11px] truncate">Tasks</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
