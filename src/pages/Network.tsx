/**
 * Network Page
 * Sovereign network topology, low-latency nodes, and cryptographic ciphers.
 */

import React, { useState } from 'react';
import { Wifi, ShieldCheck, RefreshCw, Lock, Radio } from 'lucide-react';
import { initialNetworkNodes } from '../data/mockData.ts';

export const NetworkPage: React.FC = () => {
  const [nodes, setNodes] = useState(initialNetworkNodes);
  const [isScanning, setIsScanning] = useState(false);

  const runPortScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SOVEREIGN NETWORK & NODE TOPOLOGY
            </h2>
            <p className="text-xs text-zinc-400">
              Internal mesh network • Zero unauthenticated packets • Kyber lattice encryption
            </p>
          </div>
        </div>

        <button
          onClick={runPortScan}
          disabled={isScanning}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'SCANNING MESH...' : 'SWEEP PORTS'}</span>
        </button>
      </div>

      {/* Nodes Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-4 bg-[#08090f] border border-zinc-800 hover:border-red-900/60 rounded-xs transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-100">{node.name}</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {node.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-[#050608] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">IP Address</span>
                <span className="text-zinc-200 font-bold">{node.ip}</span>
              </div>
              <div className="p-2 bg-[#050608] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Latency</span>
                <span className="text-red-400 font-bold">{node.latency} ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
              <span className="flex items-center gap-1 text-zinc-300">
                <Lock className="w-3 h-3 text-red-500" />
                CIPHER: {node.encryption}
              </span>
              <span className="text-emerald-400 font-bold">SOVEREIGN</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
