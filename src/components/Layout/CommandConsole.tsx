/**
 * CommandConsole Component
 * Large cinematic mechanical command console with glowing input, live voice waveform,
 * microphone trigger, file attachment, settings shortcut, and powerful EXECUTE button.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic,
  Zap,
  Sliders,
  Sparkles,
  Box,
  Flame,
  Brain,
  Compass,
  CornerDownLeft,
  ArrowRight,
} from 'lucide-react';
import { QuickActions } from '../Dashboard/QuickActions.tsx';
import { NavigationPageId } from '../../types/index.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface NavigationSuggestion {
  keyword: string;
  pageId: NavigationPageId;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  aliases: string[];
}

const NAVIGATION_SUGGESTIONS: NavigationSuggestion[] = [
  {
    keyword: 'galaxy',
    pageId: 'galaxy_view',
    label: 'ULTRON GALAXY',
    subLabel: '3D Spiral Galaxy & Celestial Telemetry Viewport',
    icon: Sparkles,
    aliases: ['galaxy', 'galaxy view', 'stars', 'cosmos', 'celestial', 'spiral'],
  },
  {
    keyword: 'studio',
    pageId: 'glb_studio',
    label: '3D GLB STUDIO',
    subLabel: 'Interactive 3D Model Inspector, PBR Shaders & Wireframe',
    icon: Box,
    aliases: ['studio', 'glb', 'glb studio', 'model', 'models', '3d', 'inspector', 'mesh'],
  },
  {
    keyword: 'command',
    pageId: 'command_center',
    label: 'COMMAND MATRIX',
    subLabel: 'Tactical HUD, Solar System & Autonomous Vitals',
    icon: Flame,
    aliases: ['command', 'command matrix', 'command center', 'dashboard', 'home', 'overview', 'main'],
  },
  {
    keyword: 'intelligence',
    pageId: 'intelligence',
    label: 'COGNITIVE INTELLIGENCE',
    subLabel: 'Neural Directives, Gesture Matrix & Reasoning Engine',
    icon: Brain,
    aliases: ['intelligence', 'cognitive', 'neural', 'directives', 'gestures', 'ai', 'brain'],
  },
  {
    keyword: 'system',
    pageId: 'system_control',
    label: 'SYSTEM CONTROL',
    subLabel: 'ElevenLabs Voice Parameters, Hardware Registers & Audio',
    icon: Sliders,
    aliases: ['system', 'system control', 'settings', 'hardware', 'voice', 'control', 'registers'],
  },
];

interface CommandConsoleProps {
  onExecute: (commandText: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  onNavigate?: (pageId: NavigationPageId) => void;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onExecute,
  isListening,
  onToggleListening,
  onNavigate,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract clean query text stripped of common prefixes (e.g. "navigate to ", "open ", "go to ")
  const cleanQuery = useMemo(() => {
    const raw = inputVal.trim().toLowerCase();
    return raw.replace(/^(navigate\s+to|go\s+to|open|jump\s+to|switch\s+to)\s+/i, '').trim();
  }, [inputVal]);

  // Compute matched navigation suggestions based on user input
  const filteredSuggestions = useMemo(() => {
    if (!cleanQuery) return [];

    return NAVIGATION_SUGGESTIONS.filter((item) => {
      const matchKeyword = item.keyword.toLowerCase().includes(cleanQuery);
      const matchLabel = item.label.toLowerCase().includes(cleanQuery);
      const matchAlias = item.aliases.some((alias) => alias.toLowerCase().includes(cleanQuery));
      return matchKeyword || matchLabel || matchAlias;
    }).sort((a, b) => {
      // Prioritize items that start with the query
      const aStarts = a.keyword.toLowerCase().startsWith(cleanQuery);
      const bStarts = b.keyword.toLowerCase().startsWith(cleanQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [cleanQuery]);

  // Manage dropdown visibility and selection index reset
  useEffect(() => {
    if (filteredSuggestions.length > 0 && inputVal.trim().length > 0) {
      setIsDropdownOpen(true);
      setSelectedIndex(0);
    } else {
      setIsDropdownOpen(false);
    }
  }, [filteredSuggestions.length, inputVal]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplySuggestion = (suggestion: NavigationSuggestion, executeNow: boolean = false) => {
    soundFx.playClick();
    if (executeNow) {
      if (onNavigate) {
        onNavigate(suggestion.pageId);
      }
      onExecute(`Navigate to ${suggestion.label}`);
      setInputVal('');
      setIsDropdownOpen(false);
    } else {
      // Fill the input with the suggested navigation keyword
      setInputVal(suggestion.keyword);
      setIsDropdownOpen(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Tab') {
      // Autocomplete the input keyword on Tab
      e.preventDefault();
      const current = filteredSuggestions[selectedIndex];
      if (current) {
        handleApplySuggestion(current, false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    // If dropdown is open and user hits enter, navigate directly to highlighted suggestion
    if (isDropdownOpen && filteredSuggestions[selectedIndex]) {
      handleApplySuggestion(filteredSuggestions[selectedIndex], true);
      return;
    }

    // Check if the typed value exactly matches a suggestion keyword or alias
    const exactMatch = NAVIGATION_SUGGESTIONS.find(
      (item) => item.keyword.toLowerCase() === cleanQuery || item.aliases.includes(cleanQuery)
    );

    if (exactMatch && onNavigate) {
      onNavigate(exactMatch.pageId);
    }

    onExecute(inputVal.trim());
    setInputVal('');
    setIsDropdownOpen(false);
  };

  const handleQuickAction = (actionLabel: string) => {
    setInputVal(`Direct command: execute ${actionLabel} protocol`);
  };

  // Check if first suggestion prefix matches for inline ghost hint
  const topSuggestion = filteredSuggestions[0];
  const ghostText =
    topSuggestion && topSuggestion.keyword.toLowerCase().startsWith(cleanQuery) && cleanQuery.length > 0
      ? topSuggestion.keyword.slice(cleanQuery.length)
      : '';

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#07080d]/95 border-t border-zinc-800/90 p-3 sm:p-4 font-mono select-none relative z-20"
    >
      {/* Top Ambient Red Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

      {/* Main Console Box */}
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-[#0b0c13] border border-zinc-700/80 rounded-xs p-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] focus-within:border-red-500/80 transition-all flex flex-col sm:flex-row items-center gap-2 relative"
      >
        {/* Corner Brackets */}
        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-500 pointer-events-none" />
        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-500 pointer-events-none" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-500 pointer-events-none" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-500 pointer-events-none" />

        {/* Autocomplete Suggestions Popover */}
        {isDropdownOpen && filteredSuggestions.length > 0 && (
          <div
            id="command-autocomplete-dropdown"
            className="absolute bottom-full mb-2 left-0 right-0 sm:left-4 sm:right-auto sm:w-[440px] bg-[#090b14]/98 border border-red-900/80 shadow-[0_0_25px_rgba(220,38,38,0.3)] rounded-xs overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {/* Popover Header */}
            <div className="bg-[#0f1322] border-b border-red-950/80 px-3 py-1.5 flex items-center justify-between text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <Compass className="w-3.5 h-3.5" />
                <span>NAVIGATION AUTOCOMPLETE</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono">
                <span>[TAB] COMPLETE</span>
                <span>•</span>
                <span>[ENTER] NAVIGATE</span>
                <span>•</span>
                <span>[ESC] CLOSE</span>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              {filteredSuggestions.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={suggestion.pageId}
                    id={`autocomplete-suggestion-${suggestion.keyword}`}
                    onClick={() => handleApplySuggestion(suggestion, true)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-2.5 py-2 rounded-xs flex items-center justify-between text-left transition-all cursor-pointer group border ${
                      isSelected
                        ? 'bg-red-950/60 border-red-600/80 text-zinc-100 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : 'border-transparent text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-2xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-red-900/50 border-red-500 text-red-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-red-400 group-hover:border-zinc-700'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-zinc-100 group-hover:text-red-300 flex items-center gap-1">
                            <span className="text-red-400">/</span>
                            {suggestion.keyword}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 rounded-2xs font-semibold">
                            {suggestion.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[260px] font-mono">
                          {suggestion.subLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplySuggestion(suggestion, false);
                        }}
                        className="text-[9px] px-1.5 py-0.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-2xs transition-colors hidden sm:inline-flex items-center gap-1"
                        title="Fill command input"
                      >
                        <span>TAB</span>
                      </button>

                      <div
                        className={`p-1 rounded-2xs border transition-colors ${
                          isSelected
                            ? 'bg-red-600 border-red-500 text-white'
                            : 'bg-transparent border-transparent text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEFT: Microphone Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`px-3 py-2.5 rounded-xs border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_#ef4444] animate-pulse'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Toggle Voice Input"
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-red-400' : ''}`} />
          <span className="text-[11px] font-bold tracking-wider hidden md:inline">
            {isListening ? 'LISTENING' : 'VOICE'}
          </span>
        </button>

        {/* CENTER: Voice Waveform (Active when listening) + Input Field with Ghost Autocomplete */}
        <div className="flex-1 w-full flex items-center gap-2.5 px-2 relative">
          {/* Simulated Waveform Bar Animation */}
          {isListening && (
            <div className="flex items-center gap-0.5 h-6 px-1 border-r border-red-900/60 pr-2 shrink-0">
              {[4, 16, 8, 22, 14, 28, 10, 20, 6, 18].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"
                  style={{
                    height: `${Math.max(4, (h * (idx % 2 === 0 ? 1 : 1.4)) % 24)}px`,
                    animationDelay: `${idx * 80}ms`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              id="command-console-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (filteredSuggestions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder={isListening ? 'Acoustic input streaming (Hindi / Hinglish / English)...' : "Command the system (e.g. 'Jarvis, light chalao', 'system status dikhao')..."}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden tracking-wide font-mono relative z-10"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Ghost text for top autocomplete completion */}
            {ghostText && isDropdownOpen && (
              <div className="absolute left-0 pointer-events-none text-sm text-zinc-600 font-mono tracking-wide flex items-center select-none z-0">
                {/* Invisible text matching current input length */}
                <span className="opacity-0">{inputVal}</span>
                <span className="text-red-400/60 font-semibold">{ghostText}</span>
                <span className="text-[10px] ml-2 px-1 py-0.5 bg-red-950/80 border border-red-900/80 text-red-400 rounded-2xs">
                  Tab ⇥
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Settings shortcut, Execute Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('system_control')}
            className="p-2 rounded-xs bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
            title="System Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Heavy Mechanical EXECUTE Button */}
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 rounded-xs border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] transition-all cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE</span>
          </button>
        </div>
      </form>

      {/* Action Chips Below Console */}
      <QuickActions
        onSelectAction={handleQuickAction}
        onNavigate={onNavigate}
      />
    </div>
  );
};

