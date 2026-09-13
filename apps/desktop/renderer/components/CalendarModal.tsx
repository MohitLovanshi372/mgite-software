/**
 * JARVIS Calendar & Schedule Modal
 * Interactive calendar agenda and timeblocks viewer.
 */

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Plus, MapPin, Tag } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Neural Architecture Synchronization',
      time: '09:00 - 10:30',
      date: 'Today',
      category: 'Deep Work',
      location: 'Local Workspace',
    },
    {
      id: '2',
      title: 'JARVIS Voice Synthesis Performance Audit',
      time: '13:00 - 14:00',
      date: 'Today',
      category: 'System',
      location: 'Terminal Core',
    },
    {
      id: '3',
      title: 'Privacy Policy & SQLite Airgap Check',
      time: '16:30 - 17:15',
      date: 'Today',
      category: 'Security',
      location: 'Secure Sandbox',
    },
    {
      id: '4',
      title: 'Autonomous Research Digest Review',
      time: '10:00 - 11:00',
      date: 'Tomorrow',
      category: 'Intelligence',
      location: 'Knowledge Base',
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00 - 12:00');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setEvents([
      ...events,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        time: newTime,
        date: 'Today',
        category: 'Task',
        location: 'Local',
      },
    ]);
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#06080e] border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                CALENDAR & TIMELINE
              </h2>
              <p className="text-xs text-slate-400">Schedule, agendas, and autonomous calendar events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                ACTIVE TIMELINE
              </span>
              <span className="text-xs font-mono text-slate-500">({events.length} Scheduled)</span>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 text-slate-950 text-xs font-mono font-semibold hover:bg-cyan-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Event title..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 14:00 - 15:00"
                  className="w-48 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      {ev.date}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ev.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-100">{ev.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {ev.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {ev.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>JARVIS CHRONO ENGINE</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
