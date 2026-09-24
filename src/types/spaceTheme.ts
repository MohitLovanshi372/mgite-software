/**
 * Space Theme Definitions & Configuration
 * Provides distinct celestial color matrices, cyber conduits, and ambient space dust palettes
 */

export type SpaceThemeId =
  | 'CRIMSON_NEBULA'
  | 'CYBER_CYAN'
  | 'GALACTIC_VIOLET'
  | 'SOLAR_GOLD'
  | 'EMERALD_AURORA'
  | 'OBSIDIAN_VOID';

export interface SpaceThemeConfig {
  id: SpaceThemeId;
  name: string;
  shortLabel: string;
  tagline: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  accentColor: string; // hex
  hubColor: string; // rgba
  conduitHubPrefix: string; // rgba(r,g,b,
  conduitNormalPrefix: string; // rgba(r,g,b,
  ambientGlow: string; // rgba
  ambientAlert: string; // rgba
  bgHex: string;
  packetColor: string;
  scanlineRgba: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
}

export const SPACE_THEME_CATALOG: Record<SpaceThemeId, SpaceThemeConfig> = {
  CRIMSON_NEBULA: {
    id: 'CRIMSON_NEBULA',
    name: 'Ultron Crimson',
    shortLabel: 'CRIMSON',
    tagline: 'Deep scarlet cyber-matrix and high-voltage conduits',
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626',
    accentColor: '#f87171',
    hubColor: 'rgba(239, 68, 68, 1)',
    conduitHubPrefix: 'rgba(239, 68, 68, ',
    conduitNormalPrefix: 'rgba(100, 116, 139, ',
    ambientGlow: 'rgba(220, 38, 38, 0.04)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#020306',
    packetColor: '#ef4444',
    scanlineRgba: 'rgba(239, 68, 68, 0.04)',
    badgeBorder: 'border-red-600/70',
    badgeBg: 'bg-red-950/70',
    badgeText: 'text-red-400',
    dotBg: 'bg-red-500',
  },
  CYBER_CYAN: {
    id: 'CYBER_CYAN',
    name: 'Quantum Cyan',
    shortLabel: 'CYAN',
    tagline: 'Electric teal starlight & photonic particle conduits',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    accentColor: '#22d3ee',
    hubColor: 'rgba(6, 182, 212, 1)',
    conduitHubPrefix: 'rgba(6, 182, 212, ',
    conduitNormalPrefix: 'rgba(71, 85, 105, ',
    ambientGlow: 'rgba(6, 182, 212, 0.05)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#020508',
    packetColor: '#22d3ee',
    scanlineRgba: 'rgba(6, 182, 212, 0.04)',
    badgeBorder: 'border-cyan-600/70',
    badgeBg: 'bg-cyan-950/70',
    badgeText: 'text-cyan-400',
    dotBg: 'bg-cyan-500',
  },
  GALACTIC_VIOLET: {
    id: 'GALACTIC_VIOLET',
    name: 'Andromeda Violet',
    shortLabel: 'VIOLET',
    tagline: 'Cosmic purple dark matter & neon magenta pulse',
    primaryColor: '#a855f7',
    secondaryColor: '#9333ea',
    accentColor: '#c084fc',
    hubColor: 'rgba(168, 85, 247, 1)',
    conduitHubPrefix: 'rgba(168, 85, 247, ',
    conduitNormalPrefix: 'rgba(90, 80, 115, ',
    ambientGlow: 'rgba(168, 85, 247, 0.05)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#030208',
    packetColor: '#e879f9',
    scanlineRgba: 'rgba(168, 85, 247, 0.04)',
    badgeBorder: 'border-purple-600/70',
    badgeBg: 'bg-purple-950/70',
    badgeText: 'text-purple-400',
    dotBg: 'bg-purple-500',
  },
  SOLAR_GOLD: {
    id: 'SOLAR_GOLD',
    name: 'Supernova Gold',
    shortLabel: 'SOLAR',
    tagline: 'Solar coronal flare & molten amber streams',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    accentColor: '#fbbf24',
    hubColor: 'rgba(245, 158, 11, 1)',
    conduitHubPrefix: 'rgba(245, 158, 11, ',
    conduitNormalPrefix: 'rgba(115, 95, 75, ',
    ambientGlow: 'rgba(245, 158, 11, 0.05)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#050402',
    packetColor: '#fbbf24',
    scanlineRgba: 'rgba(245, 158, 11, 0.04)',
    badgeBorder: 'border-amber-600/70',
    badgeBg: 'bg-amber-950/70',
    badgeText: 'text-amber-400',
    dotBg: 'bg-amber-500',
  },
  EMERALD_AURORA: {
    id: 'EMERALD_AURORA',
    name: 'Borealis Emerald',
    shortLabel: 'AURORA',
    tagline: 'Polar magnetic plasma & radiant jade circuits',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    hubColor: 'rgba(16, 185, 129, 1)',
    conduitHubPrefix: 'rgba(16, 185, 129, ',
    conduitNormalPrefix: 'rgba(75, 105, 90, ',
    ambientGlow: 'rgba(16, 185, 129, 0.05)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#020604',
    packetColor: '#34d399',
    scanlineRgba: 'rgba(16, 185, 129, 0.04)',
    badgeBorder: 'border-emerald-600/70',
    badgeBg: 'bg-emerald-950/70',
    badgeText: 'text-emerald-400',
    dotBg: 'bg-emerald-500',
  },
  OBSIDIAN_VOID: {
    id: 'OBSIDIAN_VOID',
    name: 'Obsidian Starlight',
    shortLabel: 'VOID',
    tagline: 'Deep space event horizon & diamond starlight',
    primaryColor: '#e2e8f0',
    secondaryColor: '#94a3b8',
    accentColor: '#f8fafc',
    hubColor: 'rgba(241, 245, 249, 1)',
    conduitHubPrefix: 'rgba(226, 232, 240, ',
    conduitNormalPrefix: 'rgba(71, 85, 105, ',
    ambientGlow: 'rgba(226, 232, 240, 0.04)',
    ambientAlert: 'rgba(239, 68, 68, 0.12)',
    bgHex: '#020204',
    packetColor: '#ffffff',
    scanlineRgba: 'rgba(226, 232, 240, 0.04)',
    badgeBorder: 'border-slate-500/70',
    badgeBg: 'bg-slate-900/70',
    badgeText: 'text-slate-300',
    dotBg: 'bg-slate-200',
  },
};

export const DEFAULT_SPACE_THEME: SpaceThemeId = 'CRIMSON_NEBULA';
export const DEFAULT_SPACE_THEME_HISTORY: SpaceThemeId[] = [
  'CRIMSON_NEBULA',
  'CYBER_CYAN',
  'GALACTIC_VIOLET',
];
