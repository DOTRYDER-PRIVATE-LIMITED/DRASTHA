import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { TelemetryData } from '../types/telemetry.js';
import { cn } from '../lib/utils.js';

interface SensorHistoryTableProps {
  historyList: TelemetryData[];
  onExportCsv: () => void;
}

export const SensorHistoryTable: React.FC<SensorHistoryTableProps> = ({ historyList, onExportCsv }) => {
  return (
    <div className="bg-[#080F1D] border border-[#17253D] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1A2E4C] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono text-sm tracking-widest font-black uppercase text-white">Sensor History (Time-Series Log)</h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Chronological buffer storing up to <strong className="text-slate-200">1,000 readings</strong> • PostgreSQL / Supabase Synced • 1s hardware rate
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Dataset (CSV)
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#15253C] max-h-96">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead className="bg-[#0A1426] text-slate-400 uppercase tracking-wider sticky top-0 bg-opacity-95 backdrop-blur-sm shadow z-25 border-b border-[#1A2E4C]">
            <tr>
              <th className="py-3 px-4 font-bold">Timestamp</th>
              <th className="py-3 px-3 font-bold text-center">Temp (°C)</th>
              <th className="py-3 px-3 font-bold text-center">Body Temp (°C)</th>
              <th className="py-3 px-3 font-bold text-center">Heart Rate (BPM)</th>
              <th className="py-3 px-3 font-bold text-center">SpO2 (%)</th>
              <th className="py-3 px-3 font-bold text-center">BP (mmHg)</th>
              <th className="py-3 px-3 font-bold text-center">CO (ppm)</th>
              <th className="py-3 px-3 font-bold text-center">AQI (MQ2)</th>
              <th className="py-3 px-3 font-bold text-center">Strain (kg)</th>
              <th className="py-3 px-3 font-bold text-center">Altitude (m)</th>
              <th className="py-3 px-4 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#121E32]">
            {historyList.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-slate-500">
                  Waiting for initial telemetry ingestion cycle...
                </td>
              </tr>
            ) : (
              [...historyList].reverse().map((row, idx) => {
                const rowOff = row.bpm === 0 && row.spo2 === 0 && row.bodyTemp === 0;

                let rowSev = 'NORMAL';
                if (
                  row.alerts?.fall ||
                  row.alerts?.lowSpo2 ||
                  row.alerts?.highCo ||
                  row.alerts?.lowOxygen ||
                  row.alerts?.highBpm ||
                  row.alerts?.lowBpm ||
                  row.alerts?.highBodyTemp
                ) {
                  rowSev = 'CRITICAL';
                } else if (row.alerts?.obstacle || row.alerts?.toxicGas || rowOff) {
                  rowSev = 'WARNING';
                }

                const backTime = row.timestamp ? new Date(row.timestamp) : new Date(Date.now() - idx * 1000);
                const stampStr = backTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <tr key={idx} className="hover:bg-[#111D33] transition-colors odd:bg-[#070D18]">
                    <td className="py-2.5 px-4 text-slate-400 font-medium">{stampStr}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.ambientTemp?.toFixed(2) ?? '0.00'}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.bodyTemp === 0 ? '--' : row.bodyTemp?.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.bpm === 0 ? '--' : row.bpm}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.spo2 === 0 ? '--' : row.spo2}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.bpm === 0 ? '--' : `${row.bp_sys}/${row.bp_dia}`}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.co?.toFixed(1) ?? '0.0'}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.airQuality ?? 0}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.strainLoad?.toFixed(2) ?? '0.00'}</td>
                    <td className="py-2.5 px-3 text-center text-white">{row.altitude?.toFixed(2) ?? '0.00'}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-black uppercase text-black',
                        rowSev === 'CRITICAL' ? 'bg-red-500' : rowSev === 'WARNING' ? 'bg-[#D97706]' : 'bg-emerald-400'
                      )}>
                        {rowSev}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
