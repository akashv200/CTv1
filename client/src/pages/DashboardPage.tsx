import AppShell from "../components/dashboard/AppShell";
import StatsGrid from "../components/dashboard/StatsGrid";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import { useChainTraceStore } from "../store/useChainTraceStore";
import { domainHighlights } from "../data/domainConfig";
import { useRealtimeFeed } from "../hooks/useRealtimeFeed";

export default function DashboardPage() {
  useRealtimeFeed();
  const activeDomain = "agriculture";
  const iotDevices = useChainTraceStore((state) => state.iotDevices);
  const highlights = domainHighlights[activeDomain] || ["Harvest tracking", "Certification verified", "Location history"];

  return (
    <AppShell>
      <section id="overview-section" className="scroll-mt-24">
        <StatsGrid />
      </section>

      <section id="iot-status-section" className="scroll-mt-24">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Live IoT Nodes</h2>
            <div className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                const isColdChain = Math.random() > 0.5;
                const temp = isColdChain ? -5 + (Math.random() * 5) : 22 + (Math.random() * 25);
                const payload = {
                  productId: "CT-FO-789012",
                  companyId: "seed-company-futurefresh",
                  deviceId: "WOKWI-WH-01",
                  sensorType: "temperature",
                  value: temp,
                  temperature: temp,
                  unit: "°C",
                  latitude: 9.94,
                  longitude: 76.26,
                  domain: "logistics"
                };
                try {
                  await fetch("/api/iot/reading", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                  });
                  alert(`Simulation: Data packet (${temp.toFixed(1)}°C) sent. AI will analyze if suspicious.`);
                } catch (e) {
                  console.error("Simulation failed", e);
                }
              }}
              className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              Simulate WH-01 Pulse
            </button>
            <Badge variant="info">{iotDevices.length} Online</Badge>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {iotDevices.length > 0 ? iotDevices.map((device) => (
            <Card key={device.id} className="p-4 border-l-4 border-l-emerald-500 transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">{device.deviceType}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{device.externalId}</h4>
              <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{device.metadata?.location || 'Warehouse Zone A'}</p>
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 leading-none">Status</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 leading-none capitalize">{device.metadata?.sensorType || 'Reading'}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{device.lastReading?.value?.toFixed(1) || '--'} {device.lastReading?.unit || '°C'}</span>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="col-span-full py-8 text-center bg-slate-50 border-dashed dark:bg-slate-900/50">
              <p className="text-sm text-slate-500">No active hardware pulse detected. <br/> <span className="text-xs text-brand-blue font-medium">Please start Wokwi or use the Simulator button above.</span></p>
            </Card>
          )}
        </div>
      </section>

      <section id="checkpoints-section" className="scroll-mt-24">
        <ActivityTimeline />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div id="products-section" className="scroll-mt-24">
          <Card className="min-h-[360px]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Agriculture Features</h3>
              <Badge variant="success">{activeDomain}</Badge>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {highlights.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
