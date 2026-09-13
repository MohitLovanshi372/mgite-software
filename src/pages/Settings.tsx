/**
 * Settings Page
 * System configuration, operator profile, optical lighting parameters, and storage retention.
 */

import React, { useState } from 'react';
import { Settings, User, Eye, Shield, Check, Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [operator, setOperator] = useState('Mohit Lovanshi');
  const [colorProfile, setColorProfile] = useState('CRIMSON_RED');
  const [rotationSpeed, setRotationSpeed] = useState('DYNAMIC');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SYSTEM SETTINGS & PARAMETERS
            </h2>
            <p className="text-xs text-zinc-400">
              Operator identity • Optical flare tuning • Storage retention policies
            </p>
          </div>
        </div>

        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>CONFIGURATION APPLIED</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 my-6 max-w-3xl">
        {/* Operator Profile */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4" />
            OPERATOR DESIGNATION
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">CALLSIGN / NAME</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-[#030406] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">SOVEREIGN CLEARANCE</label>
              <input
                type="text"
                disabled
                value="LEVEL 5 // INVIOLABLE"
                className="w-full bg-[#030406] border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Optical Glow Lighting */}
        <div className="p-4 bg-[#08090f] border border-zinc-800 space-y-3 rounded-xs">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <Eye className="w-4 h-4" />
            OPTICAL LASER & ENERGY PALETTE
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'CRIMSON_RED', name: 'Crimson Red', desc: 'Sovereign Ultron specification' },
              { id: 'EMBER_ORANGE', name: 'Ember Orange', desc: 'High-temperature thermal optic' },
              { id: 'ALARM_VERMILION', name: 'Alarm Vermilion', desc: 'Defensive red alert profile' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setColorProfile(p.id)}
                className={`p-3 border transition-all cursor-pointer rounded-xs ${
                  colorProfile === p.id
                    ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-[#050608] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <p className="text-xs font-bold text-zinc-100">{p.name}</p>
                <p className="text-[10px] text-zinc-400 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
        >
          SAVE CONFIGURATION
        </button>
      </form>
    </div>
  );
};
