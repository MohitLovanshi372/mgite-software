/**
 * Structured Logs Viewer Component
 * Displays local structured events with severity filtering, search, and zero sensitive data leakage.
 */

import React, { useState, useEffect } from 'react';
import { X, Terminal, RefreshCw, Trash2, ShieldCheck, Filter } from 'lucide-react';
import { LogEntry, LogLevel } from '../types/index.ts';
import { apiService } from '../services/api.ts';

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLogs(levelFilter === 'ALL' ? undefined : levelFilter, 150);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen, levelFilter]);

  if (!isOpen) return null;

  const handleClear = async () => {
    try {
      await apiService.clearLogs();
      setLogs([]);
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      searchQuery === '' ||
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (lvl: LogLevel) => {
    switch (lvl) {
      case 'DEBUG':
        return 'text-slate-400 bg-slate-800/80 border-slate-700';
      case 'INFO':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
      case 'WARN':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'ERROR':
        return 'text-red-400 bg-red-950/80 border-red-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="logs-viewer-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">System Activity & Security Logs</h2>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero secrets logged: All API keys, passwords, and OTPs are redacted at the logging layer.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
              title="Clear all local logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
                  levelFilter === lvl
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Log Entries Viewport */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-1 bg-slate-950">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No log entries found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800/60"
              >
                <span className="text-slate-500 shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${getLevelColor(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>
                <span className="text-cyan-400 shrink-0 font-semibold text-[11px]">
                  [{log.module}]
                </span>
                <span className="text-slate-300 break-all leading-relaxed flex-1">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
