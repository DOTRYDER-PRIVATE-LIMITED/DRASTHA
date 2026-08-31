import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TelemetryData, AlertLogItem, ConnectionMode, SystemSeverity, DatabaseStatus } from './types/telemetry.js';
import { Header } from './components/Header.js';
import { MetricCards } from './components/MetricCards.js';
import { HistoricalCharts } from './components/HistoricalCharts.js';
import { SensorHistoryTable } from './components/SensorHistoryTable.js';
import { AlertsTerminal } from './components/AlertsTerminal.js';
import { SetupGuideModal } from './components/SetupGuideModal.js';
import { SimulatorControls, SimScenario } from './components/SimulatorControls.js';
import { 
  fetchLatestTelemetry, 
  fetchTelemetryHistory, 
  fetchDirectGateway, 
  fetchGatewayProxy, 
  fetchDatabaseStatus, 
  clearServerHistory, 
  postTelemetry 
} from './services/api.js';

export function App() {
  const [latestData, setLatestData] = useState<TelemetryData>({
    bpm: 0,
    spo2: 0,
    bodyTemp: 0,
    bp_sys: 0,
    bp_dia: 0,
    ambientTemp: 22.0,
    pressure: 1013.25,
    altitude: 0,
    distance: 0,
    ax: 0,
    ay: 0,
    az: 9.81,
    airQuality: 35,
    oxygen: 20.9,
    co: 0,
    strainLoad: 0,
    lat: 0,
    lng: 0,
    digital_sensor: 0,
    alerts: {
      highBpm: false,
      lowBpm: false,
      lowSpo2: false,
      highBodyTemp: false,
      toxicGas: false,
      lowOxygen: false,
      fall: false,
      obstacle: false,
      highCo: false,
    },
    timestamp: new Date().toISOString(),
  });

  const [historyList, setHistoryList] = useState<TelemetryData[]>([]);
  const historyRef = useRef<TelemetryData[]>([]);
  const [, setHistoryTrigger] = useState(0);

  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);
  const [alertPanelExpanded, setAlertPanelExpanded] = useState<boolean>(false);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [showSimControls, setShowSimControls] = useState<boolean>(false);

  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('auto');
  const [targetGatewayIp, setTargetGatewayIp] = useState<string>('192.168.4.1');
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(1000);

  const [activeScenario, setActiveScenario] = useState<SimScenario>('NORMAL');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [hardwareStatus, setHardwareStatus] = useState<{
    state: 'CONNECTED' | 'DISCONNECTED' | 'SEARCHING';
    method: 'DIRECT_AP' | 'SERVER_PROXY' | 'CLOUD_INGEST' | 'NONE';
    lastSeen: string | null;
  }>({
    state: 'SEARCHING',
    method: 'NONE',
    lastSeen: null,
  });

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Check Database status on mount and periodically
  useEffect(() => {
    const checkDb = async () => {
      const status = await fetchDatabaseStatus();
      setDbStatus(status);
    };
    checkDb();
    const dbInterval = setInterval(checkDb, 10000);
    return () => clearInterval(dbInterval);
  }, []);

  // Normalize incoming telemetry
  const normalizeIncomingRecord = (raw: any, prev: TelemetryData): TelemetryData => {
    const bpm = typeof raw.bpm === 'number' ? raw.bpm : (raw.bpm ? Number(raw.bpm) : prev.bpm);
    const spo2 = typeof raw.spo2 === 'number' ? raw.spo2 : (raw.spo2 ? Number(raw.spo2) : (raw.o2 ? Number(raw.o2) : prev.spo2));
    const bodyTemp = typeof raw.bodyTemp === 'number' ? raw.bodyTemp : (raw.bodyTemp ? Number(raw.bodyTemp) : (raw.body ? Number(raw.body) : prev.bodyTemp));
    const bp_sys = typeof raw.bp_sys === 'number' ? raw.bp_sys : (raw.bp_sys ? Number(raw.bp_sys) : prev.bp_sys);
    const bp_dia = typeof raw.bp_dia === 'number' ? raw.bp_dia : (raw.bp_dia ? Number(raw.bp_dia) : prev.bp_dia);
    const ambientTemp = typeof raw.ambientTemp === 'number' ? raw.ambientTemp : (raw.temp ? Number(raw.temp) : prev.ambientTemp);
    const pressure = typeof raw.pressure === 'number' ? raw.pressure : (raw.press ? Number(raw.press) : prev.pressure);
    const altitude = typeof raw.altitude === 'number' ? raw.altitude : (raw.alt ? Number(raw.alt) : prev.altitude);
    const distance = typeof raw.distance === 'number' ? raw.distance : (raw.dist ? Number(raw.dist) : prev.distance);
    const ax = typeof raw.ax === 'number' ? raw.ax : prev.ax;
    const ay = typeof raw.ay === 'number' ? raw.ay : prev.ay;
    const az = typeof raw.az === 'number' ? raw.az : prev.az;
    const airQuality = typeof raw.airQuality === 'number' ? raw.airQuality : (raw.gas ? Number(raw.gas) : prev.airQuality);
    const oxygen = typeof raw.oxygen === 'number' ? raw.oxygen : (raw.oxygen_env ? Number(raw.oxygen_env) : prev.oxygen);
    const co = typeof raw.co === 'number' ? raw.co : prev.co;
    const strainLoad = typeof raw.strainLoad === 'number' ? raw.strainLoad : (raw.weight ? Number(raw.weight) : prev.strainLoad);
    const lat = typeof raw.lat === 'number' ? raw.lat : prev.lat;
    const lng = typeof raw.lng === 'number' ? raw.lng : prev.lng;
    const digital_sensor = raw.digital_sensor ? 1 : 0;

    const gMag = Math.sqrt(ax * ax + ay * ay + az * az);
    const fall = (ax !== 0 || ay !== 0 || az !== 0) && (Math.abs(ax) > 15 || Math.abs(ay) > 15 || Math.abs(az) > 20 || gMag > 22);

    const alerts = {
      highBpm: bpm > 120,
      lowBpm: bpm > 0 && bpm < 45,
      lowSpo2: spo2 > 0 && spo2 < 90,
      highBodyTemp: bodyTemp > 38.5,
      toxicGas: airQuality > 0 && airQuality < 40,
      lowOxygen: oxygen > 0 && oxygen < 18,
      fall,
      obstacle: distance > 0 && distance < 80,
      highCo: co > 50,
    };

    return {
      bpm,
      spo2,
      bodyTemp,
      bp_sys,
      bp_dia,
      ambientTemp,
      pressure,
      altitude,
      distance,
      ax,
      ay,
      az,
      airQuality,
      oxygen,
      co,
      strainLoad,
      lat,
      lng,
      digital_sensor,
      alerts,
      timestamp: raw.timestamp || new Date().toISOString(),
    };
  };

  // Process and push record to state
  const handleRecordReceived = (
    record: TelemetryData,
    method: 'DIRECT_AP' | 'SERVER_PROXY' | 'CLOUD_INGEST',
    isLiveConnected: boolean = true
  ) => {
    setLatestData(record);
    if (isLiveConnected) {
      setHardwareStatus({
        state: 'CONNECTED',
        method,
        lastSeen: new Date().toLocaleTimeString(),
      });
    } else {
      setHardwareStatus({
        state: 'SEARCHING',
        method: 'NONE',
        lastSeen: null,
      });
    }

    // Update history cache
    historyRef.current.push(record);
    if (historyRef.current.length > 1000) {
      historyRef.current.shift();
    }
    setHistoryList([...historyRef.current]);

    // Check alerts and add to log if triggered
    const newLogs: AlertLogItem[] = [];
    const ts = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (record.alerts.fall) {
      newLogs.push({ id: `fall-${Date.now()}`, type: 'CRITICAL FALL / IMPACT DETECTED', value: `[${record.ax}, ${record.ay}, ${record.az}]`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.lowSpo2) {
      newLogs.push({ id: `spo2-${Date.now()}`, type: 'HYPOXIA WARNING (LOW SPO2)', value: `${record.spo2}%`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.highCo) {
      newLogs.push({ id: `co-${Date.now()}`, type: 'CARBON MONOXIDE HAZARD', value: `${record.co.toFixed(1)} ppm`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.lowOxygen) {
      newLogs.push({ id: `o2-${Date.now()}`, type: 'OXYGEN DEPLETION HAZARD', value: `${record.oxygen.toFixed(1)}%`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.highBpm) {
      newLogs.push({ id: `bpm_hi-${Date.now()}`, type: 'TACHYCARDIA (ELEVATED HEART RATE)', value: `${record.bpm} BPM`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.lowBpm) {
      newLogs.push({ id: `bpm_lo-${Date.now()}`, type: 'BRADYCARDIA (LOW HEART RATE)', value: `${record.bpm} BPM`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.highBodyTemp) {
      newLogs.push({ id: `btemp-${Date.now()}`, type: 'HEATSTROKE / HYPERTHERMIA', value: `${record.bodyTemp}°C`, severity: 'CRITICAL', timestamp: ts });
    }
    if (record.alerts.obstacle) {
      newLogs.push({ id: `obst-${Date.now()}`, type: 'PROXIMITY OBSTACLE HAZARD', value: `${record.distance} cm`, severity: 'WARNING', timestamp: ts });
    }
    if (record.alerts.toxicGas) {
      newLogs.push({ id: `gas-${Date.now()}`, type: 'TOXIC GAS CONCENTRATION', value: `${record.airQuality} AQI`, severity: 'WARNING', timestamp: ts });
    }

    if (newLogs.length > 0) {
      setAlertLogs(prev => [...newLogs, ...prev].slice(0, 100));
    }
  };

  // Main polling loop
  useEffect(() => {
    if (!isPollingActive) return;

    let isMounted = true;

    const poll = async () => {
      try {
        // Strategy 1: Direct fetch to ESP32 AP
        if (connectionMode === 'direct' || connectionMode === 'auto') {
          try {
            const raw = await fetchDirectGateway(targetGatewayIp);
            if (raw && isMounted) {
              const normalized = normalizeIncomingRecord(raw, latestData);
              handleRecordReceived(normalized, 'DIRECT_AP', true);
              return;
            }
          } catch {
            // Fallthrough to server proxy if direct fails in auto mode
          }
        }

        // Strategy 2: Server proxy
        if (connectionMode === 'proxy' || connectionMode === 'auto') {
          try {
            const data = await fetchGatewayProxy(targetGatewayIp);
            if (data && isMounted) {
              handleRecordReceived(data, 'SERVER_PROXY', true);
              return;
            }
          } catch {
            // Fallthrough to cloud telemetry
          }
        }

        // Strategy 3: Latest record from server/database
        const latest = await fetchLatestTelemetry();
        if (latest && isMounted) {
          const hw = (latest as any)?._hardwareStatus;
          if (hw?.isConnected) {
            handleRecordReceived(latest, 'CLOUD_INGEST', true);
          } else {
            // No active hardware packet stream detected right now -> stay in SEARCHING state
            setHardwareStatus({
              state: 'SEARCHING',
              method: 'NONE',
              lastSeen: hw?.lastSeen ? new Date(hw.lastSeen).toLocaleTimeString() : null,
            });
          }
        } else if (isMounted) {
          setHardwareStatus({
            state: 'SEARCHING',
            method: 'NONE',
            lastSeen: null,
          });
        }
      } catch {
        if (isMounted) {
          setHardwareStatus({
            state: 'SEARCHING',
            method: 'NONE',
            lastSeen: null,
          });
        }
      }
    };

    poll();
    const timer = setInterval(poll, pollIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isPollingActive, pollIntervalMs, connectionMode, targetGatewayIp]);

  // Simulation scenario generator
  const makeSimulatedRecord = (scenario: SimScenario): TelemetryData => {
    const base: TelemetryData = {
      bpm: 75 + (Math.random() * 6 - 3),
      spo2: 98.0,
      bodyTemp: 36.8 + (Math.random() * 0.2 - 0.1),
      bp_sys: 120,
      bp_dia: 80,
      ambientTemp: 24.5 + (Math.random() * 0.4 - 0.2),
      pressure: 1012.8,
      altitude: 12.4,
      distance: 145,
      ax: (Math.random() * 0.4 - 0.2),
      ay: (Math.random() * 0.4 - 0.2),
      az: 9.81 + (Math.random() * 0.2 - 0.1),
      airQuality: 78,
      oxygen: 20.9,
      co: 8.5,
      strainLoad: 2.3,
      lat: 22.5726,
      lng: 88.3639,
      digital_sensor: 0,
      alerts: {
        highBpm: false,
        lowBpm: false,
        lowSpo2: false,
        highBodyTemp: false,
        toxicGas: false,
        lowOxygen: false,
        fall: false,
        obstacle: false,
        highCo: false,
      },
      timestamp: new Date().toISOString(),
    };

    switch (scenario) {
      case 'FALL':
        base.ax = -18.4;
        base.ay = 14.2;
        base.az = 22.5;
        base.alerts.fall = true;
        break;
      case 'HYPOXIA':
        base.spo2 = 84.0;
        base.bpm = 115;
        base.alerts.lowSpo2 = true;
        break;
      case 'HEATSTROKE':
        base.bodyTemp = 40.2;
        base.bpm = 128;
        base.alerts.highBodyTemp = true;
        base.alerts.highBpm = true;
        break;
      case 'GAS_LEAK':
        base.co = 85.0;
        base.airQuality = 25;
        base.oxygen = 16.5;
        base.alerts.highCo = true;
        base.alerts.toxicGas = true;
        base.alerts.lowOxygen = true;
        break;
      case 'TACHYCARDIA':
        base.bpm = 142;
        base.alerts.highBpm = true;
        break;
      case 'OBSTACLE':
        base.distance = 24;
        base.alerts.obstacle = true;
        break;
      case 'DISCONNECTED':
        base.bpm = 0;
        base.spo2 = 0;
        base.bodyTemp = 0;
        break;
      default:
        break;
    }

    return base;
  };

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const simTimer = setInterval(() => {
      const rec = makeSimulatedRecord(activeScenario);
      postTelemetry(rec);
      handleRecordReceived(rec, 'CLOUD_INGEST');
    }, 1000);

    return () => clearInterval(simTimer);
  }, [isSimulating, activeScenario]);

  const dispatchImmediatePacket = (scenario: SimScenario) => {
    const rec = makeSimulatedRecord(scenario);
    postTelemetry(rec);
    handleRecordReceived(rec, 'CLOUD_INGEST');
  };

  // Sparkline data extractor
  const getSparklinePoints = (accessor: (r: TelemetryData) => number): number[] => {
    if (historyList.length === 0) {
      const val = accessor(latestData);
      return [val, val];
    }
    const recent = historyList.slice(-15);
    return recent.map(accessor);
  };

  // Historical Charts Data
  const trendsChartData = useMemo(() => {
    const source = historyList.length > 0 ? historyList.slice(-30) : [latestData];
    return source.map((r, i) => {
      const d = new Date(r.timestamp);
      const timeStr = isNaN(d.getTime()) ? `${i}s` : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        time: timeStr,
        "Ambient (°C)": Number(r.ambientTemp.toFixed(2)),
        "Body (°C)": r.bodyTemp === 0 ? null : Number(r.bodyTemp.toFixed(2)),
        "Heart Rate (BPM)": r.bpm === 0 ? null : Math.round(r.bpm),
        "SpO2 (%)": r.spo2 === 0 ? null : Math.round(r.spo2),
        "Air Quality": r.airQuality,
      };
    });
  }, [historyList, latestData]);

  // Overall system severity
  const isWristbandOff = latestData.bpm === 0 && latestData.spo2 === 0 && latestData.bodyTemp === 0;
  const systemSeverity: SystemSeverity = useMemo(() => {
    if (
      latestData.alerts.fall ||
      latestData.alerts.lowSpo2 ||
      latestData.alerts.highCo ||
      latestData.alerts.lowOxygen ||
      latestData.alerts.highBpm ||
      latestData.alerts.lowBpm ||
      latestData.alerts.highBodyTemp
    ) {
      return 'CRITICAL';
    }
    if (latestData.alerts.obstacle || latestData.alerts.toxicGas || isWristbandOff) {
      return 'WARNING';
    }
    return 'NORMAL';
  }, [latestData.alerts, isWristbandOff]);

  // CSV Export Handler
  const handleCSVDownload = () => {
    const list = historyList.length > 0 ? historyList : [latestData];
    const headers = "timestamp,bpm,spo2,bodyTemp,bp_sys,bp_dia,ambientTemp,pressure,altitude,distance,ax,ay,az,airQuality,oxygen,co,strainLoad,lat,lng\n";
    const rows = list.map(r => 
      `"${r.timestamp}",${r.bpm},${r.spo2},${r.bodyTemp},${r.bp_sys},${r.bp_dia},${r.ambientTemp},${r.pressure},${r.altitude},${r.distance},${r.ax},${r.ay},${r.az},${r.airQuality},${r.oxygen},${r.co},${r.strainLoad},${r.lat},${r.lng}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `drashta_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear History Logs
  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all telemetry records and logs? This will reset the active live session.")) {
      await clearServerHistory();
      setAlertLogs([]);
      historyRef.current = [];
      setHistoryList([]);
      setLatestData({
        bpm: 0,
        spo2: 0,
        bodyTemp: 0,
        bp_sys: 0,
        bp_dia: 0,
        ambientTemp: 22.0,
        pressure: 1013.25,
        altitude: 0,
        distance: 0,
        ax: 0,
        ay: 0,
        az: 9.81,
        airQuality: 35,
        oxygen: 20.9,
        co: 0,
        strainLoad: 0,
        lat: 0,
        lng: 0,
        digital_sensor: 0,
        alerts: {
          highBpm: false,
          lowBpm: false,
          lowSpo2: false,
          highBodyTemp: false,
          toxicGas: false,
          lowOxygen: false,
          fall: false,
          obstacle: false,
          highCo: false,
        },
        timestamp: new Date().toISOString()
      });
      setHistoryTrigger(Date.now());
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans selection:bg-[#38BDF8] selection:text-black">
      {/* HEADER BAR */}
      <Header
        isPollingActive={isPollingActive}
        setIsPollingActive={setIsPollingActive}
        pollIntervalMs={pollIntervalMs}
        setPollIntervalMs={setPollIntervalMs}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        hardwareStatus={hardwareStatus}
        wristbandConnected={!isWristbandOff}
        dbStatus={dbStatus}
        showSimControls={showSimControls}
        setShowSimControls={setShowSimControls}
        onOpenSetupGuide={() => setShowSetupGuide(true)}
        targetGatewayIp={targetGatewayIp}
        setTargetGatewayIp={setTargetGatewayIp}
      />

      {/* MAIN VIEW */}
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* SIMULATOR CONTROLS COLLAPSIBLE */}
        {showSimControls && (
          <SimulatorControls
            activeScenario={activeScenario}
            onSelectScenario={setActiveScenario}
            isSimulating={isSimulating}
            onToggleSimulating={() => setIsSimulating(prev => !prev)}
            onDispatchImmediate={dispatchImmediatePacket}
          />
        )}

        {/* 14 TELEMETRY METRIC TILES */}
        <MetricCards
          latestData={latestData}
          systemSeverity={systemSeverity}
          alertPanelExpanded={alertPanelExpanded}
          setAlertPanelExpanded={setAlertPanelExpanded}
          getSparklinePoints={getSparklinePoints}
        />

        {/* EMERGENCY ALERTS AUDIT LOG TERMINAL */}
        {alertPanelExpanded && (
          <AlertsTerminal
            alertLogs={alertLogs}
            onClearLogs={handleClearHistory}
          />
        )}

        {/* HISTORICAL RECHARTS LINE / AREA GRAPHS */}
        <HistoricalCharts data={trendsChartData} />

        {/* TIME-SERIES SENSOR HISTORY TABLE */}
        <SensorHistoryTable
          historyList={historyList}
          onExportCsv={handleCSVDownload}
        />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#131E33] bg-[#060D18] py-4 px-6 text-center text-xs font-mono text-slate-500">
        DRASHTA NTPC Industrial Worker Safety Monitoring System • PostgreSQL / Supabase Synced Architecture
      </footer>

      {/* SETUP GUIDE MODAL */}
      <SetupGuideModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
}

export default App;
