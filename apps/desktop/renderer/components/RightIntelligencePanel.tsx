/**
 * JARVIS Right Intelligence Panel Component
 *
 * Implements the requested three compact sections:
 * 1. TODAY
 *    - Tasks (interactive checklist)
 *    - Reminders
 *    - Calendar (agenda)
 *    - Important notifications (privacy-shielded)
 *    - Quick Notes (scratchpad)
 * 2. SYSTEM STATUS
 *    - AI
 *    - Voice
 *    - Memory
 *    - Tools
 *    - Privacy
 * 3. RECENT ACTIVITY
 *    - Opened app
 *    - Research
 *    - Document summary
 *    - Reminder
 *    - System events
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  Activity,
  Cpu,
  Mic,
  Database,
  Wrench,
  Shield,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trash2,
  Sparkles,
  ExternalLink,
  FileText,
  Terminal,
} from 'lucide-react';
import { QuickNotesCard } from './QuickNotesCard.tsx';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'med' | 'low';
}

interface ReminderItem {
  id: string;
  time: string;
  title: string;
  category: string;
}

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  location?: string;
}

interface NotificationItem {
  id: string;
  app: string;
  title: string;
  time: string;
  isSensitive?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'opened_app' | 'research' | 'doc_summary' | 'reminder' | 'system_event';
  title: string;
  detail: string;
  time: string;
}

interface RightIntelligencePanelProps {
  isOnline: boolean;
  aiStatus?: string;
  voiceStatus?: string;
  memoryCount?: number;
  onOpenCalendar?: () => void;
  onOpenTasks?: () => void;
  onOpenNotifications?: () => void;
}

export const RightIntelligencePanel: React.FC<RightIntelligencePanelProps> = ({
  isOnline,
  aiStatus = 'Ready',
  voiceStatus = 'Active',
  memoryCount = 14,
  onOpenCalendar,
  onOpenTasks,
  onOpenNotifications,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [todaySubTab, setTodaySubTab] = useState<'tasks' | 'reminders' | 'calendar' | 'notifications' | 'notes'>('tasks');

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't-1',
      text: 'Verify SQLite airgap & privacy integrity',
      completed: true,
      priority: 'high',
    },
    {
      id: 't-2',
      text: 'Index research notes into long-term memory',
      completed: false,
      priority: 'high',
    },
    {
      id: 't-3',
      text: 'Sync voice synthesis cache for offline mode',
      completed: false,
      priority: 'med',
    },
    {
      id: 't-4',
      text: 'Review daily autonomous background tasks',
      completed: false,
      priority: 'low',
    },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  // Reminders
  const [reminders] = useState<ReminderItem[]>([
    {
      id: 'r-1',
      time: '14:00',
      title: 'Scheduled Memory Compaction',
      category: 'System',
    },
    {
      id: 'r-2',
      time: '18:30',
      title: 'Notification Quiet Hours Begin',
      category: 'Privacy',
    },
    {
      id: 'r-3',
      time: '21:00',
      title: 'Daily Reflection & Invariant Audit',
      category: 'Security',
    },
  ]);

  // Calendar agenda
  const [events] = useState<CalendarEvent[]>([
    {
      id: 'c-1',
      time: '10:00 - 11:00',
      title: 'Deep Work: Neural Architecture',
      location: 'Local Workspace',
    },
    {
      id: 'c-2',
      time: '15:30 - 16:15',
      title: 'AI Intelligence Sync & Audit',
      location: 'Lab Room 4',
    },
    {
      id: 'c-3',
      time: '17:00 - 17:30',
      title: 'Automated Diagnostic Review',
      location: 'JARVIS Core',
    },
  ]);

  // Important notifications
  const [notifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      app: 'Shield',
      title: 'OTP auto-redacted and shielded from speech',
      time: '5m ago',
      isSensitive: true,
    },
    {
      id: 'n-2',
      app: 'Security',
      title: 'Local memory database verified nominal',
      time: '22m ago',
    },
    {
      id: 'n-3',
      app: 'System',
      title: 'Airgap firewall policy active in Phase 1',
      time: '1h ago',
    },
  ]);

  // Five distinct Recent Activity categories strictly matching specification:
  // - opened app
  // - research
  // - document summary
  // - reminder
  // - system events
  const [activities] = useState<ActivityItem[]>([
    {
      id: 'act-1',
      type: 'opened_app',
      title: 'Opened App',
      detail: 'Terminal & VS Code Workspace launched',
      time: '3m ago',
    },
    {
      id: 'act-2',
      type: 'research',
      title: 'Research',
      detail: 'Deep Web synthesis: Neural Quantum Agents completed',
      time: '12m ago',
    },
    {
      id: 'act-3',
      type: 'doc_summary',
      title: 'Document Summary',
      detail: 'Architecture Spec v2.1 parsed & indexed to SQLite',
      time: '28m ago',
    },
    {
      id: 'act-4',
      type: 'reminder',
      title: 'Reminder',
      detail: 'Scheduled Memory Compaction flagged for 14:00',
      time: '45m ago',
    },
    {
      id: 'act-5',
      type: 'system_event',
      title: 'System Event',
      detail: 'SQLite Invariant Check: ALL TESTS PASSED',
      time: '1h ago',
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      text: newTaskInput.trim(),
      completed: false,
      priority: 'med',
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskInput('');
    setShowAddTask(false);
  };

  return (
    <aside
      id="jarvis-right-panel"
      className={`relative z-20 flex flex-col h-full bg-[#06080e]/95 backdrop-blur-xl border-l border-cyan-500/15 transition-all duration-300 select-none ${
        collapsed ? 'w-14' : 'w-80 sm:w-84 xl:w-88'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-cyan-500/15">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase">
              Intelligence Stream
            </h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
          title={collapsed ? 'Expand Intelligence Panel' : 'Collapse Panel'}
          aria-label="Toggle Right Panel"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {collapsed ? (
        /* Collapsed mini vertical rail */
        <div className="flex-1 py-4 flex flex-col items-center gap-6 text-slate-500 font-mono text-xs">
          <div className="flex flex-col items-center gap-1" title="Today's Items">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span className="text-[9px] text-slate-400">TODAY</span>
          </div>
          <div className="flex flex-col items-center gap-1" title="System Status">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span className="text-[9px] text-slate-400">SYS</span>
          </div>
          <div className="flex flex-col items-center gap-1" title="Recent Activity">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
            <span className="text-[9px] text-slate-400">ACT</span>
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            title="Open Quick Notes"
            aria-label="Expand Quick Notes"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
            <span className="text-[9px] text-slate-400">NOTE</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3.5">
          {/* ========================================================================= */}
          {/* SECTION 1: TODAY (Tasks, Reminders, Calendar, Important Notifications, Notes) */}
          {/* ========================================================================= */}
          <div
            id="panel-section-today"
            className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 shadow-sm hover:border-cyan-500/30 transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100 tracking-wide uppercase">
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>TODAY</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/20">
                {tasks.filter((t) => t.completed).length}/{tasks.length} Done
              </span>
            </div>

            {/* Subtabs for clean organization */}
            <div className="flex items-center gap-1 p-1 mb-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setTodaySubTab('tasks')}
                className={`flex-1 py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                  todaySubTab === 'tasks'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setTodaySubTab('reminders')}
                className={`flex-1 py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                  todaySubTab === 'reminders'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reminders
              </button>
              <button
                onClick={() => setTodaySubTab('calendar')}
                className={`flex-1 py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                  todaySubTab === 'calendar'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setTodaySubTab('notifications')}
                className={`flex-1 py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                  todaySubTab === 'notifications'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setTodaySubTab('notes')}
                className={`py-1 px-2 rounded text-center transition-all cursor-pointer ${
                  todaySubTab === 'notes'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Quick Notes"
              >
                Notes
              </button>
            </div>

            {/* Subtab 1: Tasks */}
            {todaySubTab === 'tasks' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400">PRIORITY TASKS</span>
                  <button
                    onClick={() => setShowAddTask(!showAddTask)}
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task</span>
                  </button>
                </div>

                {showAddTask && (
                  <form onSubmit={handleAddTask} className="mb-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Enter new task..."
                      autoFocus
                      className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-lg px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                )}

                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-start justify-between gap-1.5 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/80 transition-colors text-xs"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="flex items-start gap-2 text-left flex-1 cursor-pointer"
                      >
                        <span
                          className={`w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            task.completed
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                              : 'border-slate-600 hover:border-cyan-400'
                          }`}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-[11px] leading-snug line-clamp-2 ${
                            task.completed ? 'line-through text-slate-500' : 'text-slate-300'
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtab 2: Reminders */}
            {todaySubTab === 'reminders' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">UPCOMING TIMERS</span>
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                  >
                    <div className="truncate mr-2">
                      <p className="text-[11px] text-slate-200 truncate">{rem.title}</p>
                      <span className="text-[9px] text-slate-500">{rem.category}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold shrink-0 px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-500/20">
                      {rem.time}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Subtab 3: Calendar */}
            {todaySubTab === 'calendar' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400">TODAY'S SCHEDULE</span>
                  {onOpenCalendar && (
                    <button
                      onClick={onOpenCalendar}
                      className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      Open Calendar
                    </button>
                  )}
                </div>
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <p className="text-[11px] font-medium text-slate-200 truncate">{ev.title}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                      <span className="text-cyan-400">{ev.time}</span>
                      <span className="text-slate-400 truncate">{ev.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtab 4: Important Notifications */}
            {todaySubTab === 'notifications' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400">SHIELDED ALERTS</span>
                  {onOpenNotifications && (
                    <button
                      onClick={onOpenNotifications}
                      className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                    >
                      All Alerts
                    </button>
                  )}
                </div>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2 rounded-lg border text-xs ${
                      notif.isSensitive
                        ? 'bg-emerald-950/30 border-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                      <span
                        className={`font-semibold uppercase ${
                          notif.isSensitive ? 'text-emerald-400' : 'text-cyan-400'
                        }`}
                      >
                        {notif.app}
                      </span>
                      <span className="text-slate-500">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{notif.title}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Subtab 5: Quick Notes */}
            {todaySubTab === 'notes' && <QuickNotesCard />}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: SYSTEM STATUS (AI, Voice, Memory, Tools, Privacy)               */}
          {/* ========================================================================= */}
          <div
            id="panel-section-system-status"
            className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 shadow-sm hover:border-cyan-500/30 transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100 tracking-wide uppercase">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>SYSTEM STATUS</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                NOMINAL
              </span>
            </div>

            {/* 5 Core Status Meters: AI, Voice, Memory, Tools, Privacy */}
            <div className="space-y-2 text-xs font-mono">
              {/* 1. AI */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">AI Core</span>
                    <span className="text-[9px] text-slate-500">
                      {isOnline ? 'Cloud Gemini 2.5 Active' : 'Offline Airgap Ready'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                  {isOnline ? 'ONLINE' : 'LOCAL'}
                </span>
              </div>

              {/* 2. Voice */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-950/50 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Mic className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">Voice Engine</span>
                    <span className="text-[9px] text-slate-500">Web Audio & TTS Engine</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-300 px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-500/20">
                  {voiceStatus || 'ACTIVE'}
                </span>
              </div>

              {/* 3. Memory */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Database className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">Memory DB</span>
                    <span className="text-[9px] text-slate-500">SQLite Vector Indexes</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-500/20">
                  {memoryCount} Items
                </span>
              </div>

              {/* 4. Tools */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Wrench className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">Tools Engine</span>
                    <span className="text-[9px] text-slate-500">8 Computer Control Tools</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                  READY
                </span>
              </div>

              {/* 5. Privacy */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Shield className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">Privacy Shield</span>
                    <span className="text-[9px] text-slate-500">Zero Unencrypted Telemetry</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                  SHIELDED
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: RECENT ACTIVITY                                                */}
          {/* (opened app, research, document summary, reminder, system events)          */}
          {/* ========================================================================= */}
          <div
            id="panel-section-recent-activity"
            className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 shadow-sm hover:border-cyan-500/30 transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100 tracking-wide uppercase">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>RECENT ACTIVITY</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Stream</span>
            </div>

            {/* 5 Distinct Activity Feed Items */}
            <div className="space-y-2">
              {activities.map((act) => {
                // Determine icon & theme per activity category
                let badgeColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
                if (act.type === 'opened_app') {
                  badgeColor = 'text-sky-400 bg-sky-950/40 border-sky-500/30';
                } else if (act.type === 'research') {
                  badgeColor = 'text-purple-400 bg-purple-950/40 border-purple-500/30';
                } else if (act.type === 'doc_summary') {
                  badgeColor = 'text-teal-400 bg-teal-950/40 border-teal-500/30';
                } else if (act.type === 'reminder') {
                  badgeColor = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
                } else if (act.type === 'system_event') {
                  badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
                }

                return (
                  <div
                    key={act.id}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${badgeColor}`}
                      >
                        {act.title}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight font-sans mt-1">
                      {act.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
