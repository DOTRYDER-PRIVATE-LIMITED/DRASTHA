import React from 'react';
import { 
  Radio, 
  Activity, 
  Database, 
  HelpCircle, 
  RefreshCw, 
  Sliders, 
  Flame, 
  ShieldAlert,
  Server
} from 'lucide-react';
import { ConnectionMode, DatabaseStatus } from '../types/telemetry.js';
import { cn } from '../lib/utils.js';

interface HeaderProps {
  isPollingActive: boolean;
  setIsPollingActive: React.Dispatch<React.SetStateAction<boolean>>;
  pollIntervalMs: number;
  setPollIntervalMs: (val: number) => void;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => void;
  hardwareStatus: {
    state: 'CONNECTED' | 'DISCONNECTED' | 'SEARCHING';
    method: 'DIRECT_AP' | 'SERVER_PROXY' | 'CLOUD_INGEST' | 'NONE';
    lastSeen: string | null;
  };
  wristbandConnected: boolean;
  dbStatus: DatabaseStatus | null;
  showSimControls: boolean;
  setShowSimControls: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenSetupGuide: () => void;
  targetGatewayIp: string;
  setTargetGatewayIp: (ip: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPollingActive,
  setIsPollingActive,
  pollIntervalMs,
  setPollIntervalMs,
  connectionMode,
  setConnectionMode,
  hardwareStatus,
  wristbandConnected,
  dbStatus,
  showSimControls,
  setShowSimControls,
  onOpenSetupGuide,
  targetGatewayIp,
  setTargetGatewayIp,
}) => {
  return (
    <header className="border-b border-[#14233C] bg-[#070D18]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg border border-blue-400/30">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-sans">
                DRASHTA <span className="text-[#38BDF8] text-base font-medium lowercase">IoT Safety</span>
              </h1>
              {dbStatus?.connected ? (
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Database: Connected
                </span>
              ) : (
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Database: Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              NTPC Industrial Worker Health & Environmental Hazard Monitoring System
            </p>
          </div>
        </div>

        {/* Status Indicators & Control Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Worker Badge */}
          <div className="bg-[#0B1527] border border-[#192A4A] rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-[11px] font-mono">
              <span className="text-slate-400">Worker:</span>{' '}
              <strong className="text-slate-200">Worker 01</strong>
            </div>
          </div>

          {/* Safety Box Hardware Status */}
          <div
            className={cn(
              'border rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono font-semibold transition-all',
              hardwareStatus.state === 'CONNECTED'
                ? 'bg-emerald-950/50 border-emerald-700 text-emerald-400 shadow-sm'
                : 'bg-amber-950/40 border-amber-700/80 text-amber-300'
            )}
            title={
              hardwareStatus.state === 'CONNECTED'
                ? `Safety Box communicating via ${hardwareStatus.method} (Last: ${hardwareStatus.lastSeen || 'Now'})`
                : 'Continuously searching for Safety Box hardware connection...'
            }
          >
            <Server className={cn('w-3.5 h-3.5', hardwareStatus.state === 'SEARCHING' && 'animate-spin text-amber-400')} />
            <span>
              Safety Box: {hardwareStatus.state === 'CONNECTED' ? 'CONNECTED' : 'SEARCHING...'}
              {hardwareStatus.state === 'CONNECTED' && hardwareStatus.method !== 'NONE' ? ` (${hardwareStatus.method})` : ''}
            </span>
          </div>

          {/* Wristband Connection State */}
          <div
            className={cn(
              'border rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono font-semibold',
              wristbandConnected
                ? 'bg-emerald-950/50 border-emerald-700 text-emerald-400'
                : 'bg-slate-900/90 border-slate-700 text-slate-400'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Wristband: {wristbandConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Hardware Guide Button */}
          <button
            onClick={onOpenSetupGuide}
            className="bg-[#101C33] hover:bg-[#1A2E50] border border-[#223A63] text-sky-400 text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Setup Guide</span>
          </button>

          {/* Simulator Toggle Button */}
          <button
            onClick={() => setShowSimControls((prev) => !prev)}
            className={cn(
              'text-xs font-mono font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border',
              showSimControls
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-[#101C33] hover:bg-[#1A2E50] border-[#223A63] text-indigo-300'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimControls ? 'Hide Simulator' : 'Test Scenarios'}</span>
          </button>

          {/* Polling Switch & Rate Select */}
          <div className="bg-[#0B1527] border border-[#192A4A] rounded-xl px-2 py-1 flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setIsPollingActive((prev) => !prev)}
              className={cn(
                'px-2 py-0.5 rounded font-extrabold uppercase transition-all cursor-pointer text-[10px]',
                isPollingActive ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-300'
              )}
            >
              {isPollingActive ? 'Polling: ON' : 'Paused'}
            </button>
            <select
              value={pollIntervalMs}
              onChange={(e) => setPollIntervalMs(Number(e.target.value))}
              className="bg-[#060B14] border border-[#172744] text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none"
            >
              <option value={1000}>1.0s (Live)</option>
              <option value={2000}>2.0s</option>
              <option value={5000}>5.0s</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
