/**
 * Reminders & Timeline Page (Golden Space AI OS)
 *
 * Real Persistent Reminders & Schedule:
 * - Backed by SQLite (/api/reminders)
 * - Persistent across refreshes
 * - Add reminders, mark completed/dismissed, delete reminders
 * - Golden Space cinematic styling
 */

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Check, Bell, AlertCircle } from 'lucide-react';
import { soundFx } from '../utils/audioEffects.ts';

interface ReminderItem {
  id: string;
  title: string;
  datetime: string;
  recurrence: string;
  note: string;
  status: 'PENDING' | 'TRIGGERED' | 'DISMISSED';
  createdAt?: string;
}

export const CalendarPage: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDatetime, setNewDatetime] = useState('');
  const [newRecurrence, setNewRecurrence] = useState('ONCE');
  const [newNote, setNewNote] = useState('');

  const loadReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.warn('Failed to fetch reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFx.playClick();
    const payload = {
      title: newTitle.trim(),
      datetime: newDatetime.trim() || 'Today at 18:00',
      recurrence: newRecurrence,
      note: newNote.trim(),
      status: 'PENDING',
    };

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setReminders((prev) => [created, ...prev]);
        setNewTitle('');
        setNewDatetime('');
        setNewNote('');
      }
    } catch (err) {
      console.warn('Failed to add reminder:', err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    soundFx.playClick();
    const nextStatus = currentStatus === 'DISMISSED' ? 'PENDING' : 'DISMISSED';
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus as any } : r)));

    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.warn('Failed to update reminder status:', err);
      loadReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    soundFx.playClick();
    setReminders((prev) => prev.filter((r) => r.id !== id));

    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete reminder:', err);
      loadReminders();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] p-4 sm:p-6 overflow-y-auto custom-scrollbar font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#FFD76A] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8EAF0] tracking-wide flex items-center gap-2">
              <span>REMINDERS & SCHEDULE</span>
              <span className="text-[10px] font-mono text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                SQLITE PERSISTENT
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Synchronized cron scheduler • Persistent audio and HUD reminder queue
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFD76A] rounded-full font-bold">
          {reminders.filter((r) => r.status === 'PENDING').length} ACTIVE
        </span>
      </div>

      {/* Add Reminder Form */}
      <form
        onSubmit={addReminder}
        className="my-4 p-3.5 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.05)] flex flex-col sm:flex-row gap-2.5"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Reminder directive (e.g., Kal 10 baje project review)..."
          className="flex-1 bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#E8EAF0] placeholder:text-slate-500 focus:outline-none focus:border-[#FFD76A]"
        />

        <input
          type="text"
          value={newDatetime}
          onChange={(e) => setNewDatetime(e.target.value)}
          placeholder="Time (e.g., Tomorrow at 10:00 AM)"
          className="w-48 bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#E8EAF0] placeholder:text-slate-500 focus:outline-none"
        />

        <select
          value={newRecurrence}
          onChange={(e) => setNewRecurrence(e.target.value)}
          className="bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="ONCE">Once</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>SET REMINDER</span>
        </button>
      </form>

      {/* Reminder List */}
      <div className="space-y-3 pb-6">
        {isLoading && (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading persistent reminders...
          </div>
        )}

        {!isLoading && reminders.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500">
            No active reminders scheduled.
          </div>
        )}

        {reminders.map((rem) => {
          const isDone = rem.status === 'DISMISSED';
          return (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDone
                  ? 'bg-[#030712]/40 border-[#D4AF37]/10 opacity-60'
                  : 'bg-[#030712]/80 backdrop-blur-md border-[#D4AF37]/25 hover:border-[#FFD76A]/50 shadow-[0_0_15px_rgba(212,175,55,0.03)]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleStatus(rem.id, rem.status)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isDone
                      ? 'bg-[#D4AF37] border-[#FFD76A] text-[#030712]'
                      : 'border-[#D4AF37]/40 hover:border-[#FFD76A] bg-transparent'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFD76A] flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {rem.datetime}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] uppercase font-mono">
                      {rem.recurrence}
                    </span>
                  </div>
                  <h3 className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-500' : 'text-[#E8EAF0]'}`}>
                    {rem.title}
                  </h3>
                  {rem.note && (
                    <p className="text-xs text-slate-400 truncate">{rem.note}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => deleteReminder(rem.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-950/30"
                  title="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
