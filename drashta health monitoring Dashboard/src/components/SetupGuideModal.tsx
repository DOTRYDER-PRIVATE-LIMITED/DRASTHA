import React from 'react';
import { Cpu, AlertCircle, Wifi, Server, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const localHostUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/telemetry` : 'http://localhost:3000/api/telemetry';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0A111F] border-2 border-[#1E2E4A] max-w-2xl w-full rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto font-sans relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-[#14233C] hover:bg-[#1C2F4E] p-2 rounded-xl transition-all cursor-pointer font-extrabold text-sm font-sans"
          title="Close modal"
        >
          ✕
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-[#14233C]">
          <Cpu className="w-6 h-6 text-[#38BDF8] animate-pulse" />
          <h2 className="text-lg md:text-xl font-black text-white tracking-wider uppercase font-sans">
            Safety Box & Hardware Connection Guide
          </h2>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
          {/* Information Card */}
          <div className="p-4 bg-slate-900/80 border border-[#1C2F4E] rounded-xl space-y-2">
            <h4 className="font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wide text-xs font-mono">
              <Wifi className="w-4 h-4" /> Hardware Connectivity Modes
            </h4>
            <p className="text-xs text-slate-300">
              The Safety Box connects either via your local network (Wi-Fi) to stream sensor packets into the local server, or via direct private Access Point mode (192.168.4.1).
            </p>
          </div>

          {/* Local Endpoints */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" /> Local Server Ingestion Endpoints
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#070D18] border border-[#14233C] rounded-xl space-y-1.5 font-sans">
                <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">
                  1. LOCAL SERVER ENDPOINT
                </span>
                <code className="text-[#38BDF8] break-all select-all block font-mono text-xs bg-[#0B1527] p-2 rounded border border-[#192A4A]">
                  http://localhost:3000/api/telemetry
                </code>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Method: <strong className="text-slate-200">POST (JSON) or GET (Query)</strong>
                </span>
              </div>

              <div className="p-3.5 bg-[#070D18] border border-[#14233C] rounded-xl space-y-1.5 font-sans">
                <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">
                  2. DIRECT AP GATEWAY IP
                </span>
                <code className="text-emerald-400 break-all select-all block font-mono text-xs bg-[#0B1527] p-2 rounded border border-[#192A4A]">
                  http://192.168.4.1/data
                </code>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Network: <strong className="text-slate-200">ESP32 Private Wi-Fi AP</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Environment & Credentials Note */}
          <div className="p-4 bg-[#070D18] border border-[#192A4A] rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <ShieldCheck className="w-4 h-4" /> Environment & Authentication
            </h4>
            <p className="text-slate-300">
              All database and server configurations are loaded automatically from the <code className="text-amber-300 font-mono bg-amber-950/40 px-1 py-0.5 rounded">.env</code> file. When the physical Safety Box is powered on, the dashboard automatically detects the live telemetry stream and switches status from <strong>SEARCHING</strong> to <strong>CONNECTED</strong>.
            </p>
          </div>

          {/* Verification checklist */}
          <div className="space-y-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Safety Box listens on port 3000 for local telemetry streaming</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Time-series data is recorded and safety alert thresholds evaluated in real time</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#14233C] font-sans">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer font-sans"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
