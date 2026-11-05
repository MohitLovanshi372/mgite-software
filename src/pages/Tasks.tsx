/**
 * Tasks Page (Golden Space AI OS)
 *
 * Real Persistent Task Directives:
 * - Backed by SQLite (/api/tasks)
 * - Persistent across refreshes
 * - Add, toggle completion, edit and delete tasks
 * - Golden Space cinematic styling
 */

import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Check, Clock, Sparkles, AlertCircle, Edit3 } from 'lucide-react';
import { TaskItem } from '../types/index.ts';
import { soundFx } from '../utils/audioEffects.ts';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'ELEVATED' | 'STANDARD'>('STANDARD');
  const [newSector, setNewSector] = useState('Core Engine');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Load persistent tasks from backend
  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    soundFx.playClick();
    const nextCompleted = !currentCompleted;
    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch (err) {
      console.warn('Failed to update task:', err);
      loadTasks();
    }
  };

  const deleteTask = async (id: string) => {
    soundFx.playClick();
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete task:', err);
      loadTasks();
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFx.playClick();
    const payload = {
      title: newTitle.trim(),
      priority: newPriority,
      sector: newSector,
      dueTime: '18:00',
      completed: false,
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setNewTitle('');
      }
    } catch (err) {
      console.warn('Failed to create task:', err);
    }
  };

  const handleStartEdit = (task: TaskItem) => {
    soundFx.playClick();
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    soundFx.playClick();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t)));
    setEditingId(null);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
    } catch (err) {
      console.warn('Failed to save edited task:', err);
      loadTasks();
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-red-500/60 bg-red-950/60 text-red-300';
      case 'ELEVATED':
        return 'border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#FFD76A]';
      case 'STANDARD':
      default:
        return 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-slate-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] p-4 sm:p-6 overflow-y-auto custom-scrollbar font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#FFD76A] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8EAF0] tracking-wide flex items-center gap-2">
              <span>MISSION DIRECTIVES & TASKS</span>
              <span className="text-[10px] font-mono text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                SQLITE PERSISTENT
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous execution queue • Priority scheduling • Persistent storage
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FFD76A] rounded-full font-bold">
          {tasks.filter((t) => !t.completed).length} PENDING
        </span>
      </div>

      {/* Add Task Input Form */}
      <form
        onSubmit={addTask}
        className="my-4 p-3 rounded-2xl bg-[#030712]/80 backdrop-blur-md border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.05)] flex flex-col sm:flex-row gap-2.5"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new autonomous directive or sub-system task..."
          className="flex-1 bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#E8EAF0] placeholder:text-slate-500 focus:outline-none focus:border-[#FFD76A] transition-colors"
        />

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="CRITICAL">CRITICAL</option>
          <option value="ELEVATED">ELEVATED</option>
          <option value="STANDARD">STANDARD</option>
        </select>

        <select
          value={newSector}
          onChange={(e) => setNewSector(e.target.value)}
          className="bg-[#050B18] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="Core Engine">Core Engine</option>
          <option value="Voice Neural">Voice Neural</option>
          <option value="Avatar 3D">Avatar 3D</option>
          <option value="Security">Security</option>
          <option value="Research">Research</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD76A] text-[#030712] font-semibold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>SCHEDULE</span>
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2.5 pb-6">
        {isLoading && (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading persistent directives from assistant database...
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500">
            No active directives. Standing by for instructions.
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              task.completed
                ? 'bg-[#030712]/40 border-[#D4AF37]/10 opacity-60'
                : 'bg-[#030712]/80 backdrop-blur-md border-[#D4AF37]/25 hover:border-[#FFD76A]/50 shadow-[0_0_15px_rgba(212,175,55,0.03)]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleTask(task.id, task.completed)}
                title={task.completed ? 'Mark pending' : 'Mark completed'}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  task.completed
                    ? 'bg-[#D4AF37] border-[#FFD76A] text-[#030712] shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                    : 'border-[#D4AF37]/40 hover:border-[#FFD76A] bg-transparent'
                }`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="min-w-0 flex-1">
                {editingId === task.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(task.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-[#050B18] border border-[#FFD76A] rounded-lg px-2.5 py-1 text-xs text-[#E8EAF0] focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(task.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#D4AF37] text-[#030712] rounded-md cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p
                      className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-[#E8EAF0]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-[#D4AF37]">{task.sector}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit(task)}
                className="p-1.5 text-slate-500 hover:text-[#FFD76A] transition-colors cursor-pointer rounded-lg hover:bg-[#D4AF37]/10"
                title="Edit task directive"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-950/30"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
