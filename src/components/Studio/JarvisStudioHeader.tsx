import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  CameraOff,
  RotateCcw,
  RefreshCw,
  Download,
  Activity,
  Box,
  Radio,
  Sliders,
  ChevronDown,
  Layers,
  Palette,
  Eye,
  Upload,
  Check,
  Zap,
} from 'lucide-react';
import { GLBModelOption, MaterialMode } from '../../types/glbModels.ts';

interface JarvisStudioHeaderProps {
  connectionStatus?: 'ONLINE' | 'STANDBY' | 'CONNECTING';
  isCameraActive: boolean;
  onToggleCamera: () => void;
  showOpticalHUD?: boolean;
  onToggleOpticalHUD?: () => void;
  selectedModelName: string;
  selectedModelId?: string;
  availableModels?: GLBModelOption[];
  onSelectModel?: (model: GLBModelOption) => void;
  meshCount: number;
  boneCount: number;
  fps: number;
  frameTime: number;
  onResetCamera: () => void;
  onReloadModel: () => void;
  onSnapshot: () => void;
  materialMode?: MaterialMode;
  onSelectMaterialMode?: (mode: MaterialMode) => void;
  wireframe?: boolean;
  onToggleWireframe?: () => void;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  isLeftOpen?: boolean;
  isRightOpen?: boolean;
  onUploadClick?: () => void;
}

