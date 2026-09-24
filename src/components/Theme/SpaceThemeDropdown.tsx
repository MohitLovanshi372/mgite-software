/**
 * SpaceThemeDropdown Component
 * Quick-switch dropdown for TopBar with local history of the last 3 user-selected themes
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check, History, Palette } from 'lucide-react';
import {
  SpaceThemeId,
  SPACE_THEME_CATALOG,
  DEFAULT_SPACE_THEME,
} from '../../types/spaceTheme.ts';
import { soundFx } from '../../utils/audioEffects.ts';

interface SpaceThemeDropdownProps {
  currentTheme: SpaceThemeId;
  themeHistory: SpaceThemeId[];
  onSelectTheme: (themeId: SpaceThemeId) => void;
}

export const SpaceThemeDropdown: React.FC<SpaceThemeDropdownProps> = ({
  currentTheme = DEFAULT_SPACE_THEME,
  themeHistory = [],
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTheme = SPACE_THEME_CATALOG[currentTheme] || SPACE_THEME_CATALOG[DEFAULT_SPACE_THEME];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: SpaceThemeId) => {
    if (id !== currentTheme) {
      soundFx.playThemeWarp();
    } else {
      soundFx.playClick();
    }
    onSelectTheme(id);
    setIsOpen(false);
  };

  const allThemeIds = Object.keys(SPACE_THEME_CATALOG) as SpaceThemeId[];
  // Ensure themeHistory has valid entries
  const recentThemes = (themeHistory.length > 0 ? themeHistory : [currentTheme])
    .filter((id) => Boolean(SPACE_THEME_CATALOG[id]))
    .slice(0, 3);

  return (
    <div ref={dropdownRef} className="relative select-none font-mono">
      {/* TopBar Quick-Switch Trigger Button */}
      <button
        id="topbar-space-theme-btn"
        type="button"
        onClick={() => {
          soundFx.playClick();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Active Space Theme: ${activeTheme.name}. Click to quick-switch or browse themes.`}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-xs transition-all cursor-pointer ${
          isOpen
            ? 'bg-[#181b29] border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
            : 'bg-[#0a0d16] border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
        }`}
      >
        <Sparkles
          className="w-3 h-3 transition-colors"
          style={{ color: activeTheme.primaryColor }}
        />
        <span className="hidden xl:inline text-[9px] text-zinc-400">THEME:</span>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: activeTheme.primaryColor }}
        />
        <span className="font-extrabold uppercase text-zinc-100">
          {activeTheme.shortLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="topbar-space-theme-menu"
          className="absolute top-full mt-2 right-0 w-80 sm:w-92 bg-[#060810]/95 border border-zinc-750/90 rounded-xs shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Top Holographic Ambient Edge */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor}, #06b6d4)`,
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0a0e1a]/90 border-b border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-bold tracking-wider">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>SPACE THEME MATRIX</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-750 rounded-xs text-[9px] text-zinc-400 font-bold">
              <History className="w-2.5 h-2.5 text-amber-400" />
              <span>LAST 3 HISTORY</span>
            </div>
          </div>

          <div className="p-2.5 space-y-2.5">
            {/* 1. RECENT SELECTIONS (LAST 3) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  Recent Themes (Last 3)
                </span>
                <span className="text-[8px] text-zinc-500">QUICK-SWITCH</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {recentThemes.map((themeId, idx) => {
                  const t = SPACE_THEME_CATALOG[themeId];
                  if (!t) return null;
                  const isCurrent = t.id === currentTheme;

                  return (
                    <button
                      key={`recent-${t.id}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(t.id)}
                      title={`Quick switch to ${t.name}`}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xs border text-left transition-all cursor-pointer group ${
                        isCurrent
                          ? 'bg-[#12182b] border-cyan-500/80 text-white shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'bg-[#090d18] border-zinc-800/90 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-1 w-full justify-between mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        {isCurrent && (
                          <span className="text-[8px] px-1 py-0.2 bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold rounded-xs">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase truncate w-full text-center">
                        {t.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800/80" />

            {/* 2. ALL AVAILABLE CELESTIAL PALETTES */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  All Space Themes
                </span>
                <span className="text-[8px] text-zinc-500">PERSISTED TO LOCAL STORAGE</span>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                {allThemeIds.map((themeId) => {
                  const t = SPACE_THEME_CATALOG[themeId];
                  const isCurrent = t.id === currentTheme;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelect(t.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xs border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#101626] border-cyan-500/70 text-zinc-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                          : 'bg-[#080b14] border-zinc-800/60 text-zinc-300 hover:bg-[#0c101c] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Color swatch trio */}
                        <div className="flex items-center -space-x-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black shadow-xs z-20"
                            style={{ backgroundColor: t.primaryColor }}
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black shadow-xs z-10 opacity-90"
                            style={{ backgroundColor: t.accentColor }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black shadow-xs opacity-75"
                            style={{ backgroundColor: t.secondaryColor }}
                          />
                        </div>

                        {/* Title & Tagline */}
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-100 tracking-wide">
                              {t.name}
                            </span>
                            <span
                              className="text-[8px] px-1 py-0.2 rounded-xs font-bold"
                              style={{
                                color: t.primaryColor,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                border: `1px solid ${t.primaryColor}55`,
                              }}
                            >
                              {t.shortLabel}
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 truncate tracking-tight">
                            {t.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Active Status Checkmark */}
                      <div className="shrink-0 ml-2">
                        {isCurrent ? (
                          <div className="w-5 h-5 rounded-xs bg-cyan-950 border border-cyan-600 text-cyan-400 flex items-center justify-center shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-xs border border-zinc-800 bg-zinc-900/60 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Telemetry Note */}
          <div className="px-3 py-1.5 bg-[#05070e] border-t border-zinc-800/80 flex items-center justify-between text-[8px] text-zinc-400">
            <span>NEURAL BACKDROP SYNC: ACTIVE</span>
            <span className="text-cyan-400 font-bold">MRU CACHE: 3 SLOTS</span>
          </div>
        </div>
      )}
    </div>
  );
};
