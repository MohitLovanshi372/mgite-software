/**
 * MediaAndSearchHub Component
 *
 * Integrated Control Hub for:
 * 1. YouTube & Cyber Audio Stream (Plays dark synthwave & connects to YouTube search)
 * 2. Ultron Knowledge Graph & Google Search (3D GLB models, robotics, neural architecture)
 */

import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Search,
  Music,
  Play,
  Square,
  Volume2,
  ExternalLink,
  Radio,
  ArrowRight,
  Box,
  Flame,
} from 'lucide-react';
import { cyberMusic } from '../../utils/cyberMusic.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';
import { safeBrowserControl } from '../../../core/tools/browserControl.ts';

interface MediaAndSearchHubProps {
  onSearchQuery?: (query: string) => void;
  className?: string;
}

export const MediaAndSearchHub: React.FC<MediaAndSearchHubProps> = ({
  onSearchQuery,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'MUSIC' | 'SEARCH'>('MUSIC');

  // Music state
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(cyberMusic.getIsPlaying());
  const [currentTrack, setCurrentTrack] = useState<string>(cyberMusic.getCurrentTrack());
  const [musicQuery, setMusicQuery] = useState<string>('Ultron dark synthwave industrial cyber');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; snippet: string; source: string; link: string; category: string }>
  >([
    {
      title: 'glTF 2.0 Binary (GLB) Mesh Specification & PBR Metallic-Roughness',
      snippet: 'Hardware accelerated PBR shader pipelines using standard normal maps, occlusion, and skeletal animation nodes in WebGL.',
      source: 'Khronos Group 3D Spec',
      link: 'https://www.google.com/search?q=glTF+2.0+GLB+PBR+Specification',
      category: '3D GRAPHICS',
    },
    {
      title: 'Autonomous Multi-Agent Robotics & Kinematic Solvers',
      snippet: 'Inverse kinematics, servo trajectory prediction, and distributed sensor mesh networks for cybernetic chassis.',
      source: 'Robotics & Automation Index',
      link: 'https://www.google.com/search?q=Autonomous+Robotics+Kinematics',
      category: 'CYBERNETICS',
    },
    {
      title: 'Ultron Neural Lattice & Autonomous Cognitive Overrides',
      snippet: 'Decentralized neural weights computation with zero external latency and sovereign execution protocols.',
      source: 'Ultron Sovereign Core',
      link: 'https://www.google.com/search?q=Decentralized+Neural+Lattice+AI',
      category: 'AI MATRIX',
    },
  ]);

  useEffect(() => {
    const unsub = cyberMusic.subscribe((playing, track) => {
      setIsPlayingMusic(playing);
      setCurrentTrack(track);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleToggleMusic = () => {
    soundFx.playClick();
    cyberMusic.togglePlay(musicQuery ? `ULTRON STREAM: ${musicQuery.toUpperCase()}` : undefined);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    soundFx.playClick();
    ultronVoice.speak(`Querying cybernetic neural networks and Google index for ${searchQuery}.`);

    // Add immediate synthetic result
    const newRes = {
      title: `Cybernetic Knowledge Graph: ${searchQuery}`,
      snippet: `Indexed real-time intelligence telemetry for "${searchQuery}". Parameters validated.`,
      source: 'Google Search & Ultron Matrix Core',
      link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      category: 'CYBER INTEL',
    };

    setSearchResults([newRes, ...searchResults]);
    if (onSearchQuery) {
      onSearchQuery(searchQuery);
    }
  };

  const handleOpenYouTubeDirect = () => {
    soundFx.playClick();
    const query = musicQuery || 'ultron dark synthwave industrial cyber';
    safeBrowserControl.searchYouTube(query);
    ultronVoice.speak(`Sure, ${query} search kar rahi hoon.`);
  };

  const handleOpenGoogleDirect = () => {
    soundFx.playClick();
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery || '3D GLB models WebGL robotics')}`;
    window.open(gUrl, '_blank', 'noopener,noreferrer');
    ultronVoice.speak(`Launching external Google cybernetic search bridge.`);
  };

  return (
    <div
      className={`bg-[#07090e]/95 border border-red-950/80 rounded-xs p-3 font-mono backdrop-blur-md shadow-2xl relative ${className}`}
    >
      {/* Corner Brackets */}
      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-500 pointer-events-none" />
      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-500 pointer-events-none" />
      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-500 pointer-events-none" />
      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-500 pointer-events-none" />

      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('MUSIC')}
            className={`px-2.5 py-1 text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer rounded-xs border ${
              activeTab === 'MUSIC'
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>YOUTUBE & CYBER AUDIO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEARCH')}
            className={`px-2.5 py-1 text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer rounded-xs border ${
              activeTab === 'SEARCH'
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-red-400" />
            <span>CYBER INTEL & SEARCH</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-[9px] text-zinc-500 uppercase">
          COMM BUFFER: 440Hz // ULTRON RELAY
        </span>
      </div>

      {/* TAB 1: YOUTUBE & AUDIO STREAM */}
      {activeTab === 'MUSIC' && (
        <div className="space-y-3">
          {/* Active Player Deck */}
          <div className="bg-[#0b0e17] border border-zinc-800 p-2.5 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-950/90 border border-red-600/80 flex items-center justify-center text-red-400 shrink-0">
                <Music className={`w-4 h-4 ${isPlayingMusic ? 'animate-bounce text-red-400' : 'text-zinc-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200">{currentTrack}</span>
                  <span
                    className={`text-[8px] px-1.5 py-0.2 rounded-xs font-bold ${
                      isPlayingMusic
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-400 animate-pulse'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {isPlayingMusic ? 'STREAMING ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 flex items-center gap-2 pt-0.5">
                  <span>INDUSTRIAL DARK SYNTH</span>
                  <span>•</span>
                  <span>HAND GESTURE: THUMBS UP = PLAY / OPEN PALM = HALT</span>
                </p>
              </div>
            </div>

            {/* Play/Stop Controls & YouTube External Bridge */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleToggleMusic}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPlayingMusic
                    ? 'bg-red-950 border-red-500 text-red-200 hover:bg-red-900'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                }`}
              >
                {isPlayingMusic ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>HALT AUDIO</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>PLAY SYNTH</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenYouTubeDirect}
                className="px-2.5 py-1.5 bg-[#120708] border border-red-900/80 text-red-400 hover:bg-red-950 hover:text-red-300 text-[10px] font-bold rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Search and Open in YouTube"
              >
                <ExternalLink className="w-3 h-3" />
                <span>OPEN YOUTUBE</span>
              </button>
            </div>
          </div>

          {/* Audio Query & Channel presets */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={musicQuery}
                onChange={(e) => setMusicQuery(e.target.value)}
                placeholder="Search music track / genre for YouTube or acoustic synth..."
                className="w-full bg-[#090b10] border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 rounded-xs focus:outline-hidden focus:border-red-500 placeholder-zinc-600 font-mono"
              />
            </div>
            <div className="flex items-center gap-1 w-full sm:w-auto">
              {['ULTRON THEME', 'CYBER SYNTH', 'ROBOTIC MATRIX'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMusicQuery(preset);
                    cyberMusic.play(`ULTRON AUDIO // ${preset}`);
                  }}
                  className="px-2 py-1 bg-zinc-950 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-300 text-[9px] rounded-xs cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE SEARCH & INTEL */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-3">
          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google 3D assets, GLB models, robotics or cybernetic telemetry..."
                className="w-full bg-[#080b12] border border-red-900/60 px-3 py-2 text-xs text-zinc-100 rounded-xs focus:outline-hidden focus:border-red-400 placeholder-zinc-600 font-mono pl-8"
              />
              <Search className="w-3.5 h-3.5 text-red-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900 text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>SEARCH</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleOpenGoogleDirect}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-xs rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Open query in Google Search"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">GOOGLE.COM</span>
            </button>
          </form>

          {/* Live Search Intel Feed */}
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {searchResults.map((res, i) => (
              <div
                key={i}
                className="bg-[#0a0d14] border border-zinc-800/80 hover:border-red-800 p-2 rounded-xs transition-colors"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[9px] px-1.5 py-0.2 bg-red-950 border border-red-600/50 text-red-300 font-bold">
                    {res.category}
                  </span>
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-zinc-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <span>{res.source}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <h4 className="text-xs font-bold text-zinc-200">{res.title}</h4>
                <p className="text-[10px] text-zinc-400 pt-0.5 leading-relaxed">{res.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
