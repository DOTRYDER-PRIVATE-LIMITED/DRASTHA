import React from 'react';
import { Play, Square, Flame, ShieldAlert, HeartCrack, Activity, Wind, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils.js';

export type SimScenario = 'NORMAL' | 'FALL' | 'HYPOXIA' | 'HEATSTROKE' | 'GAS_LEAK' | 'TACHYCARDIA' | 'OBSTACLE' | 'DISCONNECTED';

interface SimulatorControlsProps {
  activeScenario: SimScenario;
  onSelectScenario: (scenario: SimScenario) => void;
  isSimulating: boolean;
  onToggleSimulating: () => void;
  onDispatchImmediate: (scenario: SimScenario) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  activeScenario,
  onSelectScenario,
  isSimulating,
  onToggleSimulating,
  onDispatchImmediate,
}) => {
  const scenarios: { id: SimScenario; label: string; desc: string; icon: any; color: string }[] = [
    { id: 'NORMAL', label: 'Normal Safe Vitals', desc: 'HR: 75, SpO2: 98%, Temp: 36.8°C, AQI: 30', icon: Activity, color: 'text-emerald-400' },
    { id: 'FALL', label: 'Fall / High Impact', desc: 'ax: -18.5, ay: 14.2, az: 22.0 (Kinematic Fall)', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'HYPOXIA', label: 'Low SpO2 (Hypoxia)', desc: 'SpO2 drops to 84%, HR: 115 BPM', icon: Wind, color: 'text-red-400' },
    { id: 'HEATSTROKE', label: 'Hyperthermia / Fever', desc: 'Body Temp: 40.2°C, HR: 128 BPM', icon: Flame, color: 'text-red-400' },
    { id: 'GAS_LEAK', label: 'CO / Toxic Gas Leak', desc: 'CO: 85 ppm, AQI: 25, O2: 16.5%', icon: AlertCircle, color: 'text-amber-400' },
    { id: 'TACHYCARDIA', label: 'Tachycardia Alert', desc: 'Heart rate spikes to 142 BPM', icon: HeartCrack, color: 'text-red-400' },
    { id: 'OBSTACLE', label: 'Proximity Hazard', desc: 'Distance: 24 cm (< 80 cm threshold)', icon: AlertCircle, color: 'text-amber-400' },
    { id: 'DISCONNECTED', label: 'Wristband Sensor Off', desc: 'BPM: 0, SpO2: 0, BodyTemp: 0', icon: Activity, color: 'text-slate-400' },
  ];

  return (
    <div className="bg-[#091122] border-2 border-indigo-900/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-top duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-mono text-sm tracking-wider uppercase font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Hardware & Worker Safety Scenario Simulator
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Injects deterministic physical IoT packets directly into the pipeline to test alert rules and Supabase persistence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulating}
            className={cn(
              'px-3 py-1.5 rounded-xl font-mono font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow',
              isSimulating
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            )}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Stop Continuous Stream' : 'Start 1Hz Stream'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenario === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                onSelectScenario(sc.id);
                onDispatchImmediate(sc.id);
              }}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group',
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                  : 'bg-[#060C17] border-[#15233D] hover:border-slate-600 hover:bg-[#0B1526]'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-200">{sc.label}</span>
                  <Icon className={cn('w-4 h-4', sc.color)} />
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-tight">{sc.desc}</p>
              </div>
              <button
                type="button"
                className="mt-3 text-[9px] font-mono font-bold uppercase py-1 px-2 rounded bg-[#101C33] group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-all text-center"
              >
                Inject Packet
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
