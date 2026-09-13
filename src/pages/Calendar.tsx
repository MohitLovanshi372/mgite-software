/**
 * Calendar Page
 * Chronological operation schedule, diagnostic routines, and threat evaluations.
 */

import React from 'react';
import { Calendar as CalendarIcon, Clock, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { initialCalendarEvents } from '../data/mockData.ts';

export const CalendarPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              OPERATIONAL TIMELINE & AGENDA
            </h2>
            <p className="text-xs text-zinc-400">
              Synchronized cron scheduler • Deep pulse diagnostic cycles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#08090e] border border-zinc-800 px-2 py-1">
          <button className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-200">FRI, 13 SEP 2026</span>
          <button className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3 my-6">
        {initialCalendarEvents.map((ev) => (
          <div
            key={ev.id}
            className="p-4 bg-[#08090f] border border-zinc-800 hover:border-red-900/60 rounded-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ev.time}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                  {ev.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">{ev.title}</h3>
              <p className="text-[10px] text-zinc-400">PROTOCOL: {ev.protocol}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] px-2 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                THREAT: {ev.threatEvaluation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
