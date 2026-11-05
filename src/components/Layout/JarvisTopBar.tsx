import React, { useEffect, useState } from 'react';
import { Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects.ts';

interface Props { onSettingsClick?: () => void; onProfileClick?: () => void; isOnline?: boolean }
export const JarvisTopBar: React.FC<Props> = ({ onSettingsClick, onProfileClick, isOnline = false }) => {
  const [date, setDate] = useState(() => new Date());
  const [sound, setSound] = useState(() => soundFx.isExtraSoundEnabled());
  useEffect(() => { const timer = setInterval(() => setDate(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const update = () => setSound(soundFx.isExtraSoundEnabled()); window.addEventListener('jarvis_extra_sound_changed', update); return () => window.removeEventListener('jarvis_extra_sound_changed', update); }, []);
  return <header className="workspace-header">
    <button className="brand" onClick={onProfileClick} aria-label="JARVIS home"><span className="brand-symbol"><Sparkles size={22} /></span><strong>JARVIS<span>PERSONAL AI</span></strong></button>
    <div className="header-divider" /><span className="header-workspace-label">A familiar face. A little everyday help.</span>
    <div className="header-actions"><time className="header-date" dateTime={date.toISOString()}>{date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}<span>{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></time>
      <span className={`connection-status ${isOnline ? 'connected' : ''}`}><i />{isOnline ? 'Connected' : 'Disconnected'}</span>
      <button className="header-icon" aria-label={sound ? 'Mute sound effects' : 'Enable sound effects'} aria-pressed={sound} onClick={() => { soundFx.toggleExtraSound(); setSound(soundFx.isExtraSoundEnabled()); }}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      <button className="header-icon" aria-label="Open settings" onClick={onSettingsClick}><Settings size={18} /></button>
    </div>
  </header>;
};
