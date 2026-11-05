/**
 * YouTubeFullPlayer Component
 *
 * Comprehensive YouTube & Music Video Controller with:
 * 1. Embedded auto-playing responsive YouTube video stage
 * 2. Full playback controls (Play, Pause, Volume, Mute, Loop, Fullscreen)
 * 3. Video Switcher ("Change Video", Next, Prev, & Playlist Selection)
 * 4. Real-time Search & Instant Video Discovery
 * 5. Media Downloader (MP4 Video & MP3 Audio) with active progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Download,
  Search,
  Youtube,
  RefreshCw,
  ExternalLink,
  Music,
  CheckCircle2,
  ListMusic,
  Maximize2,
  Radio,
  FileVideo,
  FileAudio,
  Trash2,
} from 'lucide-react';
import {
  youtubePlayerService,
  YouTubeVideo,
  PlayerState,
} from '../../utils/youtubePlayerService.ts';
import { soundFx } from '../../utils/audioEffects.ts';
import { ultronVoice } from '../../utils/ultronVoice.ts';

interface YouTubeFullPlayerProps {
  className?: string;
  compact?: boolean;
}

export const YouTubeFullPlayer: React.FC<YouTubeFullPlayerProps> = ({
  className = '',
  compact = false,
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>(
    youtubePlayerService.getState()
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PLAYER' | 'PLAYLIST' | 'DOWNLOADS'>('PLAYER');

  useEffect(() => {
    const unsub = youtubePlayerService.subscribe((newState) => {
      setPlayerState(newState);
    });
    return () => unsub();
  }, []);

  const {
    currentVideo,
    isPlaying,
    autoPlay,
    volume,
    isMuted,
    playlist,
    downloads,
  } = playerState;

  const handleTogglePlay = () => {
    soundFx.playClick();
    youtubePlayerService.togglePlay();
  };

  const handleChangeVideo = (direction: 'next' | 'prev' = 'next') => {
    soundFx.playClick();
    const next = youtubePlayerService.changeVideo(direction);
    ultronVoice.speak(`Video badal diya hai. Ab ${next.title} play ho raha hai.`);
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    soundFx.playClick();
    youtubePlayerService.selectVideo(video);
    ultronVoice.speak(`Ab ${video.title} play ho raha hai.`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    soundFx.playClick();
    const searched = youtubePlayerService.searchAndPlay(searchQuery);
    ultronVoice.speak(`Sure, ${searched.title} search karke play kar rahi hoon.`);
  };

  const handleDownload = (format: 'MP4' | 'MP3') => {
    soundFx.playClick();
    youtubePlayerService.download(format, currentVideo);
    ultronVoice.speak(
      format === 'MP4'
        ? `Main ${currentVideo.title} ka video download shuru kar rahi hoon.`
        : `Main ${currentVideo.title} ka MP3 audio download shuru kar rahi hoon.`
    );
    setActiveTab('DOWNLOADS');
  };

  return (
    <div
      className={`bg-[#070c18]/95 border border-cyan-500/30 rounded-2xl p-3.5 backdrop-blur-xl font-sans shadow-2xl flex flex-col gap-3 relative overflow-hidden ${className}`}
    >
      {/* Top Header & Mode Navigation */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-100 flex items-center gap-1.5 uppercase">
              <span>YouTube Cinema & Media Studio</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 font-mono">
                {isPlaying ? 'PLAYING' : 'READY'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
              {currentVideo.artist} – {currentVideo.title}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('PLAYER')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'PLAYER'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Player
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PLAYLIST')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'PLAYLIST'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-3 h-3" />
            <span>Playlist</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DOWNLOADS')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'DOWNLOADS'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3 h-3" />
            <span>Downloads ({downloads.length})</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any YouTube music, video, or artist (e.g. Arijit Singh, Synthwave, Believer)..."
            className="w-full bg-[#0a1122] border border-cyan-500/25 pl-9 pr-3 py-1.5 text-xs text-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-400 placeholder-slate-500 font-sans"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Play Search</span>
        </button>
      </form>

      {/* MAIN STAGE / TAB 1: PLAYER */}
      {activeTab === 'PLAYER' && (
        <div className="space-y-3">
          {/* 16:9 Aspect Ratio Video Embed with Auto-Play */}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-cyan-500/20 shadow-inner group">
            {isPlaying ? (
              <iframe
                src={`${currentVideo.embedUrl}${isMuted ? '&mute=1' : ''}`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                <img
                  src={currentVideo.thumbnail}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.7)] transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </button>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-white drop-shadow-md">{currentVideo.title}</p>
                    <p className="text-xs text-slate-300 drop-shadow-md">{currentVideo.artist}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div className="bg-[#0a1122]/90 border border-cyan-500/20 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
            {/* Play/Pause, Next, Prev, Change Video */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeVideo('prev')}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                title="Previous Video"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Video</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleChangeVideo('next')}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                title="Next Video"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Explicit "CHANGE VIDEO" Button */}
              <button
                type="button"
                onClick={() => handleChangeVideo('next')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)] cursor-pointer"
                title="Change to another video"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Change Video</span>
              </button>
            </div>

            {/* Volume & Auto-Play Options */}
            <div className="flex items-center gap-2.5">
              {/* Auto-Play Switch */}
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => youtubePlayerService.setAutoPlay(e.target.checked)}
                  className="rounded-xs border-cyan-500/40 text-cyan-500 focus:ring-0"
                />
                <span className="text-[11px] font-mono">AUTO-PLAY</span>
              </label>

              {/* Mute Button */}
              <button
                type="button"
                onClick={() => youtubePlayerService.toggleMute()}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {/* Volume Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => youtubePlayerService.setVolume(Number(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
                title={`Volume: ${volume}%`}
              />

              {/* External YouTube Link */}
              <a
                href={currentVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                title="Open in YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Download Buttons */}
          <div className="flex items-center justify-between bg-[#081022] border border-cyan-500/20 p-2 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-xs">Download Options:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload('MP4')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_8px_rgba(37,99,235,0.3)]"
              >
                <FileVideo className="w-3.5 h-3.5" />
                <span>Download Video (MP4)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('MP3')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              >
                <FileAudio className="w-3.5 h-3.5" />
                <span>Download Audio (MP3)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYLIST / VIDEO SWITCHER */}
      {activeTab === 'PLAYLIST' && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 font-mono">
            <span>AVAILABLE QUEUE ({playlist.length} VIDEOS)</span>
            <span>CLICK TO SWITCH VIDEO</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {playlist.map((video) => {
              const isCurrent = video.id === currentVideo.id;
              return (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-[#091122] border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-14 h-10 object-cover rounded-lg shrink-0 border border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-100 truncate">{video.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{video.artist}</p>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400 mt-0.5">
                      <span>{video.duration}</span>
                      <span>•</span>
                      <span>{video.category}</span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DOWNLOADS MANAGER */}
      {activeTab === 'DOWNLOADS' && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 font-mono">
            <span>SAVED MEDIA DOWNLOADS</span>
            {downloads.length > 0 && (
              <button
                type="button"
                onClick={() => youtubePlayerService.clearDownloads()}
                className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {downloads.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Download className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              <p>No active downloads.</p>
              <p className="text-[10px] text-slate-600 mt-1">
                Click "Download Video (MP4)" or "Download Audio (MP3)" on any playing track.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {downloads.map((dl) => (
                <div
                  key={dl.id}
                  className="bg-[#091122] border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      {dl.format === 'MP4' ? (
                        <FileVideo className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-200 truncate">{dl.title}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-800 text-slate-400">
                      {dl.format} • {dl.fileSize}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dl.status === 'completed'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-cyan-400 animate-pulse'
                      }`}
                      style={{ width: `${dl.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>
                      {dl.status === 'completed' ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>DOWNLOAD COMPLETED</span>
                        </span>
                      ) : (
                        <span>Downloading: {dl.progress}%</span>
                      )}
                    </span>
                    {dl.downloadUrl && (
                      <a
                        href={dl.downloadUrl}
                        download={`${dl.title}.${dl.format.toLowerCase()}`}
                        className="text-cyan-400 hover:underline font-bold"
                      >
                        Save File
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
