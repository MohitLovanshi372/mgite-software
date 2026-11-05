import React, { useRef, useState } from 'react';
import { ArrowUp, Mic, Square, Sparkles } from 'lucide-react';

interface JarvisCommandBarProps {
  onExecute: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onStop?: () => void;
  isSpeaking?: boolean;
}

export const JarvisCommandBar: React.FC<JarvisCommandBarProps> = ({ onExecute, isListening, onToggleListening, onStop, isSpeaking }) => {
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const suggestions = ['Plan my day', 'Mera system status batao', 'YouTube kholo'];
  return <section className="command-composer" aria-label="Talk to JARVIS">
    <div className="composer-suggestions"><Sparkles size={14} aria-hidden="true" /><span>Try asking</span>{suggestions.map(suggestion =>
      <button key={suggestion} type="button" onClick={() => { setText(suggestion); input.current?.focus(); }}>{suggestion}</button>
    )}</div>
    <form className="composer-field" onSubmit={event => { event.preventDefault(); if (text.trim()) { onExecute(text.trim()); setText(''); } }}>
      <button type="button" className={`composer-mic ${isListening ? 'is-listening' : ''}`} aria-label={isListening ? 'Stop listening' : 'Start listening'} aria-pressed={isListening} onClick={onToggleListening}><Mic size={21} /></button>
      <input ref={input} aria-label="Message JARVIS" placeholder={isListening ? 'Listening to you…' : 'Ask anything. English, Hindi, or a little of both.'} value={text} onChange={event => setText(event.target.value)} />
      {isSpeaking && onStop && <button type="button" className="composer-stop" aria-label="Stop speaking" onClick={onStop}><Square size={16} /></button>}
      <button type="submit" className="composer-send" aria-label="Send message" disabled={!text.trim()}><ArrowUp size={21} /></button>
    </form>
    <div className="composer-caption"><span>{isListening ? 'Microphone is listening' : 'Your next idea starts here'}</span><span>Enter to send</span></div>
  </section>;
};
