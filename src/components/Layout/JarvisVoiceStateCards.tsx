import React from 'react';
import { Mic, Brain, Volume2, Check } from 'lucide-react';
import { AIStateMode } from '../../types/index.ts';

export const JarvisVoiceStateCards: React.FC<{ currentState: AIStateMode }> = ({ currentState }) => (
  <div className="voice-progress" aria-label="Assistant activity">
    {[{ id: 'LISTENING', label: 'Listening', icon: Mic }, { id: 'THINKING', label: 'Thinking', icon: Brain }, { id: 'SPEAKING', label: 'Speaking', icon: Volume2 }, { id: 'SUCCESS', label: 'Complete', icon: Check }].map(({ id, label, icon: Icon }, index) => <div key={id} className={currentState === id || (id === 'THINKING' && currentState === 'EXECUTING') ? 'active' : ''}><span className="progress-number">0{index + 1}</span><Icon size={14} /><span>{label}</span></div>)}
  </div>
);
