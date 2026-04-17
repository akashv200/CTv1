import { useMemo, useState } from "react";
import { Bell, Brain, Database, Moon, ShieldCheck, Sun, Wallet, Wrench } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { useThemeStore } from "../store/useThemeStore";
import { useChainTraceStore } from "../store/useChainTraceStore";
import { defaultPlatformSettings, type PlatformSettings, usePlatformSettingsStore } from "../store/usePlatformSettingsStore";
import { useWalletStore } from "../store/useWalletStore";
import { api } from "../services/api";
import ProfileCard from "../components/profile/ProfileCard";

const inputClassName =
  "mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function cloneDefaults(): PlatformSettings {
  return JSON.parse(JSON.stringify(defaultPlatformSettings)) as PlatformSettings;
}

function ToggleField({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <span>
        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{description}</span>
      </span>
      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-blue" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function SettingsPage() {
  const persistedSettings = usePlatformSettingsStore((state) => state.settings);
  const setPersistedSettings = usePlatformSettingsStore((state) => state.setSettings);
  const resetPersistedSettings = usePlatformSettingsStore((state) => state.resetSettings);
  const organization = useChainTraceStore((state) => state.organization);
  const initializeStore = useChainTraceStore((state) => state.initialize);
  const setDomain = useChainTraceStore((state) => state.setDomain);

  const [draft, setDraft] = useState<PlatformSettings>(persistedSettings);
  const [orgDraft, setOrgDraft] = useState(organization || {
    companyName: persistedSettings.profile.organization,
    companyCode: 'ORG-' + Math.floor(Math.random() * 1000),
    domain: 'agriculture',
    contactEmail: persistedSettings.profile.email
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const theme = draft.appearance.theme;
  const setTheme = useThemeStore((state) => state.setTheme);
  const isMetaMaskInstalled = useWalletStore((state) => state.isMetaMaskInstalled);
  const walletAddress = useWalletStore((state) => state.address);
  const walletChainId = useWalletStore((state) => state.chainId);
  const walletError = useWalletStore((state) => state.error);
  const isWalletConnecting = useWalletStore((state) => state.isConnecting);
  const connectWallet = useWalletStore((state) => state.connect);

  const timezoneOptions = useMemo(() => ["Asia/Kolkata", "UTC", "America/New_York", "Europe/London"], []);
  const walletChainLabel = useMemo(() => {
    if (!walletChainId) return "Unknown chain";
    const parsed = Number.parseInt(walletChainId, 16);
    if (Number.isNaN(parsed)) return walletChainId;
    return `Chain ${parsed}`;
  }, [walletChainId]);

  function patch<K extends keyof PlatformSettings>(section: K, value: Partial<PlatformSettings[K]>) {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...value
      }
    }));
  }

  function patchAlertType<K extends keyof PlatformSettings["notifications"]["alertTypes"]>(key: K, value: boolean) {
    setDraft((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        alertTypes: {
          ...prev.notifications.alertTypes,
          [key]: value
        }
      }
    }));
  }

  function chooseTheme(nextTheme: "light" | "dark") {
    patch("appearance", { theme: nextTheme });
    setTheme(nextTheme);
  }

  function resetAll() {
    const defaults = cloneDefaults();
    resetPersistedSettings();
    setDraft(defaults);
    setTheme("light");
    setSavedAt(null);
  }

  async function saveSettings() {
    setPersistedSettings(draft);
    setTheme(draft.appearance.theme);
    
    try {
      await api.updateOrganization({
        companyName: orgDraft.companyName,
        companyCode: orgDraft.companyCode || 'ORG-AUTO',
        domain: draft.dashboard.defaultDomain === 'all' ? 'agriculture' : draft.dashboard.defaultDomain,
        contactEmail: draft.profile.email,
        legalName: orgDraft.legalName,
        registrationNumber: orgDraft.registrationNumber,
        taxId: orgDraft.taxId
      });
      await api.toggleSimulationMode(draft.iot.simulationMode);
      await initializeStore();
    } catch (e) {
      console.error("Failed to sync org to DB", e);
    }

    if (draft.dashboard.defaultDomain !== "all") {
      setDomain(draft.dashboard.defaultDomain);
    }
    setSavedAt(new Date().toLocaleTimeString());
  }

  // ... rest of the component ...

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Platform Settings</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Settings Center</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Manage appearance, notifications, security, integrations, and data behavior.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={resetAll}>
            Reset Defaults
          </Button>
          <Button type="button" onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </div>

      {savedAt ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          Settings saved at {savedAt}
        </div>
      ) : null}
      
      <div className="mb-10">
        <ProfileCard />
      </div>
      
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance & Accessibility</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => chooseTheme("light")} variant={theme === "light" ? "primary" : "secondary"}>
              <Sun className="mr-2 h-4 w-4" />
              Light Theme
            </Button>
            <Button type="button" onClick={() => chooseTheme("dark")} variant={theme === "dark" ? "primary" : "secondary"}>
              <Moon className="mr-2 h-4 w-4" />
              Dark Theme
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Density</span>
              <select
                className={inputClassName}
                value={draft.appearance.density}
                onChange={(e) => patch("appearance", { density: e.target.value as PlatformSettings["appearance"]["density"] })}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <ToggleField
              label="Reduced Motion"
              description="Minimize motion-heavy animations."
              checked={draft.appearance.reducedMotion}
              onChange={(checked) => patch("appearance", { reducedMotion: checked })}
            />
          </div>
        </Card>

        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-blue" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
          </div>
          <div className="grid gap-3">
            <ToggleField label="In-App Alerts" description="Show live alerts inside dashboard." checked={draft.notifications.inApp} onChange={(checked) => patch("notifications", { inApp: checked })} />
            <ToggleField label="Email Alerts" description="Receive reports and anomaly emails." checked={draft.notifications.email} onChange={(checked) => patch("notifications", { email: checked })} />
            <ToggleField label="Push Notifications" description="Enable browser/app push notifications." checked={draft.notifications.push} onChange={(checked) => patch("notifications", { push: checked })} />
            <ToggleField label="Critical SMS Alerts" description="Send SMS only for critical incidents." checked={draft.notifications.smsCritical} onChange={(checked) => patch("notifications", { smsCritical: checked })} />
            <ToggleField
              label="Quiet Hours"
              description="Mute non-critical notifications during selected hours."
              checked={draft.notifications.quietHoursEnabled}
              onChange={(checked) => patch("notifications", { quietHoursEnabled: checked })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Quiet Start</span>
              <input type="time" className={inputClassName} value={draft.notifications.quietStart} onChange={(e) => patch("notifications", { quietStart: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Quiet End</span>
              <input type="time" className={inputClassName} value={draft.notifications.quietEnd} onChange={(e) => patch("notifications", { quietEnd: e.target.value })} />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleField label="Recall Alerts" description="Notify on product recalls." checked={draft.notifications.alertTypes.recalls} onChange={(checked) => patchAlertType("recalls", checked)} />
            <ToggleField
              label="Temperature Violations"
              description="Notify on cold/heat chain breaches."
              checked={draft.notifications.alertTypes.temperatureViolations}
              onChange={(checked) => patchAlertType("temperatureViolations", checked)}
            />
            <ToggleField label="Expiry Warnings" description="Notify before expiry window." checked={draft.notifications.alertTypes.expiryWarnings} onChange={(checked) => patchAlertType("expiryWarnings", checked)} />
            <ToggleField label="Anomalies" description="Notify on AI anomaly findings." checked={draft.notifications.alertTypes.anomalies} onChange={(checked) => patchAlertType("anomalies", checked)} />
            <ToggleField label="Checkpoint Delays" description="Notify delayed journey milestones." checked={draft.notifications.alertTypes.checkpointDelays} onChange={(checked) => patchAlertType("checkpointDelays", checked)} />
            <ToggleField
              label="Certificate Renewals"
              description="Notify expiring certificates."
              checked={draft.notifications.alertTypes.certificateRenewals}
              onChange={(checked) => patchAlertType("certificateRenewals", checked)}
            />
          </div>
        </Card>

        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security & Session</h2>
          </div>
          <div className="grid gap-3">
            <ToggleField label="Two-Factor Authentication" description="Require OTP at sign-in." checked={draft.security.twoFactor} onChange={(checked) => patch("security", { twoFactor: checked })} />
            <ToggleField label="Biometric Unlock (Mobile)" description="Allow fingerprint/face unlock where supported." checked={draft.security.biometric} onChange={(checked) => patch("security", { biometric: checked })} />
            <ToggleField
              label="IP Whitelisting"
              description="Restrict login to allowed IP addresses."
              checked={draft.security.ipWhitelistEnabled}
              onChange={(checked) => patch("security", { ipWhitelistEnabled: checked })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Session Timeout (minutes)</span>
              <input
                type="number"
                min={15}
                step={15}
                className={inputClassName}
                value={draft.security.sessionTimeoutMinutes}
                onChange={(e) => patch("security", { sessionTimeoutMinutes: Number(e.target.value) || 60 })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">IP Whitelist (comma-separated)</span>
              <input
                className={inputClassName}
                placeholder="192.168.1.10, 10.0.0.2"
                value={draft.security.ipWhitelist}
                onChange={(e) => patch("security", { ipWhitelist: e.target.value })}
              />
            </label>
          </div>
        </Card>

        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Blockchain & Verification</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Network Name</span>
              <input className={inputClassName} value={draft.blockchain.networkName} onChange={(e) => patch("blockchain", { networkName: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Chain ID</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.blockchain.chainId}
                onChange={(e) => patch("blockchain", { chainId: Number(e.target.value) || 1337 })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-700 dark:text-slate-200">Explorer Base URL</span>
              <input
                className={inputClassName}
                value={draft.blockchain.explorerBaseUrl}
                onChange={(e) => patch("blockchain", { explorerBaseUrl: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Preferred Wallet</span>
              <select
                className={inputClassName}
                value={draft.blockchain.preferredWallet}
                onChange={(e) => patch("blockchain", { preferredWallet: e.target.value as PlatformSettings["blockchain"]["preferredWallet"] })}
              >
                <option value="metamask">MetaMask</option>
                <option value="walletconnect">WalletConnect</option>
                <option value="coinbase">Coinbase Wallet</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Gas Mode</span>
              <select
                className={inputClassName}
                value={draft.blockchain.gasMode}
                onChange={(e) => patch("blockchain", { gasMode: e.target.value as PlatformSettings["blockchain"]["gasMode"] })}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Wallet Detection</p>
            {isMetaMaskInstalled ? (
              walletAddress ? (
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)} ({walletChainLabel})
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">MetaMask detected but not connected.</p>
              )
            ) : (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">MetaMask not detected in this browser.</p>
            )}
            {walletError ? <p className="mt-2 text-xs text-red-600 dark:text-red-300">{walletError}</p> : null}
            {isMetaMaskInstalled && !walletAddress ? (
              <Button type="button" size="sm" className="mt-3" onClick={() => void connectWallet()} disabled={isWalletConnecting}>
                {isWalletConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            ) : null}
          </div>
          <ToggleField
            label="Auto-verify on Checkpoint Submit"
            description="Automatically update verification status after checkpoint writes."
            checked={draft.blockchain.autoVerifyOnCheckpoint}
            onChange={(checked) => patch("blockchain", { autoVerifyOnCheckpoint: checked })}
          />
        </Card>

        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-cyan-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI & Analytics</h2>
          </div>
          <div className="grid gap-3">
            <ToggleField label="AI Assistant" description="Enable conversational assistant and suggestions." checked={draft.ai.assistantEnabled} onChange={(checked) => patch("ai", { assistantEnabled: checked })} />
            <ToggleField label="Natural Language Query" description="Allow text queries over datasets." checked={draft.ai.naturalLanguageQuery} onChange={(checked) => patch("ai", { naturalLanguageQuery: checked })} />
            <ToggleField label="Smart Recommendations" description="Enable predictive optimization cards." checked={draft.ai.smartRecommendations} onChange={(checked) => patch("ai", { smartRecommendations: checked })} />
          </div>
          <label className="text-sm">
            <span className="text-slate-700 dark:text-slate-200">Forecast Horizon</span>
            <select
              className={inputClassName}
              value={draft.ai.forecastDays}
              onChange={(e) => patch("ai", { forecastDays: Number(e.target.value) as PlatformSettings["ai"]["forecastDays"] })}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
        </Card>

        <Card className="space-y-4 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-blue" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard, IoT & Data</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Default Domain</span>
              <select
                className={inputClassName}
                value={draft.dashboard.defaultDomain}
                onChange={(e) => patch("dashboard", { defaultDomain: e.target.value as PlatformSettings["dashboard"]["defaultDomain"] })}
              >
                <option value="all">All Domains</option>
                <option value="agriculture">Agriculture</option>
                <option value="pharmaceutical">Pharmaceutical</option>
                <option value="food">Food Safety</option>
                <option value="ecommerce">E-commerce</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Default Date Range</span>
              <select
                className={inputClassName}
                value={draft.dashboard.defaultDateRange}
                onChange={(e) => patch("dashboard", { defaultDateRange: e.target.value as PlatformSettings["dashboard"]["defaultDateRange"] })}
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Auto-refresh (seconds)</span>
              <input
                type="number"
                min={5}
                className={inputClassName}
                value={draft.dashboard.autoRefreshSeconds}
                onChange={(e) => patch("dashboard", { autoRefreshSeconds: Number(e.target.value) || 30 })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Sensor Polling (seconds)</span>
              <input
                type="number"
                min={1}
                className={inputClassName}
                value={draft.iot.sensorPollingSeconds}
                onChange={(e) => patch("iot", { sensorPollingSeconds: Number(e.target.value) || 5 })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Anomaly Sensitivity</span>
              <select
                className={inputClassName}
                value={draft.iot.anomalySensitivity}
                onChange={(e) => patch("iot", { anomalySensitivity: e.target.value as PlatformSettings["iot"]["anomalySensitivity"] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Map Style</span>
              <select className={inputClassName} value={draft.iot.mapStyle} onChange={(e) => patch("iot", { mapStyle: e.target.value as PlatformSettings["iot"]["mapStyle"] })}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="satellite">Satellite</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Default Export Format</span>
              <select
                className={inputClassName}
                value={draft.dataGovernance.defaultExportFormat}
                onChange={(e) => patch("dataGovernance", { defaultExportFormat: e.target.value as PlatformSettings["dataGovernance"]["defaultExportFormat"] })}
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700 dark:text-slate-200">Audit Log Retention (days)</span>
              <input
                type="number"
                min={30}
                className={inputClassName}
                value={draft.dataGovernance.retainLogsDays}
                onChange={(e) => patch("dataGovernance", { retainLogsDays: Number(e.target.value) || 180 })}
              />
            </label>
          </div>
          <div className="grid gap-3">
            <ToggleField label="Show Dashboard Right Panel" description="Keep quick stats/activity panel visible." checked={draft.dashboard.showRightPanel} onChange={(checked) => patch("dashboard", { showRightPanel: checked })} />
            <ToggleField label="MQTT Sensor Stream Enabled" description="Consume IoT events from MQTT broker." checked={draft.iot.mqttEnabled} onChange={(checked) => patch("iot", { mqttEnabled: checked })} />
            <ToggleField label="Live Tracking Trail" description="Render movement path in map views." checked={draft.iot.liveTrackingTrail} onChange={(checked) => patch("iot", { liveTrackingTrail: checked })} />
            <ToggleField 
              label="Simulation Mode (Wokwi)" 
              description="Uses public HiveMQ broker for hardware simulation without local MQTT." 
              checked={draft.iot.simulationMode} 
              onChange={(checked) => patch("iot", { simulationMode: checked })} 
            />
            <ToggleField label="Anonymize Exports" description="Mask personal identifiers in exports." checked={draft.dataGovernance.anonymizeExports} onChange={(checked) => patch("dataGovernance", { anonymizeExports: checked })} />
            <ToggleField label="Telemetry Opt-In" description="Share anonymous usage metrics." checked={draft.dataGovernance.telemetryOptIn} onChange={(checked) => patch("dataGovernance", { telemetryOptIn: checked })} />
          </div>
        </Card>

        <Card className="space-y-4 lg:col-span-2 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Integrations & Webhooks</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField label="Enable Webhooks" description="Push events to external systems." checked={draft.integrations.webhookEnabled} onChange={(checked) => patch("integrations", { webhookEnabled: checked })} />
            <ToggleField label="SAP Integration" description="Enable SAP connector settings." checked={draft.integrations.sap} onChange={(checked) => patch("integrations", { sap: checked })} />
            <ToggleField label="Shopify Integration" description="Enable Shopify sync controls." checked={draft.integrations.shopify} onChange={(checked) => patch("integrations", { shopify: checked })} />
            <ToggleField label="AWS IoT Integration" description="Enable AWS IoT connector templates." checked={draft.integrations.awsIot} onChange={(checked) => patch("integrations", { awsIot: checked })} />
            <ToggleField label="FedEx Logistics API" description="Enable shipment status hooks." checked={draft.integrations.fedex} onChange={(checked) => patch("integrations", { fedex: checked })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-700 dark:text-slate-200">Webhook URL</span>
              <input
                className={inputClassName}
                placeholder="https://your-domain.com/webhooks/chaintrace"
                value={draft.integrations.webhookUrl}
                onChange={(e) => patch("integrations", { webhookUrl: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-slate-700 dark:text-slate-200">Webhook Signing Secret</span>
              <input
                className={inputClassName}
                placeholder="whsec_xxxxxxxxx"
                value={draft.integrations.webhookSecret}
                onChange={(e) => patch("integrations", { webhookSecret: e.target.value })}
              />
            </label>
          </div>
        </Card>

        <Card className="lg:col-span-2 dark:bg-slate-900/90">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Active theme is <span className="font-semibold capitalize">{theme}</span>. Settings are stored locally in your browser for this environment.
          </p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={resetAll}>
          Reset Defaults
        </Button>
        <Button type="button" onClick={saveSettings}>
          Save Settings
        </Button>
      </div>
    </main>
  );
}
