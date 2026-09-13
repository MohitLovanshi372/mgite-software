/**
 * Tasks Page
 * Autonomous directives, priority tasks, and mechanical progress checklist.
 */

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { initialTasks } from '../data/mockData.ts';
import { TaskItem } from '../types/index.ts';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'ELEVATED' | 'STANDARD'>('CRITICAL');

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,
      sector: 'Core Engine',
      dueTime: '18:00',
    };
    setTasks([newTask, ...tasks]);
    setNewTitle('');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-red-600 bg-red-950/70 text-red-400';
      case 'ELEVATED':
        return 'border-orange-600 bg-orange-950/60 text-orange-400';
      case 'STANDARD':
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              MISSION DIRECTIVES & TASKS
            </h2>
            <p className="text-xs text-zinc-400">
              Autonomous execution queue • Priority scheduling • Invariant enforcement
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          {tasks.filter((t) => !t.completed).length} PENDING
        </span>
      </div>

      {/* Add Task Input */}
      <form onSubmit={addTask} className="my-4 p-3 bg-[#08090e] border border-zinc-800 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new autonomous directive or sub-system task..."
          className="flex-1 bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
        />

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="bg-[#030406] border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 focus:outline-hidden"
        >
          <option value="CRITICAL">CRITICAL</option>
          <option value="ELEVATED">ELEVATED</option>
          <option value="STANDARD">STANDARD</option>
        </select>

        <button
          type="submit"
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>SCHEDULE</span>
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2.5 pb-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 border rounded-xs flex items-center justify-between gap-3 transition-colors ${
              task.completed
                ? 'bg-[#06070a] border-zinc-900 opacity-50'
                : 'bg-[#08090f] border-zinc-800 hover:border-red-900/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 border rounded-xs flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  task.completed
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_6px_#ef4444]'
                    : 'border-zinc-700 hover:border-red-500'
                }`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="truncate">
                <p
                  className={`text-xs font-bold truncate ${
                    task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                  <span className="text-red-400">{task.sector}</span>
                  <span>•</span>
                  <span>Due: {task.dueTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
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
