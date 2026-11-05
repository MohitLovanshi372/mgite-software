/**
 * Telemetry Component
 * Real-time mechanical monitoring bars for CPU, RAM, GPU, Temperature, Network, and Uptime.
 */

import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Zap, Flame, Wifi, Clock, Activity } from 'lucide-react';
import { initialTelemetry } from '../../data/mockData.ts';

export const Telemetry: React.FC = () => {
  const [metrics, setMetrics] = useState(initialTelemetry);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpu: Math.min(95, Math.max(12, prev.cpu + Math.floor((Math.random() - 0.48) * 6))),
        ram: Math.min(92, Math.max(40, prev.ram + Math.floor((Math.random() - 0.49) * 3))),
        gpu: Math.min(90, Math.max(20, prev.gpu + Math.floor((Math.random() - 0.47) * 5))),
        temperature: Math.min(68, Math.max(38, prev.temperature + (Math.random() > 0.5 ? 1 : -1))),
        networkDown: Math.min(990, Math.max(450, prev.networkDown + Math.floor((Math.random() - 0.5) * 40))),
      }));
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      label: 'CPU',
      value: `${metrics.cpu}%`,
      pct: metrics.cpu,
      icon: Cpu,
      color: metrics.cpu > 75 ? 'bg-red-500' : 'bg-red-600',
    },
    {
      label: 'RAM',
      value: `${metrics.ram}%`,
      pct: metrics.ram,
      icon: HardDrive,
      color: 'bg-red-500',
    },
    {
      label: 'GPU',
      value: `${metrics.gpu}%`,
      pct: metrics.gpu,
      icon: Zap,
      color: 'bg-orange-500',
    },
    {
      label: 'TEMP',
      value: `${metrics.temperature}°C`,
      pct: (metrics.temperature / 80) * 100,
      icon: Flame,
      color: metrics.temperature > 55 ? 'bg-red-500' : 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-3 font-mono">
      {/* 4 Primary Metric Bars */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-2 bg-[#08090d] border border-zinc-800/80 rounded-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-300 flex items-center gap-1">
                  <Icon className="w-3 h-3 text-red-400" />
                  {item.label}
                </span>
                <span className="text-white font-bold">{item.value}</span>
              </div>

              {/* Segmented bar */}
              <div className="w-full h-1.5 bg-zinc-900 overflow-hidden rounded-xs border border-zinc-800">
                <div
                  className={`h-full ${item.color} transition-all duration-700 shadow-[0_0_6px_rgba(239,68,68,0.7)]`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Network & Uptime Row */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-300">
        <span className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-red-400" />
          NET: <strong className="text-zinc-200">{metrics.networkDown} MB/s</strong>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-400" />
          UPTIME: <strong className="text-zinc-200">148:12:09</strong>
        </span>
      </div>
    </div>
  );
};
