/**
 * Notifications Page
 * Security alert dispatch and autonomous notification center.
 */

import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCheck, Trash2, PlusCircle } from 'lucide-react';
import { initialNotifications } from '../data/mockData.ts';
import { NotificationItem } from '../types/index.ts';

interface NotificationsPageProps {
  notifications?: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onMarkAll?: () => void;
  onClearAll?: () => void;
  onDispatchTest?: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications: propsNotifs,
  onMarkAll,
  onClearAll,
  onDispatchTest,
}) => {
  const [localNotifs, setLocalNotifs] = useState<NotificationItem[]>(initialNotifications);

  const notifs = propsNotifs ?? localNotifs;

  const handleMarkAll = () => {
    if (onMarkAll) {
      onMarkAll();
    } else {
      setLocalNotifs(notifs.map((n) => ({ ...n, read: true })));
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      setLocalNotifs([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SECURITY DISPATCH & NOTIFICATIONS
            </h2>
            <p className="text-xs text-zinc-400">
              Airgap verification logs • Subsystem alerts • Sensitive token redaction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDispatchTest && (
            <button
              onClick={onDispatchTest}
              className="px-3 py-1.5 bg-red-950/40 border border-red-600/70 hover:bg-red-950/80 text-red-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_8px_rgba(220,38,38,0.2)]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-red-400" />
              <span>TEST DISPATCH</span>
            </button>
          )}
          <button
            onClick={handleMarkAll}
            className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-red-400" />
            <span>MARK READ</span>
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 bg-[#08090e] border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Notification Stream */}
      <div className="space-y-3 my-6">
        {notifs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800">
            ZERO DISPATCH NOTIFICATIONS. ALL BUFFERS NORMAL.
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 border rounded-xs flex items-start justify-between gap-3 transition-colors ${
                n.read
                  ? 'bg-[#06070a] border-zinc-900 opacity-60'
                  : 'bg-[#090b10] border-zinc-800 hover:border-red-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-red-950 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-red-400">{n.subsystem}</span>
                    <span className="text-[10px] text-zinc-500">• {n.time}</span>
                  </div>
                  <p className="text-xs text-zinc-200 font-sans leading-relaxed">{n.title}</p>
                </div>
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1 shadow-[0_0_6px_#ef4444]" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
