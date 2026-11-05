/**
 * Quick Notes Component for Right Intelligence Panel
 *
 * Provides a lightweight scratchpad for jotting down thoughts, prompt ideas,
 * or temporary snippets during AI sessions without leaving the command center.
 * Persists content automatically to localStorage.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Save,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'jarvis_quick_notes';

interface QuickNotesCardProps {
  onInsertToPrompt?: (text: string) => void;
  className?: string;
}

export const QuickNotesCard: React.FC<QuickNotesCardProps> = ({
  onInsertToPrompt,
  className = '',
}) => {
  const [noteText, setNoteText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load persisted note from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setNoteText(saved);
        if (saved.trim().length > 0) {
          setLastSaved('Restored');
        }
      }
    } catch (e) {
      console.warn('Unable to read quick notes from localStorage:', e);
    }
  }, []);

  // Save to localStorage when note text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    try {
      localStorage.setItem(STORAGE_KEY, val);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(`Saved at ${timeStr}`);
    } catch (err) {
      console.warn('Unable to save quick note to localStorage:', err);
    }
  };

  // Copy note text to clipboard
  const handleCopy = async () => {
    if (!noteText.trim()) return;
    try {
      await navigator.clipboard.writeText(noteText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  // Clear note
  const handleClear = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
      return;
    }
    setNoteText('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved('Cleared');
    } catch (err) {
      console.warn('Error clearing localStorage note:', err);
    }
    setIsConfirmingClear(false);
  };

  // Metrics
  const charCount = noteText.length;
  const wordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;

  return (
    <div
      id="jarvis-quick-notes-card"
      className={`p-3 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-200">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Notes</span>
          {noteText.trim().length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Expand/Collapse Height Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse notes view' : 'Expand notes view'}
            aria-label="Toggle notes expansion"
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!noteText.trim()}
            title="Copy notes to clipboard"
            aria-label="Copy notes to clipboard"
            className={`p-1 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isCopied
                ? 'text-emerald-400 bg-emerald-950/40'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>

          {/* Clear Note Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={!noteText.trim()}
            title={isConfirmingClear ? 'Click again to confirm delete' : 'Clear quick notes'}
            aria-label="Clear quick notes"
            className={`p-1 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isConfirmingClear
                ? 'text-red-400 bg-red-950/60 animate-pulse'
                : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Note Textarea Scratchpad */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800/80 focus-within:border-cyan-500/50 bg-slate-950/60 transition-colors">
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={handleTextChange}
          placeholder="Jot down thoughts, ideas, or prompt snippets during your session..."
          className={`w-full bg-transparent p-2 text-xs text-slate-200 placeholder-slate-500 font-sans resize-none focus:outline-none custom-scrollbar transition-all ${
            isExpanded ? 'h-36' : 'h-20'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Footer Status Bar: Word/Char Count & Save State */}
      <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5 truncate mr-2">
          {lastSaved && (
            <span className="text-cyan-500/80 truncate">
              {isConfirmingClear ? 'Confirm clear?' : lastSaved}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
};
