import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AlertLogItem } from '../types/telemetry.js';
import { cn } from '../lib/utils.js';

interface AlertsTerminalProps {
  alertLogs: AlertLogItem[];
  onClearLogs: () => void;
}

export const AlertsTerminal: React.FC<AlertsTerminalProps> = ({ alertLogs, onClearLogs }) => {
  return (
    <div className="bg-[#0D162B] border-2 border-red-900/60 p-5 rounded-2xl space-y-3 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="font-mono text-sm tracking-widest uppercase font-black text-white">
            EMERGENCY ALERTS AUDIT LOGS (POSTGRESQL / SUPABASE SYNCED)
          </h3>
        </div>
        <button
          onClick={onClearLogs}
          className="text-[10px] font-mono uppercase bg-red-950/80 text-red-400 hover:bg-red-900 px-2.5 py-1 rounded border border-red-800 transition-all cursor-pointer"
        >
          Clear History Logs
        </button>
      </div>

      {alertLogs.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 text-center py-6">
          No emergency alarms registered on session data yet.
        </p>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-xs pr-1 scrollbar-thin">
          {alertLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                'p-2.5 rounded-lg border flex justify-between items-center',
                log.severity === 'CRITICAL'
                  ? 'bg-red-950/20 border-red-900/50 text-red-300'
                  : 'bg-amber-955/20 border-amber-800/40 text-amber-200'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-normal">{log.timestamp}</span>
                <span className="font-extrabold text-white uppercase">{log.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] font-semibold">{log.value}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-black',
                    log.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                  )}
                >
                  {log.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
