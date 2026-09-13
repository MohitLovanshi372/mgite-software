/**
 * HUDFrame Component
 * Angular mechanical border with chamfered corners, technical tick marks, and crimson accents.
 */

import React from 'react';

interface HUDFrameProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'emerald' | 'gray';
  subTitle?: string;
}

export const HUDFrame: React.FC<HUDFrameProps> = ({
  children,
  className = '',
  title,
  badge,
  badgeColor = 'red',
  subTitle,
}) => {
  const getBadgeClass = () => {
    switch (badgeColor) {
      case 'red':
        return 'border-red-600/60 bg-red-950/60 text-red-400 shadow-[0_0_8px_rgba(220,38,38,0.4)]';
      case 'amber':
        return 'border-amber-600/60 bg-amber-950/60 text-amber-400';
      case 'emerald':
        return 'border-emerald-600/60 bg-emerald-950/60 text-emerald-400';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-400';
    }
  };

  return (
    <div
      className={`relative bg-[#0c0d12]/90 border border-zinc-800/90 text-zinc-200 transition-all ${className}`}
    >
      {/* Corner Bracket Accents */}
      <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500/80 pointer-events-none" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500/80 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500/80 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500/80 pointer-events-none" />

      {/* Header bar if title provided */}
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-[#111218] to-zinc-900/90">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-xs shadow-[0_0_6px_#ef4444]" />
            <h3 className="text-[11px] font-mono font-bold tracking-widest text-zinc-100 uppercase">
              {title}
            </h3>
            {subTitle && (
              <span className="text-[9px] font-mono text-zinc-400 hidden sm:inline">
                // {subTitle}
              </span>
            )}
          </div>

          {badge && (
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 border uppercase tracking-wider ${getBadgeClass()}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Frame content */}
      <div className="relative p-3">{children}</div>
    </div>
  );
};
