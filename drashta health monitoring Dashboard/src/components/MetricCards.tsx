import React from 'react';
import {
  Heart,
  Wind,
  Thermometer,
  Activity,
  Compass,
  Gauge,
  Volume2,
  AlertTriangle,
} from 'lucide-react';
import { TelemetryData, SystemSeverity } from '../types/telemetry.js';
import { Sparkline } from './Sparkline.js';
import { cn } from '../lib/utils.js';

interface MetricCardsProps {
  latestData: TelemetryData;
  systemSeverity: SystemSeverity;
  alertPanelExpanded: boolean;
  setAlertPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  getSparklinePoints: (accessor: (r: TelemetryData) => number) => number[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  latestData,
  systemSeverity,
  alertPanelExpanded,
  setAlertPanelExpanded,
  getSparklinePoints,
}) => {
  const isWristbandOff = latestData.bpm === 0 && latestData.spo2 === 0 && latestData.bodyTemp === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* TILE 1: HEART RATE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">HEART RATE</span>
          <Heart className={cn('w-5 h-5', latestData.alerts.highBpm || latestData.alerts.lowBpm ? 'text-red-500 animate-bounce' : 'text-[#EF4444]')} />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.highBpm || latestData.alerts.lowBpm ? 'text-[#EF4444]' : 'text-slate-100'
          )}>
            {latestData.bpm === 0 ? '--' : latestData.bpm.toFixed(1)} <span className="text-sm font-light">BPM</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: 50 - 110 BPM</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            isWristbandOff ? 'text-slate-500 bg-slate-900' :
            latestData.alerts.highBpm || latestData.alerts.lowBpm ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {isWristbandOff ? 'OFF' : latestData.alerts.highBpm ? 'HIGH' : latestData.alerts.lowBpm ? 'LOW' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.bpm)} color={latestData.alerts.highBpm || latestData.alerts.lowBpm ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.bpm)).toFixed(1)}</span>
            <span className="text-slate-300">{latestData.bpm.toFixed(1)} BPM</span>
            <span>{Math.max(...getSparklinePoints(r => r.bpm)).toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: {isWristbandOff ? 'No signal' : 'Active'}</span>
          </div>
        </div>
      </div>

      {/* TILE 2: BLOOD OXYGEN (SPO2) */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">BLOOD OXYGEN (SPO2)</span>
          <Wind className={cn('w-5 h-5', latestData.alerts.lowSpo2 ? 'text-red-400 animate-pulse' : 'text-[#38BDF8]')} />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.lowSpo2 ? 'text-[#EF4444]' : 'text-slate-100'
          )}>
            {latestData.spo2 === 0 ? '--' : latestData.spo2.toFixed(1)} <span className="text-sm font-light">%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &gt; 92 %</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            isWristbandOff ? 'text-slate-500 bg-slate-900' :
            latestData.alerts.lowSpo2 ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {isWristbandOff ? 'OFF' : latestData.alerts.lowSpo2 ? 'HYPOXIA ALERT' : 'OPTIMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.spo2)} color={latestData.alerts.lowSpo2 ? '#EF4444' : '#38BDF8'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.spo2)).toFixed(1)}%</span>
            <span className="text-slate-300">{latestData.spo2.toFixed(1)}%</span>
            <span>{Math.max(...getSparklinePoints(r => r.spo2)).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: {isWristbandOff ? 'No signal' : 'Optimal'}</span>
          </div>
        </div>
      </div>

      {/* TILE 3: BODY TEMPERATURE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">BODY TEMPERATURE</span>
          <Thermometer className={cn('w-5 h-5', latestData.alerts.highBodyTemp ? 'text-red-400 animate-pulse' : 'text-orange-400')} />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.highBodyTemp ? 'text-[#EF4444]' : 'text-slate-100'
          )}>
            {latestData.bodyTemp === 0 ? '--' : latestData.bodyTemp.toFixed(2)} <span className="text-sm font-light">°C</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: 35.5 - 37.8 °C</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            isWristbandOff ? 'text-slate-500 bg-slate-900' :
            latestData.alerts.highBodyTemp ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {isWristbandOff ? 'OFF' : latestData.alerts.highBodyTemp ? 'HYPERTHERMIA' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.bodyTemp)} color={latestData.alerts.highBodyTemp ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.bodyTemp)).toFixed(1)}°C</span>
            <span className="text-slate-300">{latestData.bodyTemp.toFixed(1)}°C</span>
            <span>{Math.max(...getSparklinePoints(r => r.bodyTemp)).toFixed(1)}°C</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: {isWristbandOff ? 'No sensor' : 'Normal'}</span>
          </div>
        </div>
      </div>

      {/* TILE 4: BLOOD PRESSURE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">BLOOD PRESSURE</span>
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="my-3">
          <div className="text-3xl font-black text-slate-100 leading-tight">
            {latestData.bpm === 0 ? '--' : `${latestData.bp_sys}/${latestData.bp_dia}`} <span className="text-xs font-light font-mono">mmHg</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: 90-130 / 60-85 mmHg</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            isWristbandOff ? 'text-slate-500 bg-slate-900' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {isWristbandOff ? 'OFF' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.bp_sys)} color="#10B981" />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.bp_sys))}</span>
            <span className="text-slate-300">{latestData.bp_sys}/{latestData.bp_dia}</span>
            <span>{Math.max(...getSparklinePoints(r => r.bp_sys))}</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: {isWristbandOff ? 'No sensor' : 'Normal'}</span>
          </div>
        </div>
      </div>

      {/* TILE 5: AMBIENT TEMP */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">AMBIENT TEMP</span>
          <Thermometer className="w-5 h-5 text-[#38BDF8]" />
        </div>
        <div className="my-3">
          <div className="text-3xl font-black text-[#10B981] leading-tight">
            {latestData.ambientTemp.toFixed(2)} <span className="text-sm font-light">°C</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: 10.0 - 45.0 °C</div>
          <div className="mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase text-emerald-400 bg-emerald-950/40">
            NORMAL
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.ambientTemp)} color="#38BDF8" />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.ambientTemp)).toFixed(1)}°C</span>
            <span className="text-slate-300">{latestData.ambientTemp.toFixed(1)}°C</span>
            <span>{Math.max(...getSparklinePoints(r => r.ambientTemp)).toFixed(1)}°C</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: Normal</span>
          </div>
        </div>
      </div>

      {/* TILE 6: MOTION & POSTURE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">MOTION & POSTURE</span>
          <Compass className={cn('w-5 h-5', latestData.alerts.fall ? 'text-red-500 animate-spin' : 'text-indigo-400')} />
        </div>
        <div className="my-2 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">AX:</span>
            <span className="text-white font-bold">{latestData.ax.toFixed(2)} m/s²</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">AY:</span>
            <span className="text-white font-bold">{latestData.ay.toFixed(2)} m/s²</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">AZ:</span>
            <span className="text-white font-bold">{latestData.az.toFixed(2)} m/s²</span>
          </div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.alerts.fall ? 'text-red-400 bg-red-950/40 border border-red-900/50 animate-pulse' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {latestData.alerts.fall ? 'CRITICAL: FALL DETECTED' : 'UPRIGHT / STABLE'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.az)} color={latestData.alerts.fall ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>MEMS VECTOR</span>
            <span>Status: {latestData.alerts.fall ? 'IMPACT' : 'Nominal'}</span>
          </div>
        </div>
      </div>

      {/* TILE 7: AIR QUALITY */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">AIR QUALITY (GAS INDEX)</span>
          <Gauge className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.toxicGas ? 'text-[#EF4444]' : 'text-[#10B981]'
          )}>
            {latestData.airQuality} <span className="text-sm font-light">AQI</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &gt; 40 AQI</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.alerts.toxicGas ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {latestData.alerts.toxicGas ? 'TOXIC GAS RISK' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.airQuality)} color={latestData.alerts.toxicGas ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.airQuality))} AQI</span>
            <span className="text-[#10B981]">{latestData.airQuality}</span>
            <span>{Math.max(...getSparklinePoints(r => r.airQuality))} AQI</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>Status: {latestData.airQuality < 40 ? 'Poor' : 'Good'}</span>
          </div>
        </div>
      </div>

      {/* TILE 8: CO LEVEL */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">CO LEVEL</span>
          <Volume2 className="w-5 h-5 text-amber-500" />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.highCo ? 'text-[#EF4444]' : 'text-[#10B981]'
          )}>
            {latestData.co.toFixed(1)} <span className="text-sm font-light">ppm</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &lt; 50 ppm</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.alerts.highCo ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {latestData.alerts.highCo ? 'HAZARD' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.co)} color={latestData.alerts.highCo ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.co)).toFixed(1)}</span>
            <span className="text-slate-300">{latestData.co.toFixed(1)} ppm</span>
            <span>{Math.max(...getSparklinePoints(r => r.co)).toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: Normal</span>
          </div>
        </div>
      </div>

      {/* TILE 9: ATMOS PRESSURE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">ATMOS PRESSURE</span>
          <Gauge className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="my-3">
          <div className="text-3xl font-black text-[#10B981] leading-tight">
            {latestData.pressure.toFixed(1)} <span className="text-xs font-light font-mono">hPa</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: 980 - 1050 hPa</div>
          <div className="mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase text-emerald-400 bg-[#10B981]/10">
            NORMAL
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.pressure)} color="#10B981" />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.pressure)).toFixed(1)} hPa</span>
            <span className="text-slate-300">{latestData.pressure.toFixed(1)}</span>
            <span>{Math.max(...getSparklinePoints(r => r.pressure)).toFixed(1)} hPa</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: Normal</span>
          </div>
        </div>
      </div>

      {/* TILE 10: ALTITUDE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">ALTITUDE</span>
          <Compass className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="my-3">
          <div className="text-3xl font-black text-[#10B981] leading-tight">
            {latestData.altitude.toFixed(1)} <span className="text-sm font-light">m</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &lt; 80 m</div>
          <div className="mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase text-emerald-400 bg-emerald-950/40">
            NORMAL
          </div>
        </div>
        {/* Sparkline & Values */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.altitude)} color="#10B981" />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.altitude)).toFixed(1)} m</span>
            <span className="text-slate-300">{latestData.altitude.toFixed(1)}</span>
            <span>{Math.max(...getSparklinePoints(r => r.altitude)).toFixed(1)} m</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-600">
            <span>10s AGO</span>
            <span>Status: Safe</span>
          </div>
        </div>
      </div>

      {/* TILE 11: SYSTEM STATUS */}
      <div className="bg-[#0F1426] border-2 border-[#243555] rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div>
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#7C8BA1] block mb-1">SYSTEM STATUS</span>

          {systemSeverity === 'CRITICAL' ? (
            <div className="space-y-1">
              <h2 className="text-2xl font-black font-mono text-red-500 uppercase tracking-tight animate-pulse">CRITICAL</h2>
              <p className="text-xs text-red-200">Multiple parameters in critical safety ranges!</p>
            </div>
          ) : systemSeverity === 'WARNING' ? (
            <div className="space-y-1">
              <h2 className="text-2xl font-black font-mono text-[#D97706] uppercase tracking-tight">WARNING</h2>
              <p className="text-xs text-amber-200">Minor hazards or sensors disconnected.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-2xl font-black font-mono text-emerald-400 uppercase tracking-tight">NORMAL</h2>
              <p className="text-xs text-emerald-100">All vitals and environments safe.</p>
            </div>
          )}
        </div>

        <div className="space-y-2.5 mt-4">
          <button
            onClick={() => setAlertPanelExpanded((prev) => !prev)}
            className="w-full py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 hover:text-red-200 font-extrabold text-xs uppercase rounded-xl transition-all font-mono"
          >
            {alertPanelExpanded ? 'Hide Logs Terminal' : 'VIEW ALERTS LOGS'}
          </button>
          <div className="text-[10px] font-mono text-slate-500 text-center leading-none">Immediate active telemetry</div>
        </div>
      </div>

      {/* TILE 12: LOAD / STRAIN */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">LOAD / STRAIN</span>
          <Gauge className="w-5 h-5 text-[#10B981]" />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.strainLoad > 20 ? 'text-red-400 animate-pulse' : 'text-[#10B981]'
          )}>
            {latestData.strainLoad.toFixed(2)} <span className="text-sm font-light">kg</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &lt; 20 kg</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.strainLoad > 20 ? 'text-red-400 bg-red-950/40' : 'text-emerald-400 bg-[#10B981]/10'
          )}>
            {latestData.strainLoad > 20 ? 'ALERT' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.strainLoad)} color={latestData.strainLoad > 20 ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.strainLoad)).toFixed(1)}</span>
            <span className="text-slate-300">{latestData.strainLoad.toFixed(1)} kg</span>
            <span>{Math.max(...getSparklinePoints(r => r.strainLoad)).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* TILE 13: OBSTACLE DISTANCE */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">OBSTACLE DISTANCE</span>
          <Compass className="w-5 h-5 text-amber-400" />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.obstacle ? 'text-[#EF4444] animate-pulse' : 'text-amber-400'
          )}>
            {latestData.distance} <span className="text-sm font-light">cm</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &lt; 80 cm</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.alerts.obstacle ? 'text-red-400 bg-red-950/40 border border-red-900/50' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {latestData.alerts.obstacle ? 'HAZARD' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.distance)} color={latestData.alerts.obstacle ? '#EF4444' : '#D97706'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.distance))}</span>
            <span className="text-amber-400">{latestData.distance} cm</span>
            <span>{Math.max(...getSparklinePoints(r => r.distance))}</span>
          </div>
        </div>
      </div>

      {/* TILE 14: ENVIRONMENT OXYGEN */}
      <div className="bg-[#0D1527]/94 border border-[#1F2E4D] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#7C8BA1]">ENVIRONMENT OXYGEN</span>
          <Wind className="w-5 h-5 text-[#10B981]" />
        </div>
        <div className="my-3">
          <div className={cn(
            'text-3xl font-black leading-tight',
            latestData.alerts.lowOxygen ? 'text-[#EF4444] animate-pulse' : 'text-[#10B981]'
          )}>
            {latestData.oxygen.toFixed(1)} <span className="text-sm font-light">%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Threshold: &gt; 18 %</div>
          <div className={cn(
            'mt-2 text-[10px] font-mono font-bold leading-none py-1 px-1.5 rounded w-fit uppercase',
            latestData.alerts.lowOxygen ? 'text-red-400 bg-red-950/40' : 'text-emerald-400 bg-emerald-950/40'
          )}>
            {latestData.alerts.lowOxygen ? 'ALERT' : 'NORMAL'}
          </div>
        </div>
        {/* Sparkline */}
        <div className="mt-4 pt-4 border-t border-[#131E33] space-y-2">
          <Sparkline points={getSparklinePoints(r => r.oxygen)} color={latestData.alerts.lowOxygen ? '#EF4444' : '#10B981'} />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.min(...getSparklinePoints(r => r.oxygen)).toFixed(1)}%</span>
            <span className="text-slate-300">{latestData.oxygen.toFixed(1)}%</span>
            <span>{Math.max(...getSparklinePoints(r => r.oxygen)).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
