import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Thermometer, Heart, Wind, Gauge } from 'lucide-react';

interface HistoricalChartsProps {
  data: Array<{
    time: string;
    "Ambient (°C)": number;
    "Body (°C)": number | null;
    "Heart Rate (BPM)": number | null;
    "SpO2 (%)": number | null;
    "Air Quality": number;
  }>;
}

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CHART 1: TEMPERATURE VS TIME */}
      <div className="bg-[#08101E]/90 border border-[#162541] rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#38BDF8]" /> TEMPERATURE VS TIME (°C)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAmbient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121D2F" />
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
              <YAxis stroke="#475569" fontSize={9} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#0B1526', borderColor: '#1E2E4A', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="Ambient (°C)" stroke="#38BDF8" strokeWidth={1.8} fillOpacity={1} fill="url(#colorAmbient)" />
              <Area type="monotone" dataKey="Body (°C)" stroke="#10B981" strokeWidth={1.8} fillOpacity={1} fill="url(#colorBody)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: HEART RATE VS TIME */}
      <div className="bg-[#08101E]/90 border border-[#162541] rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#EF4444]" /> HEART RATE VS TIME (BPM)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121D2F" />
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
              <YAxis stroke="#475569" fontSize={9} domain={[40, 150]} />
              <Tooltip contentStyle={{ backgroundColor: '#0B1526', borderColor: '#1E2E4A', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="Heart Rate (BPM)" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBpm)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 3: SPO2 VS TIME */}
      <div className="bg-[#08101E]/90 border border-[#162541] rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#38BDF8]" /> SPO2 VS TIME (%)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSpo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121D2F" />
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
              <YAxis stroke="#475569" fontSize={9} domain={[70, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0B1526', borderColor: '#1E2E4A', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="SpO2 (%)" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorSpo)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 4: AIR QUALITY VS TIME */}
      <div className="bg-[#08101E]/90 border border-[#162541] rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" /> AIR QUALITY OVER TIME (AQI)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121D2F" />
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
              <YAxis stroke="#475569" fontSize={9} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0B1526', borderColor: '#1E2E4A', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="Air Quality" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
