import React, { useState } from 'react';
import { Volume2, Play, Globe2, ArrowUpRight, Calendar, CheckSquare, Youtube, Activity, AudioLines, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ultronVoice, JarvisVoicePersona, JARVIS_VOICE_PERSONAS } from '../../utils/ultronVoice.ts';
import { LanguageMode } from '../../utils/pronunciationEngine.ts';
interface Props {
  currentTaskTitle?: string; isTaskRunning?: boolean;
  onQuickAction?: (key: 'system_status' | 'open_youtube' | 'create_reminder' | 'open_tasks') => void;
  geminiConnected?: boolean; voiceReady?: boolean; ttsReady?: boolean;
  onVoicePersonaChange?: (persona: JarvisVoicePersona) => void;
  onLanguageChange?: (language: LanguageMode) => void;
}
const personas: { id: JarvisVoicePersona; label: string; detail: string; initials: string }[] = [
  { id: 'JARVIS_CINEMATIC', label: 'JARVIS', detail: 'Calm & cinematic', initials: 'J' },
  { id: 'BIG_BOSS_POWERFUL', label: 'Big Boss', detail: 'Bold Hindi presence', initials: 'B' },
  { id: 'FEMALE_ASSISTANT', label: 'Natural assistant', detail: 'Warm & conversational', initials: 'N' },
];
export const JarvisRightSidebar: React.FC<Props> = ({ currentTaskTitle, isTaskRunning, onQuickAction, geminiConnected, onVoicePersonaChange, onLanguageChange }) => {
  const [persona, setPersona] = useState(() => ultronVoice.getVoicePersona());
  const [language, setLanguage] = useState(() => ultronVoice.getLanguageMode());
  const selectPersona = (id: JarvisVoicePersona) => { setPersona(id); ultronVoice.setVoicePersona(id); onVoicePersonaChange?.(id); };
  return <details className="companion-preferences">
    <summary aria-label="Toggle companion preferences"><SlidersHorizontal size={18} /><span>Companion settings</span><ChevronDown size={14} /></summary>
    <aside className="voice-sidebar" aria-label="Voice preferences and shortcuts">
    <section className="workspace-card voice-preferences">
      <div className="card-eyebrow"><AudioLines size={16} /><span>Make it yours</span></div>
      <h2>A voice that feels right.</h2><p className="card-description">Choose your companion’s personality.</p>
      <div className="persona-list" role="group" aria-label="Voice personality">{personas.map(item => <div key={item.id} className={`persona-option ${persona === item.id ? 'selected' : ''}`}>
        <button type="button" className="persona-select" aria-pressed={persona === item.id} onClick={() => selectPersona(item.id)}><span className="persona-avatar">{item.initials}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span></button>
        <button type="button" className="persona-preview" aria-label={`Preview ${item.label} voice`} onClick={() => { selectPersona(item.id); ultronVoice.speak(JARVIS_VOICE_PERSONAS[item.id].previewSample); }}><Play size={13} fill="currentColor" /></button>
      </div>)}</div>
      <div className="language-label"><Globe2 size={14} /><span>Conversation language</span></div>
      <div className="language-options" role="group" aria-label="Conversation language">{(['AUTO', 'HINDI', 'ENGLISH', 'HINGLISH'] as LanguageMode[]).map(mode => <button key={mode} type="button" aria-pressed={language === mode} onClick={() => { setLanguage(mode); ultronVoice.setLanguageMode(mode); onLanguageChange?.(mode); }}>{({ AUTO: 'Auto', HINDI: 'हिन्दी', ENGLISH: 'English', HINGLISH: 'Hinglish' })[mode]}</button>)}</div>
      <p className="voice-note"><Volume2 size={13} />Browser voice is used when cloud audio is unavailable.</p>
    </section>
    <section className="workspace-card"><div className="card-eyebrow"><Activity size={15} /><span>In this moment</span></div><div className="session-task"><i className={isTaskRunning ? 'busy' : ''} /><span>{currentTaskTitle || 'Ready when you are'}</span></div><p className="card-description">{geminiConnected ? 'Cloud AI is available for your next idea.' : 'Local mode · cloud AI is not connected.'}</p></section>
    <section className="workspace-card"><div className="card-eyebrow"><span>A little head start</span><ArrowUpRight size={15} /></div><div className="quick-actions">{[{ key: 'open_tasks', label: 'My tasks', icon: CheckSquare }, { key: 'create_reminder', label: 'Reminders', icon: Calendar }, { key: 'open_youtube', label: 'YouTube', icon: Youtube }, { key: 'system_status', label: 'System status', icon: Activity }].map(({ key, label, icon: Icon }) => <button type="button" key={key} onClick={() => onQuickAction?.(key as Parameters<NonNullable<Props['onQuickAction']>>[0])}><Icon size={17} /><span>{label}</span><ArrowUpRight size={12} /></button>)}</div></section>
    <div className="sidebar-signature">BUILT FOR YOUR EVERYDAY<span>MGITE SOFTWARE</span></div>
  </aside></details>;
};
