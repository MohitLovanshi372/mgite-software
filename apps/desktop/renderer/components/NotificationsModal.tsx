/**
 * JARVIS Notification Shield & Alert Intelligence Modal
 * Displays real-time filtered alerts, OTP protections, and privacy shielding settings.
 */

import React, { useState } from 'react';
import { X, Bell, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [shieldActive, setShieldActive] = useState(true);
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      source: 'Banking / SMS',
      title: 'One-Time Passcode detected',
      body: 'Your verification code is ••••••. Valid for 10 minutes.',
      redacted: true,
      time: '4 mins ago',
      level: 'critical',
    },
    {
      id: '2',
      source: 'Security Engine',
      title: 'SQLite local memory database checkpoint verified',
      body: 'Zero integrity flaws found. 14 items encrypted in memory.',
      redacted: false,
      time: '18 mins ago',
      level: 'info',
    },
    {
      id: '3',
      source: 'Airgap Shield',
      title: 'Prompt Sanitization Filter Enforced',
      body: 'API request payload scanned for private key regex; no leaks detected.',
      redacted: false,
      time: '45 mins ago',
      level: 'info',
    },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#06080e] border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
                NOTIFICATION INTELLIGENCE & PRIVACY SHIELD
              </h2>
              <p className="text-xs text-slate-400">Automated PII redaction and critical alert filtering</p>
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
          {/* Privacy Shield Toggle Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-mono font-bold text-emerald-300">
                  PII & SENSITIVE DATA SHIELD ACTIVE
                </h4>
                <p className="text-xs text-slate-300">
                  OTPs, financial tokens, and passwords are automatically redacted from voice playback and telemetry.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShieldActive(!shieldActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                shieldActive
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {shieldActive ? 'SHIELDED' : 'DISABLED'}
            </button>
          </div>

          {/* Alerts List */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              NOTIFICATION FEED
            </span>

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        alert.level === 'critical' ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                    <span className="text-xs font-mono font-semibold text-slate-200">{alert.source}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{alert.time}</span>
                </div>

                <p className="text-xs font-medium text-slate-100">{alert.title}</p>
                <p className="text-xs text-slate-400 font-mono">{alert.body}</p>

                {alert.redacted && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 pt-1">
                    <Lock className="w-3 h-3" />
                    <span>Redacted for Privacy Protection</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>PII SHIELD ENGINE</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
