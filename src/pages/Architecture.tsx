/**
 * Architecture Page
 * Interactive subsystem topology and component map of the autonomous robotic AI OS.
 */

import React from 'react';
import { Cpu, Layers, ShieldCheck, Database, Zap, Activity } from 'lucide-react';
import { HUDFrame } from '../components/HUD/HUDFrame.tsx';

export const ArchitecturePage: React.FC = () => {
  const subsystems = [
    {
      code: 'CORE_ORCHESTRATOR',
      title: 'Cognitive Orchestrator',
      status: 'SOVEREIGN',
      desc: 'Central executive state machine. Orchestrates perception, intention decomposition, safety boundary verification, and motor actuation.',
      badgeColor: 'red' as const,
    },
    {
      code: 'AIRGAP_SENTINEL',
      title: 'Airgap Hardware Sentinel',
      status: 'INVIOLABLE',
      desc: 'Hardware-level packet inspection. Drops all outbound unauthorized sockets. Zero cloud dependencies or external tracking telemetry.',
      badgeColor: 'emerald' as const,
    },
    {
      code: 'KINEMATIC_RIG',
      title: 'Robotic 3D Kinematics',
      status: '60 FPS',
      desc: 'Three.js / React Three Fiber humanoid core. Articulating jaw servos, glowing optical sensors, and rotating HUD energy rings.',
      badgeColor: 'red' as const,
    },
    {
      code: 'ACOUSTIC_SYNAPSE',
      title: 'Neural Speech Synapse',
      status: 'LOW LATENCY',
      desc: 'Deep robotic voice synthesis and ultra-low latency microphone waveform processing directly on local Web Audio buffers.',
      badgeColor: 'amber' as const,
    },
    {
      code: 'SQLITE_EMBEDDINGS',
      title: 'Local Vector Store',
      status: 'SYNCHRONIZED',
      desc: '384-dimensional cosine similarity indexing across operator directives, mission guidelines, and encrypted system logs.',
      badgeColor: 'red' as const,
    },
    {
      code: 'IPC_BRIDGE_LAYER',
      title: 'Sandboxed IPC Bridges',
      status: 'ISOLATED',
      desc: 'Strict isolation boundary for operating system desktop applications, process lifecycle management, and terminal bridges.',
      badgeColor: 'gray' as const,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SUBSYSTEM TOPOLOGY & ARCHITECTURE
            </h2>
            <p className="text-xs text-zinc-400">
              Modular hardware-software bridges • Sovereign separation of concerns
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
          SPECIFICATION: MARK-IX
        </span>
      </div>

      {/* Subsystems Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {subsystems.map((sub) => (
          <HUDFrame
            key={sub.code}
            title={sub.title}
            subTitle={sub.code}
            badge={sub.status}
            badgeColor={sub.badgeColor}
          >
            <p className="text-xs text-zinc-300 font-sans leading-relaxed my-2">
              {sub.desc}
            </p>
            <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
              <span>Security Invariant:</span>
              <span className="text-emerald-400 font-bold">ENFORCED</span>
            </div>
          </HUDFrame>
        ))}
      </div>
    </div>
  );
};
