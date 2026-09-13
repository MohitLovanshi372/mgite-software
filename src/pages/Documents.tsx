/**
 * Documents Page
 * Schematic vault, binary inspection, and entropy calculation.
 */

import React, { useState } from 'react';
import { FileText, Upload, Download, Eye, FileCode, Lock, CheckCircle2 } from 'lucide-react';
import { initialDocuments } from '../data/mockData.ts';

export const DocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState(initialDocuments);
  const [selectedDoc, setSelectedDoc] = useState(initialDocuments[0]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#040508] bg-tech-grid p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-wider">
              SYSTEM SCHEMATICS & BINARY VAULT
            </h2>
            <p className="text-xs text-zinc-400">
              Entropy validation • Cryptographic verification • Zero unmonitored buffers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const newDoc = {
              id: `doc-${Date.now()}`,
              name: `KINEMATIC_ROBOTIC_ARM_SPEC_${Date.now().toString().slice(-4)}.bin`,
              size: '1.2 MB',
              entropy: '7.98',
              type: 'BINARY' as const,
              status: 'ANALYZED' as const,
            };
            setDocs([newDoc, ...docs]);
          }}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>INGEST ASSET</span>
        </button>
      </div>

      {/* Grid: Document List & Document Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Document List (2 cols) */}
        <div className="lg:col-span-2 space-y-2.5">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
            INDEXED ASSETS ({docs.length})
          </span>

          {docs.map((doc) => {
            const isSelected = selectedDoc.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3.5 border rounded-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e1017] border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : 'bg-[#08090f] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-400 shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-100 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>TYPE: {doc.type}</span>
                      <span>•</span>
                      <span>SIZE: {doc.size}</span>
                      <span>•</span>
                      <span>ENTROPY: {doc.entropy}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[9px] px-2 py-0.5 bg-red-950 border border-red-500/40 text-red-400 font-bold uppercase">
                  {doc.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Inspection Panel (1 col) */}
        <div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
            BINARY TELEMETRY INSPECTOR
          </span>

          <div className="p-4 bg-[#08090f] border border-zinc-800 rounded-xs space-y-3 text-xs">
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] text-red-400 font-bold uppercase block">ASSET ID</span>
              <p className="font-bold text-zinc-100 text-xs truncate">{selectedDoc.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Entropy Metric:</span>
                <span className="text-red-400 font-bold">{selectedDoc.entropy} / 8.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Security Ring:</span>
                <span className="text-emerald-400 font-bold">AIRGAP CERTIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Ingestion Hash:</span>
                <span className="text-zinc-300 font-bold">0x9F4C2A1E</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800">
              Binary structural integrity validated. No anomalous backdoors or telemetry beacons detected within byte payloads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