export const JarvisStudioHeader: React.FC<JarvisStudioHeaderProps> = ({
  connectionStatus = 'ONLINE',
  isCameraActive,
  onToggleCamera,
  showOpticalHUD = true,
  onToggleOpticalHUD,
  selectedModelName,
  selectedModelId,
  availableModels = [],
  onSelectModel,
  meshCount,
  boneCount,
  fps,
  frameTime,
  onResetCamera,
  onReloadModel,
  onSnapshot,
  materialMode = 'original',
  onSelectMaterialMode,
  wireframe = false,
  onToggleWireframe,
  autoRotate = false,
  onToggleAutoRotate,
  showGrid = true,
  onToggleGrid,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftOpen = true,
  isRightOpen = true,
  onUploadClick,
}) => {
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const materialOptions: { id: MaterialMode; label: string; desc: string }[] = [
    { id: 'original', label: 'ORIGINAL PBR', desc: 'Default physically based rendering' },
    { id: 'jarvis_cyan', label: 'JARVIS ARC CYAN', desc: 'Glowing reactor cybernetic blue' },
    { id: 'gold_titanium', label: 'GOLD TITANIUM', desc: 'Mark-85 alloy gold & titanium' },
    { id: 'crimson_glow', label: 'CRIMSON FORGE', desc: 'High-energy red emissive shader' },
    { id: 'obsidian_titanium', label: 'OBSIDIAN CHROME', desc: 'Stealth dark titanium finish' },
    { id: 'wireframe_ghost', label: 'HOLO WIRE', desc: 'Holographic matrix wireframe' },
  ];

  return (
    <header className="w-full h-14 bg-[#05070d]/95 border-b border-red-950/80 px-2 sm:px-4 flex items-center justify-between z-30 select-none font-mono backdrop-blur-md shrink-0 shadow-lg relative">
      {/* 1. Left: Brand & Mobile Sidebar Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            title={isLeftOpen ? 'Collapse Left Controls' : 'Open Left Controls'}
            className="p-1.5 rounded-xs bg-[#090c17] border border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-red-600 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xs bg-red-950/70 border border-red-600/90 shadow-[0_0_12px_rgba(239,68,68,0.45)]">
            <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
            <div className="absolute inset-0 rounded-xs border border-red-500/30 animate-ping opacity-30 pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wider text-zinc-100 uppercase">
                JARVIS <span className="text-red-500">//</span> AVATAR
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.2 bg-red-950/80 border border-red-800/80 text-red-300 text-[9px] font-bold rounded-2xs">
                3D GLB
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 tracking-tight hidden lg:block">
              Kinematics • Shading • Optical HUD
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle Menus & Options: Avatar Menu, Optical HUD, View Options */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* AVATAR SELECTOR MENU */}
        <div className="relative" ref={avatarMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsAvatarMenuOpen(!isAvatarMenuOpen);
              setIsViewMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-[#090c17] hover:bg-[#0f1424] border border-zinc-800 hover:border-red-600/60 rounded-xs text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-[10px] font-bold hidden sm:inline text-zinc-400">AVATAR:</span>
            <span className="text-[10px] font-bold text-zinc-100 max-w-[110px] sm:max-w-[150px] truncate">
              {selectedModelName}
            </span>
            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isAvatarMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAvatarMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#060812]/98 border border-zinc-700/80 rounded-xs shadow-2xl p-1.5 z-50 backdrop-blur-xl">
              <div className="px-2 py-1 border-b border-zinc-800 text-[9px] font-bold text-zinc-400 flex items-center justify-between">
                <span>SELECT 3D AVATAR</span>
                <span className="text-red-400">{availableModels.length} PRESETS</span>
              </div>
              <div className="py-1 space-y-1">
                {availableModels.map((m) => {
                  const isSelected = m.id === selectedModelId || m.name === selectedModelName;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel?.(m);
                        setIsAvatarMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xs border text-[10px] flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/70 border-red-500 text-white'
                          : 'bg-[#090c18] border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/70'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold flex items-center gap-1.5 truncate">
                          {isSelected && <Check className="w-3 h-3 text-red-400 shrink-0" />}
                          <span className="truncate">{m.name}</span>
                        </div>
                        <div className="text-[8px] text-zinc-500 truncate mt-0.5">
                          {m.category} • {m.triangleEstimate || '3D Armature'}
                        </div>
                      </div>
                      <span className="text-[8px] px-1 py-0.5 bg-black/60 rounded-2xs text-zinc-400 shrink-0">
                        {m.source.toUpperCase()}
                      </span>
                    </button>
                  );
                })}

                {onUploadClick && (
                  <button
                    type="button"
                    onClick={() => {
                      onUploadClick();
                      setIsAvatarMenuOpen(false);
                    }}
                    className="w-full text-left p-2 bg-[#090c18] hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-red-500 rounded-xs text-[10px] text-zinc-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-red-400" />
                    <span>UPLOAD CUSTOM .GLB / .GLTF</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPTICAL HUD MASTER TOGGLE */}
        {onToggleOpticalHUD && (
          <button
            type="button"
            onClick={onToggleOpticalHUD}
            title={showOpticalHUD ? 'Hide Optical HUD overlay' : 'Show Optical HUD overlay'}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border transition-all cursor-pointer ${
              showOpticalHUD
                ? isCameraActive
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-950/70 border-amber-600/80 text-amber-200'
                : 'bg-[#090c17] border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${showOpticalHUD && isCameraActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-bold hidden sm:inline">OPTICAL HUD:</span>
            <span className="text-[10px] font-bold">
              {showOpticalHUD ? (isCameraActive ? 'LIVE' : 'STANDBY') : 'OFF'}
            </span>
          </button>
        )}

        {/* VIEW & SHADING OPTIONS MENU */}
        <div className="relative" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsViewMenuOpen(!isViewMenuOpen);
              setIsAvatarMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-[#090c17] hover:bg-[#0f1424] border border-zinc-800 hover:border-red-600/60 rounded-xs text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-bold hidden md:inline">OPTIONS</span>
            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isViewMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isViewMenuOpen && (
            <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-1.5 w-64 bg-[#060812]/98 border border-zinc-700/80 rounded-xs shadow-2xl p-2 z-50 backdrop-blur-xl">
              <div className="px-1 py-0.5 border-b border-zinc-800 text-[9px] font-bold text-zinc-400 mb-1.5">
                MATERIAL SHADER OVERRIDE
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2.5">
                {materialOptions.map((opt) => {
                  const isSelected = materialMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSelectMaterialMode?.(opt.id);
                      }}
                      className={`p-1.5 rounded-2xs border text-[9px] font-bold text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : 'bg-[#090c18] border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="px-1 py-0.5 border-b border-zinc-800 text-[9px] font-bold text-zinc-400 mb-1.5">
                VIEWPORT DISPLAY TOGGLES
              </div>
              <div className="grid grid-cols-2 gap-1">
                {onToggleWireframe && (
                  <button
                    type="button"
                    onClick={onToggleWireframe}
                    className={`p-1.5 rounded-2xs border text-[9px] font-bold flex items-center justify-between cursor-pointer ${
                      wireframe ? 'bg-cyan-950 border-cyan-400 text-cyan-200' : 'bg-[#090c18] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>WIREFRAME</span>
                    <span>{wireframe ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                {onToggleAutoRotate && (
                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`p-1.5 rounded-2xs border text-[9px] font-bold flex items-center justify-between cursor-pointer ${
                      autoRotate ? 'bg-red-950 border-red-500 text-red-200' : 'bg-[#090c18] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>AUTO-SPIN</span>
                    <span>{autoRotate ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                {onToggleGrid && (
                  <button
                    type="button"
                    onClick={onToggleGrid}
                    className={`p-1.5 rounded-2xs border text-[9px] font-bold flex items-center justify-between cursor-pointer ${
                      showGrid ? 'bg-zinc-800 border-zinc-600 text-zinc-200' : 'bg-[#090c18] border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>FLOOR GRID</span>
                    <span>{showGrid ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onResetCamera}
                  className="p-1.5 rounded-2xs border border-zinc-800 bg-[#090c18] text-zinc-300 hover:text-white font-bold text-[9px] flex items-center justify-between cursor-pointer"
                >
                  <span>RESET CAM</span>
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: Quick Actions & Intelligence Toggle */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onResetCamera}
          title="Reset Camera Framing (Centers full-body avatar)"
          className="p-1.5 sm:px-2.5 sm:py-1 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden xl:inline text-[10px] font-bold">RESET CAM</span>
        </button>

        <button
          type="button"
          onClick={onReloadModel}
          title="Reload Current 3D GLB Model"
          className="p-1.5 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs rounded-xs flex items-center transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        <button
          type="button"
          onClick={onSnapshot}
          title="Capture High-Res Viewport Snapshot"
          className="p-1.5 bg-[#090c17] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs rounded-xs flex items-center transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {onToggleRightSidebar && (
          <button
            type="button"
            onClick={onToggleRightSidebar}
            title={isRightOpen ? 'Collapse Telemetry' : 'Open Telemetry'}
            className="p-1.5 rounded-xs bg-[#090c17] border border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-red-600 transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
